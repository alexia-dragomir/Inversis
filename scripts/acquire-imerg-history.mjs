import { spawn } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';

// Two bounded monthly workers; no duplicate months or concurrent requests within a worker.
// Each daily reader validates bytes before progress is reported. Restart reuses valid cache.
const jobs=[];
for(let year=2015;year<=2024;year++)for(let month=1;month<=12;month++){
  const start=`${year}-${String(month).padStart(2,'0')}-01`;
  const end=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
  jobs.push({start,end});
}
function run(script,args){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--experimental-strip-types',script,...args],{stdio:['ignore','pipe','pipe'],env:process.env});
  let errors='';
  child.stdout.on('data',chunk=>{if(!script.includes('plan-imerg'))process.stdout.write(chunk);});
  child.stderr.on('data',chunk=>{errors+=chunk.toString();});
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve():reject(new Error(`${script} failed (${code}): ${errors.slice(-2000)}`)));
});}
let stopped=false;
async function worker(){
  while(!stopped&&jobs.length){
    const job=jobs.shift();
    console.log(`MONTH ${job.start} through ${job.end}`);
    try{
      await run('scripts/plan-imerg-dap4.ts',[job.start,job.end]);
      await run('scripts/download-imerg-dap4.ts',[`.local/imerg-dap4/${job.start}_${job.end}/plan.json`]);
      console.log(`MONTH VALIDATED ${job.start} through ${job.end}`);
    }catch(error){stopped=true;throw error;}
  }
}
const results=await Promise.allSettled([worker(),worker()]);
const failed=results.find(r=>r.status==='rejected');
if(failed){console.error(failed.reason.message);process.exitCode=1;}
else console.log('All requested monthly download jobs finished. Full independent date/QC/hash audit still required.');
