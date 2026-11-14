import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { calendarDays, parseStrictJson, record, requireCondition, text } from '../src/data/ingestion/validation.ts';
import { sha256 } from './verify-capture.ts';

const [start='2024-01-01',end='2024-01-07']=process.argv.slice(2);
const days=calendarDays(start,end,31);
const directory=`.local/imerg-dap4/${start}_${end}`;
await mkdir(directory,{recursive:true});
const url=new URL('https://cmr.earthdata.nasa.gov/search/granules.umm_json');
url.search=new URLSearchParams({collection_concept_id:'C2723754864-GES_DISC',temporal:`${start}T00:00:00Z,${end}T23:59:59Z`,point:'27.335,44.565',page_size:String(days.length+1)}).toString();
let bytes:Buffer;
try {
  bytes=await readFile(`${directory}/cmr.json`);
  const receipt=record(parseStrictJson(await readFile(`${directory}/cmr.receipt.json`,'utf8')),'receipt');
  requireCondition(receipt.url===url.href&&receipt.sha256===sha256(bytes),'Cached CMR integrity mismatch');
}catch(error){
  if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  requireCondition(response.status===200&&response.headers.get('content-type')?.includes('json'),'CMR request failed');
  bytes=Buffer.from(await response.arrayBuffer());
  requireCondition(bytes.length<1_000_000,'Unexpected CMR response size');
  await writeFile(`${directory}/cmr.json`,bytes);
  await writeFile(`${directory}/cmr.receipt.json`,JSON.stringify({url:url.href,retrievedAt:new Date().toISOString(),sha256:sha256(bytes),bytes:bytes.length},null,2)+'\n');
}
const metadata=record(parseStrictJson(bytes.toString('utf8')),'CMR');
requireCondition(Array.isArray(metadata.items)&&metadata.items.length===days.length,'CMR daily coverage incomplete/ambiguous');
const seen=new Set<string>();
const items=metadata.items.map(value=>{
  const item=record(value,'item');const umm=record(item.umm,'UMM');
  const temporal=record(record(umm.TemporalExtent,'temporal').RangeDateTime,'range');
  const day=text(temporal.BeginningDateTime,'start').slice(0,10);
  requireCondition(days.includes(day)&&!seen.has(day),'Unexpected/duplicate granule day');seen.add(day);
  requireCondition(Array.isArray(umm.RelatedUrls),'Missing source links');
  const dap=umm.RelatedUrls.map(v=>record(v,'link')).filter(v=>v.Subtype==='OPENDAP DATA');
  requireCondition(dap.length===1,'Ambiguous OPeNDAP endpoint');
  const endpoint=new URL(text(dap[0]!.URL,'DAP URL'));
  requireCondition(endpoint.origin==='https://opendap.earthdata.nasa.gov'&&endpoint.pathname.includes('/collections/C2723754864-GES_DISC/')&&!endpoint.search,'Unexpected DAP origin/collection');
  requireCondition(endpoint.pathname.includes(`${day.replaceAll('-','')}-S000000-E235959.V07B`),'Wrong day/science version');
  endpoint.pathname+='.dap.nc4';
  endpoint.searchParams.set('dap4.ce','/lon[2072:2074];/time;/precipitation_cnt[][2072:2074][1344:1346];/time_bnds;/lat[1344:1346];/precipitation[][2072:2074][1344:1346]');
  return {day,url:endpoint.href,cmr:record(item.meta,'CMR identity'),status:'not-downloaded'};
}).sort((a,b)=>a.day.localeCompare(b.day));
await writeFile(`${directory}/plan.json`,JSON.stringify({method:'Reuse source-backed DAP4 transform, native 3x3 subset; validate every output independently',start,end,cmrSha256:sha256(bytes),items},null,2)+'\n');
console.log(JSON.stringify({directory,days:items.length,items},null,2));
