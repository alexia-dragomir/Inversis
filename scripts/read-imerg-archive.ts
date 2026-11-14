import { gunzipSync } from 'node:zlib';
import { requireCondition } from '../src/data/ingestion/validation.ts';

/** Narrow USTAR reader for deterministic annual NASA archives; no arbitrary extraction paths. */
export function readImergArchive(compressed:Uint8Array,year:number):ReadonlyMap<string,Buffer>{
  const bytes=gunzipSync(compressed,{maxOutputLength:50_000_000});
  const files=new Map<string,Buffer>();
  let offset=0;
  while(offset+512<=bytes.length){
    const header=bytes.subarray(offset,offset+512);
    if(header.every(v=>v===0))break;
    const name=header.subarray(0,100).toString('utf8').replace(/\0.*$/s,'');
    requireCondition(new RegExp(`^${year}-\\d{2}-\\d{2}\\.nc4$`).test(name)&&!files.has(name),'Unexpected/duplicate archive member');
    const octal=(start:number,end:number)=>parseInt(header.subarray(start,end).toString('ascii').replace(/\0.*$/s,'').trim(),8);
    const size=octal(124,136),checksum=octal(148,156);
    const computed=header.reduce((sum,v,i)=>sum+(i>=148&&i<156?32:v),0);
    requireCondition(checksum===computed&&header[156]===48&&size>0&&size<2_000_000&&offset+512+size<=bytes.length,'Invalid archive header/size/checksum');
    files.set(name,bytes.subarray(offset+512,offset+512+size));
    offset+=512+Math.ceil(size/512)*512;
  }
  requireCondition(files.size>=365&&files.size<=366&&bytes.subarray(offset).every(v=>v===0),'Incomplete annual archive or invalid trailer');
  return files;
}
