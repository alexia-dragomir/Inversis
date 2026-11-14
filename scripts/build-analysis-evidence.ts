import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createPowerRequest, parsePower } from '../src/data/ingestion/power.ts';
import { parseStrictJson, requireCondition } from '../src/data/ingestion/validation.ts';
import { sha256, verifyCapture } from './verify-capture.ts';
import { cropExposure, cropWindows } from '../src/engine/exposures.ts';
import type { Observation, ProvenanceRecord } from '../src/domain/contracts.ts';
import type { AnalysisEvidence } from '../src/data/analysis-contract.ts';

const observations: Observation[] = [];
const sources: ProvenanceRecord[] = [];
for (let year = 2015; year <= 2024; year++) {
  const base = `public/evidence/history/power/${year}`;
  const raw = await readFile(`${base}.json`);
  const request = createPowerRequest(`${year}-01-01`, `${year}-12-31`);
  const capture = verifyCapture(raw, parseStrictJson(await readFile(`${base}.receipt.json`, 'utf8')), request.url);
  const sample = parsePower(parseStrictJson(raw.toString('utf8')), capture, request);
  observations.push(...sample.observations); sources.push(sample.provenance);
}
const exposures = [0, -7, 7, -14, 14].flatMap(shift => Array.from({length:10},(_, i) => 2015+i).flatMap(year => cropWindows.map(w => cropExposure('reference-population', w.crop, year, 'heat-fraction', observations, shift))));
const referenceValues = exposures.filter(e => e.calendarShiftDays === 0 && e.physical.status === 'valid').map(e => e.physical.status === 'valid' ? e.physical.quantity.value : NaN);
requireCondition(referenceValues.length === 40, 'Reference protocol requires all 40 valid crop-years before comparison');
const processingHashes: Record<string,string> = {};
for (const name of ['scripts/build-analysis-evidence.ts', 'scripts/verify-capture.ts', 'src/data/ingestion/power.ts', 'src/data/ingestion/validation.ts', 'src/data/foundation.ts', 'src/domain/contracts.ts','src/data/analysis-contract.ts', 'src/engine/exposures.ts', 'src/engine/decision.ts', 'src/engine/canonical.ts', 'src/engine/analysis.ts', 'src/engine/stability.ts', 'package-lock.json']) processingHashes[name] = sha256(await readFile(name));
const evidence: AnalysisEvidence = {
  schemaVersion: 'inversis-evidence-v1', source: 'NASA POWER T2M_MAX', period: { startYear: 2015, endYear: 2024 },
  dailyCoverage: { expected: 3653, valid: observations.filter(o => o.measurement.status === 'valid').length, missing: observations.filter(o => o.measurement.status !== 'valid').length },
  sourceManifest: sources, cropYearExposures: exposures,
  references: [{ id: 'heat-pooled-40-crop-years-2015-2024-v1', indicator: 'heat-fraction', lower: { value: Math.min(...referenceValues), unit: 'fraction' }, upper: { value: Math.max(...referenceValues), unit: 'fraction' }, direction: 'higher-is-worse', populationDefinition: 'All four provisional crop windows in each year 2015–2024, zero calendar shift: 40 distinct crop-years, independent of candidate order and eligibility. Bounds fixed for shifted-window diagnostics; clip to [0,1].', sourceRefs: sources.map(s => s.id) as [string, ...string[]], candidateIndependent: true, processingVersion: 'fixed-pooled-reference-v1' }],
  processingHashes,
  limitations: ['Reduced heat-only model: precipitation is omitted from this calculation; no drought or combined climate recommendation.', 'Illustrative ≥35°C threshold and provisional crop windows, not crop-specific damage calibration.', 'Equal weight to each of five crop positions; not area-, yield- or profit-weighted.', 'Six overlapping windows are historical replays, not independent statistical samples.', 'Minimum two common scenarios is an author comparison convention, not a statistical confidence threshold.', 'Unknown soil, disease, management and previous crops keep all plans conditional.'],
};
await mkdir('public/evidence/history', { recursive: true });
const output = JSON.stringify(evidence, null, 2) + '\n';
const path = 'public/evidence/history/analysis-input.json';
if (process.argv.includes('--verify')) requireCondition(await readFile(path, 'utf8') === output, 'Analysis evidence differs from deterministic regeneration');
else await writeFile(path, output);
console.log(`POWER ${evidence.dailyCoverage.valid}/3653 days; ${exposures.length} crop-year/shift records; fixed reference from ${referenceValues.length} crop-years. No precipitation history inferred.`);
