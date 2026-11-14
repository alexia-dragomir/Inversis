import { readFile } from 'node:fs/promises';
import { fingerprint } from '../src/engine/canonical.ts';
import { parseStrictJson, record, requireCondition } from '../src/data/ingestion/validation.ts';

const path = process.argv[2];
requireCondition(path, 'Usage: npm run certificate:verify -- PATH');
const data = record(parseStrictJson(await readFile(path, 'utf8')), 'certificate');
requireCondition(data.schemaVersion === 'inversis-certificate-v1' && data.canonicalizationVersion === 'sorted-json-v1', 'Unsupported certificate format');
const { fingerprint: claimed, generatedAtUTC, ...body } = data;
void generatedAtUTC;
requireCondition(typeof claimed === 'string' && claimed === await fingerprint(body), 'Certificate integrity mismatch');
console.log(`Verified SHA-256 ${claimed}. Integrity only; not independent scientific validation or endorsement.`);
