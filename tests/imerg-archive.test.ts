import { readFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { expect, it } from 'vitest';
import { readImergArchive } from '../scripts/read-imerg-archive';
import { sha256 } from '../scripts/verify-capture';

const packed=readFileSync('public/evidence/history/imerg/2015.tar.gz');
it('retains all 365 original daily byte hashes inside the real 2015 archive',()=>{
  const metadata=JSON.parse(readFileSync('public/evidence/history/imerg/2015.manifest.json','utf8')) as {archiveSha256:string;captures:{day:string;sha256:string}[]};
  const files=readImergArchive(packed,2015);
  expect(files.size).toBe(365);expect(sha256(packed)).toBe(metadata.archiveSha256);
  for(const capture of metadata.captures)expect(sha256(files.get(`${capture.day}.nc4`)!)).toBe(capture.sha256);
});
it('refuses wrong-year paths, malformed checksums and trailing non-archive bytes',()=>{
  expect(()=>readImergArchive(packed,2016)).toThrow('member');
  const badName=gunzipSync(packed);badName.write('../outside.nc4',0,'ascii');
  expect(()=>readImergArchive(gzipSync(badName),2015)).toThrow('member');
  const checksum=gunzipSync(packed);checksum[100]=49;
  expect(()=>readImergArchive(gzipSync(checksum),2015)).toThrow('checksum');
  expect(()=>readImergArchive(gzipSync(Buffer.concat([gunzipSync(packed),Buffer.from('unexpected')])),2015)).toThrow('trailer');
});
