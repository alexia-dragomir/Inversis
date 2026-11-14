import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { calendarDays, parseStrictJson, record, requireCondition, text } from '../src/data/ingestion/validation.ts';
import { sha256 } from './verify-capture.ts';

// Secrets are read only from this ignored, owner-provided file; never logged or copied.
// No browser cookie extraction, global credential lookup, or credential creation.
const [job, start, end] = process.argv.slice(2);
requireCondition(job && /^[0-9a-f-]{36}$/.test(job), 'Expected explicit Harmony job UUID');
requireCondition(start && end, 'Usage: node --experimental-strip-types scripts/download-harmony.ts JOB START END [--catalog-only]');
const days = calendarDays(start, end);
const base = 'https://harmony.earthdata.nasa.gov';
const root = `${base}/stac/${job}/`;
const directory = `.local/history/harmony/${job}`;
await mkdir(directory, { recursive: true });
let token = '';
if (!process.argv.includes('--catalog-only')) {
  try { token = (await readFile('.local/earthdata-token.txt', 'utf8')).trim(); }
  catch { throw new Error('Bulk download needs an owner-provided Earthdata bearer token in ignored .local/earthdata-token.txt. Do not paste it into chat or commit it. --catalog-only requires no token.'); }
  requireCondition(token.length > 20 && !/\s/.test(token), 'Malformed local Earthdata token');
}

async function fetchBounded(url: string, authenticate = false) {
  let current = new URL(url);
  requireCondition(current.origin === base, 'Expected NASA Harmony request');
  for (let redirects = 0; redirects < 5; redirects++) {
    const allowedDataHost = /^harmony-prod-staging\.s3(?:\.[a-z0-9-]+)?\.amazonaws\.com$/.test(current.hostname);
    requireCondition(current.protocol === 'https:' && (current.origin === base || allowedDataHost) && !current.username && !current.password, 'Unexpected download redirect host');
    const headers: Record<string, string> = {};
    if (authenticate && current.origin === base) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(current, { headers, signal: AbortSignal.timeout(60000), redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get('location') ?? '', current);
      requireCondition(next.hostname !== 'urs.earthdata.nasa.gov', 'NASA requires valid terminal authentication; browser sign-in is separate');
      current = next; continue;
    }
    requireCondition(response.status === 200, `NASA Harmony HTTP ${response.status}; no data admitted`);
    const chunks: Uint8Array[] = []; let length = 0;
    for await (const chunk of response.body ?? []) { length += chunk.length; requireCondition(length < 10_000_000, 'Unexpected result size'); chunks.push(chunk); }
    return { bytes: Buffer.concat(chunks), contentType: response.headers.get('content-type'), retrievedAt: new Date().toISOString() };
  }
  throw new Error('Too many NASA redirects');
}

async function captureJson(url: string, name: string) {
  let bytes: Buffer;
  try {
    bytes = await readFile(`${directory}/${name}.json`);
    const receipt = record(parseStrictJson(await readFile(`${directory}/${name}.receipt.json`, 'utf8')), 'receipt');
    requireCondition(receipt.sha256 === sha256(bytes) && receipt.url === url, 'Cached NASA metadata integrity mismatch');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const result = await fetchBounded(url);
    requireCondition(result.contentType?.includes('json'), 'NASA returned non-JSON metadata');
    bytes = result.bytes;
    await writeFile(`${directory}/${name}.json`, bytes);
    await writeFile(`${directory}/${name}.receipt.json`, JSON.stringify({ url, retrievedAt: result.retrievedAt, contentType: result.contentType, bytes: bytes.length, sha256: sha256(bytes) }, null, 2) + '\n');
  }
  return record(parseStrictJson(bytes.toString('utf8')), 'STAC');
}

