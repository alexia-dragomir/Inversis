import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { imergCollectionUrl, imergGranuleUrl, parseImergDiscovery } from '../src/data/ingestion/imerg-discovery';
import { verifyCapture } from '../scripts/verify-capture';

function inputs() {
  return ['imerg-collections', 'imerg-granules'].map((name, i) => {
    const raw = readFileSync(`public/evidence/stage1/raw/${name}.json`);
    verifyCapture(raw, JSON.parse(readFileSync(`public/evidence/stage1/raw/${name}.receipt.json`, 'utf8')), [imergCollectionUrl, imergGranuleUrl][i]!);
    return JSON.parse(raw.toString('utf8'));
  });
}

it('verifies authentic CMR captures without claiming precipitation ingestion', () => {
  const [collection, granule] = inputs();
  expect(parseImergDiscovery(collection, granule)).toMatchObject({
    collectionId: 'C2723754864-GES_DISC', scienceVersion: 'V07B',
    granuleId: 'G3087510500-GES_DISC', status: 'metadata-only-no-precipitation-observations',
  });
});

it('refuses ambiguous results, changed collection, time or granule identity', () => {
  for (const field of ['ambiguity', 'collection', 'time', 'granule']) {
    const [c, g] = inputs();
    if (field === 'ambiguity') c.hits = 2;
    if (field === 'collection') g.items[0].umm.CollectionReference.Version = '06';
    if (field === 'time') g.items[0].umm.TemporalExtent.RangeDateTime.BeginningDateTime = '2024-01-02T00:00:00.000Z';
    if (field === 'granule') g.items[0].umm.GranuleUR = 'different';
    expect(() => parseImergDiscovery(c, g)).toThrow();
  }
});

it.each(['https://example.org/file', 'http://data.gesdisc.earthdata.nasa.gov/file', 'https://user:secret@data.gesdisc.earthdata.nasa.gov/file', 'https://data.gesdisc.earthdata.nasa.gov/file?token=secret'])('refuses unsafe access URL %s', url => {
  const [c, g] = inputs();
  g.items[0].umm.RelatedUrls.find((link: { Type: string }) => link.Type === 'GET DATA').URL = url;
  expect(() => parseImergDiscovery(c, g)).toThrow('host');
});
