import { readFile, readdir, writeFile } from 'node:fs/promises';
import { readImerg } from './read-imerg.ts';
import { sha256, verifyImportedNetcdf } from './verify-capture.ts';
import { calendarDays, parseStrictJson, requireCondition } from '../src/data/ingestion/validation.ts';

const root='public/evidence/imerg-dap4';
const files=(await readdir(root)).filter(f=>/^\d{4}-\d{2}-\d{2}\.nc4$/.test(f)).sort();
const samples=[];
for(const file of files){
  const sample=await readImerg(`${root}/${file}`,file.slice(0,10));
  const receipt=verifyImportedNetcdf(parseStrictJson(await readFile(`${root}/${file}.receipt.json`,'utf8')),sample);
  samples.push({...sample,receipt,rawPath:`/evidence/imerg-dap4/${file}`});
}
const expected=calendarDays('2024-01-01','2024-01-07');
const valid=samples.filter(s=>s.observation.measurement.status==='valid');
const available=new Set(valid.map(s=>s.observation.timeStartUTC.slice(0,10)));
const historicalDays=calendarDays('2015-01-01','2024-12-31');
requireCondition(samples.every(s=>historicalDays.includes(s.observation.timeStartUTC.slice(0,10))),'Source dates outside declared historical domain');
const processingHashes=Object.fromEntries(await Promise.all(['scripts/build-imerg-series.ts','scripts/read-imerg.ts','scripts/verify-capture.ts','src/data/ingestion/imerg.ts','src/data/ingestion/validation.ts','package-lock.json'].map(async path=>[path,sha256(await readFile(path))])));
const output=JSON.stringify({schemaVersion:'inversis-imerg-series-v1',collection:'GPM_3IMERGDF',version:'07',scienceVersion:'V07B',timeStandard:'UTC',unit:'mm/day',sampleCoverage:{start:expected[0],end:expected.at(-1),expectedDays:7,validDays:expected.filter(d=>available.has(d)).length,missingOrUnverifiedDays:expected.filter(d=>!available.has(d))},historicalCoverage:{start:'2015-01-01',end:'2024-12-31',expectedDays:3653,validDays:available.size,complete:available.size===3653},eligibleForHistoricalComparison:false,processingHashes,samples},null,2)+'\n';
if(process.argv.includes('--verify'))requireCondition(await readFile(`${root}/manifest.json`,'utf8')===output,'IMERG series manifest differs from validated regeneration');
else await writeFile(`${root}/manifest.json`,output);
console.log(`IMERG: ${valid.length} valid actual daily cells; ${expected.filter(d=>available.has(d)).length}/7 sample days; no historical comparison admission.`);
