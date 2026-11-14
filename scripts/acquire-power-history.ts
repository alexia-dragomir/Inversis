import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createPowerRequest, parsePower } from '../src/data/ingestion/power.ts';
import { parseStrictJson, requireCondition } from '../src/data/ingestion/validation.ts';
import { sha256, verifyCapture } from './verify-capture.ts';

const directory = 'public/evidence/history/power';
await mkdir(directory, { recursive: true });
const summaries = [];
for (let year = 2015; year <= 2024; year++) {
  const request = createPowerRequest(`${year}-01-01`, `${year}-12-31`);
  let raw: Buffer;
  try { raw = await readFile(`${directory}/${year}.json`); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || process.argv.includes('--verify')) throw error;
    const retrievedAt = new Date().toISOString();
    const response = await fetch(request.url, { signal: AbortSignal.timeout(45000), redirect: 'error' });
    requireCondition(response.status === 200 && response.headers.get('content-type')?.includes('json'), `POWER ${year}: HTTP ${response.status}, not validated NASA JSON`);
    raw = Buffer.from(await response.arrayBuffer());
    requireCondition(raw.length < 2_000_000, 'Unexpected POWER response size');
    const receipt = { url: request.url, retrievedAt, status: response.status, contentType: response.headers.get('content-type'), bytes: raw.length, sha256: sha256(raw) };
    // Parse before retaining any file as evidence. Gaps are preserved, never filled.
    parsePower(parseStrictJson(raw.toString('utf8')), verifyCapture(raw, receipt, request.url), request);
    await writeFile(`${directory}/${year}.receipt.json`, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    await writeFile(`${directory}/${year}.json`, raw, { flag: 'wx' });
  }
  const receipt = parseStrictJson(await readFile(`${directory}/${year}.receipt.json`, 'utf8'));
  const result = parsePower(parseStrictJson(raw.toString('utf8')), verifyCapture(raw, receipt, request.url), request);
  summaries.push({ year, ...result.coverage, sha256: result.provenance.sha256 });
  console.log(`${year}: ${result.coverage.validDays}/${result.coverage.expectedDays} valid POWER days`);
}
const output = JSON.stringify({ source: 'NASA POWER T2M_MAX', timeStandard: 'UTC', unit: 'degC', summaries, cropComparisonEstablished: false }, null, 2) + '\n';
if (process.argv.includes('--verify')) requireCondition(await readFile(`${directory}/coverage.json`, 'utf8') === output, 'POWER historical coverage manifest differs');
else await writeFile(`${directory}/coverage.json`, output);
