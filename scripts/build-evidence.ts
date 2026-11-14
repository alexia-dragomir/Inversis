// Offline, deterministic validation. Acquisition is separate from interpretation.
import { readFile, writeFile } from 'node:fs/promises';
import { parsePower, powerRequest } from '../src/data/ingestion/power.ts';
import { parseStrictJson, requireCondition } from '../src/data/ingestion/validation.ts';
import { sha256, verifyCapture, verifyImportedNetcdf } from './verify-capture.ts';
import { imergCollectionUrl, imergGranuleUrl, parseImergDiscovery } from '../src/data/ingestion/imerg-discovery.ts';
import { readImerg } from './read-imerg.ts';

const directory = 'public/evidence/stage1';
const raw = await readFile(`${directory}/raw/power.json`);
const receipt = parseStrictJson(await readFile(`${directory}/raw/power.receipt.json`, 'utf8'));
const capture = verifyCapture(raw, receipt, powerRequest.url);
const sample = parsePower(parseStrictJson(raw.toString('utf8')), capture);
const processingFiles = ['src/data/ingestion/validation.ts', 'src/data/ingestion/power.ts', 'src/data/ingestion/imerg-discovery.ts', 'src/data/ingestion/imerg.ts', 'scripts/verify-capture.ts', 'scripts/read-imerg.ts', 'scripts/build-evidence.ts', 'package-lock.json'];
const processingHashes: Record<string, string> = {};
for (const file of processingFiles) processingHashes[file] = sha256(await readFile(file));
const cmrInputs: unknown[] = [];
const cmrCaptures = [];
for (const [name, url] of [['imerg-collections', imergCollectionUrl], ['imerg-granules', imergGranuleUrl]] as const) {
  const bytes = await readFile(`${directory}/raw/${name}.json`);
  const receipt = parseStrictJson(await readFile(`${directory}/raw/${name}.receipt.json`, 'utf8'));
  cmrCaptures.push(verifyCapture(bytes, receipt, url));
  cmrInputs.push(parseStrictJson(bytes.toString('utf8')));
}
const discovery = parseImergDiscovery(cmrInputs[0], cmrInputs[1]);
const imerg = await readImerg(`${directory}/raw/imerg-20240101.nc4`, '2024-01-01');
const repeat = await readImerg(`${directory}/raw/imerg-20240101-repeat.nc4`, '2024-01-01');
const importReceipts = [];
for (const [name, sample] of [['imerg-20240101', imerg], ['imerg-20240101-repeat', repeat]] as const) {
  const receipt = verifyImportedNetcdf(parseStrictJson(await readFile(`${directory}/raw/${name}.receipt.json`, 'utf8')), sample);
  importReceipts.push(receipt);
}
requireCondition(imerg.observation.rawValue === repeat.observation.rawValue && imerg.observation.validHalfHourlySamples === repeat.observation.validHalfHourlySamples && JSON.stringify(imerg.spatialSupport) === JSON.stringify(repeat.spatialSupport), 'Repeat retrieval changes sample; review required');
for (const [name, value] of [
  ['power.sample.json', { ...sample, processingHashes }],
  ['imerg.discovery.json', { ...discovery, captures: cmrCaptures, processingHashes }],
  ['imerg.sample.json', { ...imerg, acquisition: importReceipts[0], repeatVerification: { acquisition: importReceipts[1], sameValueCountAndGrid: true }, coverage: { expectedDays: 1, validDays: imerg.observation.measurement.status === 'valid' ? 1 : 0, historicalCoverageEstablished: false }, processingHashes }],
] as const) {
  const output = JSON.stringify(value, null, 2) + '\n';
  if (process.argv.includes('--verify')) {
    requireCondition(await readFile(`${directory}/${name}`, 'utf8') === output, `${name} differs from deterministic reprocessing; run npm run evidence:build and review`);
  } else await writeFile(`${directory}/${name}`, output);
}
console.log(`POWER: ${sample.coverage.validDays}/${sample.coverage.expectedDays} valid days. IMERG: one real daily cell, ${imerg.observation.validHalfHourlySamples}/48 samples, repeat verified. Historical crop comparison withheld.`);
