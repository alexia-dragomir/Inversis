import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readImerg } from './read-imerg.ts';
import { sha256 } from './verify-capture.ts';
import { parseStrictJson, record, requireCondition, text, dayUTC } from '../src/data/ingestion/validation.ts';

// Independently authorized NASA bearer-token route, not a browser-cookie transfer
// or a request to a rejected Harmony/signed-URL endpoint. One request at a time.
const path=process.argv[2];
requireCondition(path,'Usage: node --experimental-strip-types scripts/download-imerg-dap4.ts PLAN.json');
const plan=record(parseStrictJson(await readFile(path,'utf8')),'plan');
const cmr=await readFile(`${dirname(path)}/cmr.json`);
requireCondition(plan.cmrSha256===sha256(cmr)&&Array.isArray(plan.items)&&plan.items.length<=31,'Invalid bounded CMR plan');
const metadata=record(parseStrictJson(cmr.toString('utf8')),'CMR');
requireCondition(Array.isArray(metadata.items),'Missing CMR items');
const sourceLinks=metadata.items.flatMap(v=>{
  const umm=record(record(v,'item').umm,'UMM');requireCondition(Array.isArray(umm.RelatedUrls),'Missing CMR URLs');
  return umm.RelatedUrls.map(v=>record(v,'URL')).filter(v=>v.Subtype==='OPENDAP DATA').map(v=>text(v.URL,'source URL'));
});
const tokenPath=process.env.INVERSIS_EARTHDATA_TOKEN_FILE;
requireCondition(tokenPath,'Set INVERSIS_EARTHDATA_TOKEN_FILE to the owner-provided token file outside the repository');
const token=(await readFile(tokenPath,'utf8')).trim();
requireCondition(token.length>20&&!/\s/.test(token),'Local NASA token is absent or malformed');
const query='/lon[2072:2074];/time;/precipitation_cnt[][2072:2074][1344:1346];/time_bnds;/lat[1344:1346];/precipitation[][2072:2074][1344:1346]';
const root='.local/imerg-dap4/downloads';await mkdir(root,{recursive:true});
for(const value of plan.items){
  const item=record(value,'plan item');const day=text(item.day,'day');dayUTC(day);
  const url=new URL(text(item.url,'source URL'));
  requireCondition(url.origin==='https://opendap.earthdata.nasa.gov'&&!url.username&&!url.password&&url.searchParams.size===1&&url.searchParams.get('dap4.ce')===query,'Refusing unexpected NASA request');
  requireCondition(sourceLinks.some(link=>url.origin+url.pathname===link+'.dap.nc4')&&url.pathname.includes(`${day.replaceAll('-','')}-S000000-E235959.V07B.nc4.dap.nc4`),'Request does not match retained CMR identity');
  // Prefer retained public evidence. Never repeat a validated daily download.
  let cached=false;
  for(const candidate of [`public/evidence/imerg-dap4/${day}.nc4`,`${root}/${day}.nc4`]){
    try {
      const sample=await readImerg(candidate,day);
      const receipt=record(parseStrictJson(await readFile(`${candidate}${candidate.startsWith('public/')?'.receipt.json':'.http.json'}`,'utf8')),'cached receipt');
      requireCondition(receipt.sha256===sample.sha256&&receipt.bytes===sample.bytes&&(receipt.sourceUrl??receipt.url)===url.href,'Cached receipt integrity mismatch');
      requireCondition(sample.sourceMetadata.transformUrl===url.href,'Cached transformation mismatch');cached=true;break;
    }
    catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  }
  if(cached){console.log(`${day}: reused validated NetCDF`);continue;}
  let response:Response|undefined;
  for(let attempt=0;attempt<3;attempt++){
    response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},redirect:'manual',signal:AbortSignal.timeout(120000)});
    if(![429,502,503,504].includes(response.status))break;
    const raw=response.headers.get('retry-after');
    const delay=raw?(Number.isFinite(Number(raw))?Number(raw)*1000:Date.parse(raw)-Date.now()):1000*2**attempt;
    await response.body?.cancel();
    requireCondition(Number.isFinite(delay)&&delay>=0&&delay<=30000,'NASA requests a longer pause; stop and resume later');
    if(attempt<2)await new Promise(resolve=>setTimeout(resolve,delay));
  }
  requireCondition(response?.status===200,`NASA DAP4 HTTP ${response?.status}; authentication redirects are not followed; no data admitted`);
  const chunks:Uint8Array[]=[];let size=0;
  for await(const chunk of response.body??[]){size+=chunk.length;requireCondition(size<2_000_000,'NASA output exceeds small-subset limit');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);
  requireCondition(bytes.subarray(0,8).toString('hex')==='894844460d0a1a0a','NASA returned non-NetCDF bytes');
  const target=`${root}/${day}.nc4`;
  await writeFile(target,bytes,{flag:'wx'});
  const receipt={url:url.href,retrievedAtUTC:new Date().toISOString(),status:response.status,contentType:response.headers.get('content-type'),sha256:sha256(bytes),bytes:bytes.length,cmrSha256:plan.cmrSha256};
  await writeFile(`${target}.http.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  const sample=await readImerg(target,day);
  console.log(`${day}: parsed actual ${sample.observation.measurement.status} measurement; ${sample.observation.validHalfHourlySamples}/48 samples; retained locally, publication pending`);
}