let pageUrl: string | null = root;
const items: { day: string; sourceUrl: string; stacItemUrl: string }[] = [];
const seenPages = new Set<string>();
while (pageUrl) {
  requireCondition(!seenPages.has(pageUrl) && seenPages.size < 10, 'STAC pagination cycle/limit');
  seenPages.add(pageUrl);
  const catalog = await captureJson(pageUrl, `catalog-${seenPages.size}`);
  requireCondition(catalog.id === job && Array.isArray(catalog.links), 'STAC catalog identity/links mismatch');
  const description = text(catalog.description, 'STAC request');
  requireCondition(description.includes('C2723754864-GES_DISC') && description.includes('precipitation_cnt'), 'Job must preserve Final V07 precipitation and counts');
  const links = catalog.links.map(v => record(v, 'STAC link'));
  for (const link of links.filter(l => l.rel === 'item')) {
    const itemUrl = new URL(text(link.href, 'item URL'), root).href;
    requireCondition(itemUrl.startsWith(root), 'Unexpected STAC item host/path');
    const item = await captureJson(itemUrl, `item-${items.length}`);
    const properties = record(item.properties, 'STAC properties');
    const day = text(properties.start_datetime, 'start').slice(0, 10);
    requireCondition(days.includes(day) && !items.some(i => i.day === day), 'Unexpected/duplicate STAC day');
    requireCondition(properties.start_datetime === `${day}T00:00:00.000Z` && properties.end_datetime === `${day}T23:59:59.999Z`, 'STAC UTC day mismatch');
    const assets = Object.values(record(item.assets, 'STAC assets')).map(a => record(a, 'asset'));
    requireCondition(assets.length === 1, 'Ambiguous STAC data asset');
    const asset = new URL(text(assets[0]!.href, 'S3 asset'));
    requireCondition(asset.protocol === 's3:' && asset.hostname === 'harmony-prod-staging' && asset.pathname.startsWith(`/public/${job}/`) && !asset.search, 'Unexpected staging asset');
    requireCondition(asset.pathname.includes(`GPM_3IMERGDF.07_3B-DAY.MS.MRG.3IMERG.${day.replaceAll('-', '')}-S000000-E235959.V07B_subsetted.nc4`), 'Wrong source granule/version');
    items.push({ day, sourceUrl: `${base}/service-results/${asset.hostname}${asset.pathname}`, stacItemUrl: itemUrl });
  }
  const next = links.filter(l => l.rel === 'next');
  requireCondition(next.length <= 1, 'Ambiguous STAC next page');
  pageUrl = next.length ? new URL(text(next[0]!.href, 'next URL'), root).href : null;
  if (pageUrl) requireCondition(pageUrl.startsWith(root), 'Unexpected STAC pagination URL');
}
const missing = days.filter(d => !items.some(i => i.day === d));
await writeFile(`${directory}/download-plan.json`, JSON.stringify({ job, start, end, requestedDays: days.length, catalogDays: items.length, missingDays: missing, items, observationsValidated: false }, null, 2) + '\n');
requireCondition(missing.length === 0, `STAC missing ${missing.length} requested days; do not claim full coverage`);
console.log(`NASA STAC: ${items.length}/${days.length} daily outputs discovered; measurements not yet validated.`);
if (!process.argv.includes('--catalog-only')) for (const item of items.sort((a,b) => a.day.localeCompare(b.day))) {
  const name = `${directory}/${item.day}.nc4`;
  try {
    const cached = await readFile(name);
    const receipt = record(parseStrictJson(await readFile(`${name}.receipt.json`, 'utf8')), 'download receipt');
    requireCondition(receipt.sha256 === sha256(cached) && receipt.url === item.sourceUrl, 'Cached data integrity mismatch');
    console.log(`${item.day}: verified cached bytes`); continue;
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const result = await fetchBounded(item.sourceUrl, true);
  requireCondition(result.bytes.subarray(0,8).toString('hex') === '894844460d0a1a0a', 'Expected NetCDF4, not a login response');
  await writeFile(name, result.bytes);
  await writeFile(`${name}.receipt.json`, JSON.stringify({ url: item.sourceUrl, stacItemUrl: item.stacItemUrl, retrievedAt: result.retrievedAt, bytes: result.bytes.length, sha256: sha256(result.bytes), contentType: result.contentType, measurementValidation: 'pending' }, null, 2) + '\n');
  console.log(`${item.day}: downloaded ${result.bytes.length} bytes; scientific validation pending`);
}
