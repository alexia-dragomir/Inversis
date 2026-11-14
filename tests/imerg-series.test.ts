import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { readImerg } from '../scripts/read-imerg';
import { sha256, verifyImportedNetcdf } from '../scripts/verify-capture';
import manifest from '../public/evidence/imerg-dap4/manifest.json';
import oracle from '../public/evidence/imerg-dap4/independent-oracle.json';

it('all seven real daily NetCDFs agree exactly with the independent h5py reader and retained receipts',async()=>{
  expect(oracle.oracleCodeSha256).toBe(sha256(readFileSync('scripts/independent-imerg-oracle.py')));
  expect(oracle.observations).toHaveLength(7);
  for(const expected of oracle.observations){
    const path=`public/evidence/imerg-dap4/${expected.day}.nc4`;
    const actual=await readImerg(path,expected.day);
    verifyImportedNetcdf(JSON.parse(readFileSync(`${path}.receipt.json`,'utf8')),actual);
    expect(actual.sha256).toBe(expected.sha256);
    expect(actual.observation.rawValue).toBe(expected.rawValue);
    expect(actual.observation.validHalfHourlySamples).toBe(expected.count);
    expect(actual.observation.measurement.status).toBe(expected.status);
    expect(actual.spatialSupport.selected).toEqual({latitude:expected.latitude,longitude:expected.longitude});
    const retained=manifest.samples.find(s=>s.observation.timeStartUTC.startsWith(expected.day))!;
    expect(retained.observation).toEqual(actual.observation);
  }
});
it('retains nonzero rainfall and valid physical zeros without turning seven days into historical coverage',()=>{
  expect(manifest.sampleCoverage).toMatchObject({expectedDays:7,validDays:7,missingOrUnverifiedDays:[]});
  expect(manifest.historicalCoverage).toMatchObject({expectedDays:3653,validDays:7,complete:false});
  expect(manifest.eligibleForHistoricalComparison).toBe(false);
  expect(oracle.observations.map(o=>Number(o.rawValue.toFixed(2)))).toEqual([0,3.08,5.65,.03,0,.01,15.74]);
});
