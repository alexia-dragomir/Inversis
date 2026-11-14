// Stage 1 public, credential-free acquisition probe. No scientific interpretation.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import console from 'node:console';

const targets = {
  power: 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX&community=AG&longitude=27.335&latitude=44.565&start=20240101&end=20240107&format=JSON&time-standard=UTC',
  'imerg-collections': 'https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=GPM_3IMERGDF&version=07&page_size=10',
  'imerg-granules': 'https://cmr.earthdata.nasa.gov/search/granules.umm_json?collection_concept_id=C2723754864-GES_DISC&temporal=2024-01-01T00%3A00%3A00Z%2C2024-01-01T23%3A59%3A59Z&point=27.335%2C44.565&page_size=2',
};
// Access URLs come from the retained CMR granule, never a guessed legacy host.
if (process.argv[2]?.startsWith('imerg-') && !['imerg-collections', 'imerg-granules'].includes(process.argv[2])) {
  const cmr = JSON.parse(await readFile('.local/stage1/imerg-granules.json', 'utf8'));
  const links = cmr.items[0].umm.RelatedUrls;
  const dap = links.find(link => link.Subtype === 'OPENDAP DATA').URL;
  targets['imerg-dds'] = dap + '.dds';
  targets['imerg-das'] = dap + '.das';
  targets['imerg-download'] = links.find(link => link.Type === 'GET DATA').URL;
  targets['imerg-granule'] = targets['imerg-download'];
}
const name = process.argv[2];
if (!(name in targets)) throw new Error('Choose a named NASA probe');
await mkdir('.local/stage1', { recursive: true });
const url = targets[name];
const extension = name === 'imerg-granule' ? 'nc4' : ['power', 'imerg-collections', 'imerg-granules'].includes(name) ? 'json' : 'txt';
if (!process.argv.includes('--refresh')) {
  try {
    const saved = JSON.parse(await readFile(`.local/stage1/${name}.receipt.json`, 'utf8'));
    const bytes = await readFile(`.local/stage1/${name}.${extension}`);
    if (saved.status === 200 && saved.url === url && saved.sha256 === createHash('sha256').update(bytes).digest('hex')) {
      console.log(`Reusing verified capture: ${name} (${saved.retrievedAt}). Use --refresh for an intentional new retrieval.`);
      process.exit(0);
    }
  } catch { /* No reusable successful capture; request below. */ }
}
const retrievedAt = new Date().toISOString();
const response = await fetch(url, { method: name === 'imerg-download' ? 'HEAD' : 'GET', signal: AbortSignal.timeout(45000), redirect: name === 'imerg-granule' ? 'follow' : 'manual' });
const chunks = [];
let length = 0;
for await (const chunk of response.body ?? []) {
  length += chunk.length;
  if (length > (name === 'imerg-granule' ? 40_000_000 : 3_000_000)) throw new Error('Probe exceeds small-sample limit');
  chunks.push(chunk);
}
const raw = Buffer.concat(chunks);
const receipt = { url, retrievedAt, status: response.status, contentType: response.headers.get('content-type'), bytes: raw.length, sha256: createHash('sha256').update(raw).digest('hex') };
const redirect = response.headers.get('location');
if (redirect) { const location = new URL(redirect, url); receipt.redirectDestination = location.origin + location.pathname; }
await writeFile(`.local/stage1/${name}.receipt.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
if (!response.ok) throw new Error(`NASA request failed: ${response.status}, ${receipt.contentType}`);
if (name === 'imerg-download') throw new Error('HEAD succeeded; data body has not been acquired');
if (name === 'imerg-granule') {
  if (raw.subarray(0, 8).toString('hex') !== '894844460d0a1a0a') throw new Error('Expected HDF5/NetCDF4 data, not a login response');
  await writeFile('.local/stage1/imerg-granule.nc4', raw);
  process.exit(0);
}
const isJson = ['power', 'imerg-collections', 'imerg-granules'].includes(name);
if (isJson) {
  if (!receipt.contentType?.includes('json')) throw new Error('Expected NASA JSON, not an HTML login page');
  JSON.parse(raw.toString('utf8'));
} else if (!receipt.contentType?.includes('text/plain')) throw new Error('Expected DAP text metadata');
await writeFile(`.local/stage1/${name}.${isJson ? 'json' : 'txt'}`, raw);
