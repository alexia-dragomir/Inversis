import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { calendarDays, parseStrictJson, record, requireCondition, utcTimestamp } from '../src/data/ingestion/validation.ts';
import { readImerg } from './read-imerg.ts';
import { readImergArchive } from './read-imerg-archive.ts';
import { sha256 } from './verify-capture.ts';
import { cropExposure, cropWindows } from '../src/engine/exposures.ts';
import type { Observation, ProvenanceRecord } from '../src/domain/contracts';
import type { PrecipitationEvidence } from '../src/data/analysis-contract';

const root='public/evidence/history/imerg';
const temporary='.local/imerg-archive-validation';
await mkdir(temporary,{recursive:true});
const observations:Observation[]=[];const sources:ProvenanceRecord[]=[];
for(let year=2015;year<=2024;year++){
  const manifestBytes=await readFile(`${root}/${year}.manifest.json`);
  const manifest=record(parseStrictJson(manifestBytes.toString('utf8')),'annual manifest');
  const compressed=await readFile(`${root}/${year}.tar.gz`);
  requireCondition(manifest.schemaVersion==='inversis-imerg-year-v1'&&manifest.year===year&&manifest.archiveSha256===sha256(compressed)&&manifest.archiveBytes===compressed.length,'Annual archive identity/integrity mismatch');
  requireCondition(manifest.independentReaderCodeSha256===sha256(await readFile('scripts/build-imerg-history.py')),'Independent reader version mismatch');
  const files=readImergArchive(compressed,year);
  const days=calendarDays(`${year}-01-01`,`${year}-12-31`);
  requireCondition(files.size===days.length&&Array.isArray(manifest.captures)&&manifest.captures.length===days.length,'Incomplete annual date domain');
  const captures=manifest.captures.map(v=>record(v,'capture'));
  const sourceId=`IMERG-V07B-${year}-${manifest.archiveSha256}`;
  let lastRetrieval:string|null=null;
  for(const day of days){
    const matches=captures.filter(c=>c.day===day);requireCondition(matches.length===1,'Missing/duplicate daily capture');
    const capture=matches[0]!;const raw=files.get(`${day}.nc4`);
    requireCondition(raw&&capture.sha256===sha256(raw)&&capture.bytes===raw.length,'Daily archive hash mismatch');
    const receipt=record(capture.receipt,'original acquisition receipt');
    requireCondition(receipt.sha256===capture.sha256&&receipt.bytes===raw.length&&(receipt.sourceUrl??receipt.url)===capture.sourceUrl,'Daily receipt mismatch');
    const retrieval=capture.retrievalTimeUTC===null?null:utcTimestamp(capture.retrievalTimeUTC,'daily retrieval');
    if(retrieval!==null){requireCondition(receipt.status===200&&receipt.retrievedAtUTC===retrieval,'Unverified HTTP acquisition time/status');if(lastRetrieval===null||retrieval>lastRetrieval)lastRetrieval=retrieval;}
    else requireCondition(receipt.retrievalTimeUTC===null&&typeof receipt.registeredAtUTC==='string','Unknown browser retrieval time must stay explicit');
    const path=`${temporary}/${day}.nc4`;
    await writeFile(path,raw);
    const sample=await readImerg(path,day);
    requireCondition(sample.sourceMetadata.transformUrl===capture.sourceUrl&&sample.observation.rawValue===capture.rawValue&&sample.observation.validHalfHourlySamples===capture.count&&sample.observation.measurement.status===capture.status&&sample.spatialSupport.selected.latitude===capture.latitude&&sample.spatialSupport.selected.longitude===capture.longitude,'Independent Python/JS precipitation extraction disagreement');
    observations.push({...sample.observation,provenanceId:sourceId});
  }
  sources.push({id:sourceId,sourceId:'GPM_3IMERGDF/07',productFamily:'GPM IMERG Final daily',collectionVersion:'07',scienceVersion:'V07B',variablePath:'/precipitation and /precipitation_cnt',sourceType:'observation-derived',sourceUrl:'https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdf-07',doi:'10.5067/GPM/IMERGDF/DAY/07',queryOrGranule:`/evidence/history/imerg/${year}.manifest.json; daily exact NASA DAP4 requests and granule identities retained`,retrievalTimeUTC:lastRetrieval,sourceTimeStandard:'UTC',utcAlignment:'Each original UTC day uses exclusive next-midnight end; numeric inclusive source bounds retained in archived NetCDF.',temporalSupport:`${year}-01-01 through ${year}-12-31; daily means in mm/day, require all 48 valid half-hours; retrieval timestamp here is latest known daily capture, individual times in manifest.`,spatialSupport:{requestedCoordinates:{latitude:44.565,longitude:27.335},selectedCoordinates:{latitude:44.55,longitude:27.350000381469727},footprint:'Containing native 0.1-degree cell; original 3×3 source subset retained',nativeResolution:'0.1 degree',extractionMethod:'Containing native cell; no interpolation or spatial averaging'},rawUnit:'mm/day',fillValues:[-9999.900390625],processingVersion:'imerg-independent-annual-v1',transformations:['NASA DAP4 native spatial subset','Original daily NetCDF bytes retained in deterministic USTAR/gzip annual archive',`Daily manifest SHA-256 ${sha256(manifestBytes)}`,'Independent h5py and h5wasm extraction agreement','No accumulation conversion; no missing-value filling'],sha256:sha256(compressed),dependenceNotes:['Satellite/gauge merged estimate, not independent field measurement.','48 valid half-hours verify temporal support, not geophysical accuracy.']});
  console.log(`IMERG ${year}: ${days.length} original daily binaries independently cross-checked`);
}
const exposures=[0,-7,7,-14,14].flatMap(shift=>Array.from({length:10},(_,i)=>2015+i).flatMap(year=>cropWindows.map(w=>cropExposure('reference-population',w.crop,year,'dry-spell',observations,shift))));
const physical=exposures.filter(e=>e.calendarShiftDays===0&&e.physical.status==='valid').map(e=>e.physical.status==='valid'?e.physical.quantity.value:NaN);
requireCondition(physical.length===40,'Predeclared dry-spell reference requires 40 complete unshifted crop-years');
const processingHashes:Record<string,string>={};
for(const path of ['scripts/build-imerg-analysis-evidence.ts','scripts/build-imerg-history.py','scripts/read-imerg.ts','scripts/read-imerg-archive.ts','src/data/ingestion/imerg.ts','src/data/ingestion/validation.ts','src/engine/exposures.ts','src/engine/decision.ts','src/engine/analysis.ts','src/engine/stability.ts','src/engine/interpretation.ts','src/engine/canonical.ts','src/domain/contracts.ts','src/data/analysis-contract.ts','package-lock.json'])processingHashes[path]=sha256(await readFile(path));
const valid=observations.filter(o=>o.measurement.status==='valid').length;
const result:PrecipitationEvidence={schemaVersion:'inversis-precipitation-history-v1',dailyCoverage:{expected:3653,available:observations.length,valid,missing:observations.length-valid},sourceManifest:sources,cropYearExposures:exposures,references:[{id:'dry-pooled-40-crop-years-2015-2024-v1',indicator:'dry-spell',lower:{value:Math.min(...physical),unit:'days'},upper:{value:Math.max(...physical),unit:'days'},direction:'higher-is-worse',candidateIndependent:true,populationDefinition:'All four provisional crop windows in each year 2015–2024, zero calendar shift: 40 distinct crop-years, independent of candidate order, eligibility and weights. Bounds fixed for shifts; clip to [0,1].',sourceRefs:sources.map(s=>s.id) as [string,...string[]],processingVersion:'fixed-pooled-reference-v1'}],processingHashes,limitations:['Daily precipitation rates are environmental evidence, not field water balance or crop damage.','Dry-spell threshold <1 mm/day and provisional crop windows are illustrative assumptions.','Longer crop windows can admit longer dry runs; normalized swings do not equate biological vulnerability.','No soil, disease, management or previous-crop suitability is established.','Historical windows overlap; no probability or future-climate inference.']};
requireCondition(result.dailyCoverage.available===3653,'Historical date coverage incomplete');
const output=JSON.stringify(result,null,2)+'\n';const target='public/evidence/history/imerg-analysis-input.json';
if(process.argv.includes('--verify'))requireCondition(await readFile(target,'utf8')===output,'Historical IMERG evidence differs from verified regeneration');
else await writeFile(target,output);
console.log(`IMERG ${valid}/3653 valid daily cells; ${exposures.length} crop/year/shift exposures; fixed reference 40 crop-years. No candidate ranking performed in ingestion.`);
