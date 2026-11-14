import { record, requireCondition, text } from './validation.ts';

export const imergCollectionUrl = 'https://cmr.earthdata.nasa.gov/search/collections.umm_json?short_name=GPM_3IMERGDF&version=07&page_size=10';
export const imergGranuleUrl = 'https://cmr.earthdata.nasa.gov/search/granules.umm_json?collection_concept_id=C2723754864-GES_DISC&temporal=2024-01-01T00%3A00%3A00Z%2C2024-01-01T23%3A59%3A59Z&point=27.335%2C44.565&page_size=2';

export function parseImergDiscovery(collectionPayload: unknown, granulePayload: unknown) {
  function oneItem(payload: unknown, label: string) {
    const root = record(payload, label);
    requireCondition(root.hits === 1 && Array.isArray(root.items) && root.items.length === 1, `${label}: expected one unambiguous result`);
    return record(root.items[0], label);
  }
  const collection = oneItem(collectionPayload, 'IMERG collection');
  const collectionMeta = record(collection.meta, 'collection metadata');
  const collectionUmm = record(collection.umm, 'collection UMM');
  requireCondition(collectionMeta['concept-id'] === 'C2723754864-GES_DISC' && collectionUmm.ShortName === 'GPM_3IMERGDF' && collectionUmm.Version === '07', 'Wrong IMERG collection identity');
  const granule = oneItem(granulePayload, 'IMERG granule');
  const meta = record(granule.meta, 'granule metadata');
  const umm = record(granule.umm, 'granule UMM');
  requireCondition(meta['collection-concept-id'] === collectionMeta['concept-id'], 'Granule collection mismatch');
  const ref = record(umm.CollectionReference, 'collection reference');
  requireCondition(ref.ShortName === 'GPM_3IMERGDF' && ref.Version === '07', 'Granule product/version mismatch');
  const temporal = record(record(umm.TemporalExtent, 'temporal extent').RangeDateTime, 'range');
  requireCondition(temporal.BeginningDateTime === '2024-01-01T00:00:00.000Z' && temporal.EndingDateTime === '2024-01-01T23:59:59.999Z', 'Unexpected granule period');
  const granuleUR = text(umm.GranuleUR, 'granule UR');
  requireCondition(granuleUR === 'GPM_3IMERGDF.07:3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B.nc4', 'Unexpected granule identifier/science version');
  requireCondition(Array.isArray(umm.RelatedUrls), 'Missing granule access URLs');
  const links = umm.RelatedUrls.map(link => record(link, 'URL record'));
  function accessUrl(type: string, origin: string) {
    const matches = links.filter(link => link.Type === type && (type !== 'USE SERVICE API' || link.Subtype === 'OPENDAP DATA'));
    requireCondition(matches.length === 1, 'Missing or ambiguous access route');
    const url = new URL(text(matches[0]?.URL, 'access URL'));
    requireCondition(url.origin === origin && !url.username && !url.password && !url.search, 'Unexpected data host or credential-bearing URL');
    return url.href;
  }
  return {
    collectionId: 'C2723754864-GES_DISC', collectionVersion: '07', scienceVersion: 'V07B',
    granuleId: text(meta['concept-id'], 'granule concept ID'), granuleUR,
    period: { startInclusiveUTC: temporal.BeginningDateTime, endInclusiveUTC: temporal.EndingDateTime },
    downloadUrl: accessUrl('GET DATA', 'https://data.gesdisc.earthdata.nasa.gov'),
    opendapUrl: accessUrl('USE SERVICE API', 'https://opendap.earthdata.nasa.gov'),
    status: 'metadata-only-no-precipitation-observations' as const,
  };
}
