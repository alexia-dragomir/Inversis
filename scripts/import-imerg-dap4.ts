import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readImerg } from './read-imerg.ts';
import { verifyImportedNetcdf } from './verify-capture.ts';
import { parseStrictJson, requireCondition } from '../src/data/ingestion/validation.ts';

const [path,day]=process.argv.slice(2);
requireCondition(path&&day,'Usage: node --experimental-strip-types scripts/import-imerg-dap4.ts PATH UTC-DAY');
const sample=await readImerg(path,day);
const directory='public/evidence/imerg-dap4';
await mkdir(directory,{recursive:true});
const target=`${directory}/${day}.nc4`;
try {
  const saved=await readImerg(target,day);
  verifyImportedNetcdf(parseStrictJson(await readFile(`${target}.receipt.json`,'utf8')),saved);
  requireCondition(saved.sha256===sample.sha256,'Refusing to overwrite a different retained capture');
} catch(error) {
  if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;
  const receipt={sourceUrl:sample.sourceMetadata.transformUrl,sha256:sample.sha256,bytes:sample.bytes,registeredAtUTC:new Date().toISOString(),retrievalTimeUTC:null,retrievalTimeNote:'Browser download completed; exact completion timestamp not captured. Registration is not retrieval.',acquisitionMode:'Authenticated official NASA OPeNDAP DAP4 browser download; independently parsed on import'};
  verifyImportedNetcdf(receipt,sample);
  await writeFile(target,await readFile(path),{flag:'wx'});
  await writeFile(`${target}.receipt.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({day,sha256:sample.sha256,measurement:sample.observation.measurement,count:sample.observation.validHalfHourlySamples}));
