import { readFile } from 'node:fs/promises';
import h5 from 'h5wasm/node';
import { dayUTC, finite, requireCondition, text } from '../src/data/ingestion/validation.ts';
import { validateImergCell } from '../src/data/ingestion/imerg.ts';
import { sha256 } from './verify-capture.ts';

const timeUnit = 'days since 1980-01-06 00:00:00Z';
const epoch = Date.parse('1980-01-06T00:00:00.000Z');
const step = 86400000;
export async function readImerg(path: string, expectedDay: string) {
  const bytes = await readFile(path);
  requireCondition(bytes.subarray(0, 8).toString('hex') === '894844460d0a1a0a', 'Expected HDF5/NetCDF4, not login HTML');
  requireCondition(bytes.length < 2_000_000, 'Expected a small spatial subset');
  await h5.ready;
  const file = new h5.File(path, 'r');
  try {
    const attr = (name: string) => text(file.attrs[name]?.value, name);
    requireCondition(attr('DOI') === '10.5067/GPM/IMERGDF/DAY/07', 'Wrong IMERG Final daily V07 DOI');
    requireCondition(attr('title') === 'GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree (GPM_3IMERGDF)', 'Unexpected IMERG product');
    requireCondition(attr('BeginDate') === expectedDay && attr('EndDate') === expectedDay && attr('BeginTime') === '00:00:00.000Z' && attr('EndTime') === '23:59:59.999Z', 'Granule day/UTC metadata mismatch');
    const compact = expectedDay.replaceAll('-', '');
    const inputs = attr('InputPointer').split(';');
    requireCondition(inputs.length === 48 && new Set(inputs).size === 48 && inputs.every(s => s.startsWith(`3B-HHR.MS.MRG.3IMERG.${compact}-`) && s.endsWith('.V07B.HDF5')), 'Expected 48 distinct V07B input references for this day');
    function dataset(name: string, unit: string) {
      const d = file.get(name);
      requireCondition(d instanceof h5.Dataset, `Missing dataset ${name}`);
      requireCondition(d.attrs.units?.value === unit, `Unexpected ${name} units`);
      requireCondition(!d.attrs.scale_factor && !d.attrs.add_offset, 'Packed values require an explicit unpacking implementation');
      return d;
    }
    function numbers(value: unknown, label: string): number[] {
      requireCondition(Array.isArray(value), `Expected flat numeric ${label}`);
      return value.map(v => finite(v, label));
    }
    const latitude = dataset('lat', 'degrees_north');
    const longitude = dataset('lon', 'degrees_east');
    const lat = numbers(latitude.json_value, 'lat');
    const lon = numbers(longitude.json_value, 'lon');
    function cellIndex(values: number[], target: number, origin: number) {
      requireCondition(values.length > 0 && values.length <= 20, 'Unexpected spatial subset dimensions');
      values.forEach((v, i) => {
        requireCondition(Math.abs((v - origin) / 0.1 - Math.round((v - origin) / 0.1)) < 0.0001, 'Coordinate is not on native 0.1-degree centers');
        if (i > 0) requireCondition(Math.abs(v - values[i - 1]! - 0.1) < 0.00001, 'Noncontiguous native coordinate axis');
      });
      const matches = values.map((v, i) => ({ v, i })).filter(({ v }) => target >= v - 0.05 && target < v + 0.05);
      requireCondition(matches.length === 1, 'Subset does not uniquely contain demonstration point');
      return matches[0]!.i;
    }
    const yi = cellIndex(lat, 44.565, -89.95);
    const xi = cellIndex(lon, 27.335, -179.95);
    const time = dataset('time', timeUnit);
    const bounds = dataset('time_bnds', timeUnit);
    const times = numbers(time.json_value, 'time');
    const timeBounds = numbers(bounds.json_value, 'time bounds');
    const start = dayUTC(expectedDay);
    requireCondition(time.attrs.bounds?.value === 'time_bnds' && times.length === 1 && timeBounds.length === 2, 'Invalid time/bounds dimensions');
    requireCondition(epoch + times[0]! * step === start && epoch + timeBounds[0]! * step === start, 'Time epoch/day mismatch');
    // NASA numeric bounds end at 23:59:59, while global metadata ends at .999.
    // Both are inclusive end-of-day labels; retain original bounds and normalize to next midnight.
    const endMarker = epoch + timeBounds[1]! * step;
    requireCondition(endMarker >= start + step - 1001 && endMarker <= start + step, 'Time bound does not cover declared UTC day');
    const precipitation = dataset('precipitation', 'mm/day');
    const count = dataset('precipitation_cnt', 'count');
    for (const d of [precipitation, count]) {
      requireCondition(JSON.stringify(d.shape) === JSON.stringify([1, lon.length, lat.length]), 'Unexpected precipitation dimensions');
      requireCondition(d.attrs.coordinates?.value === 'time lon lat', 'Wrong dimension order');
      requireCondition(JSON.stringify(d.get_attached_scales(0)) === '["/time"]' && JSON.stringify(d.get_attached_scales(1)) === '["/lon"]' && JSON.stringify(d.get_attached_scales(2)) === '["/lat"]', 'NetCDF dimension scales disagree');
    }
    const values = numbers(precipitation.json_value, 'precipitation');
    const counts = numbers(count.json_value, 'precipitation count');
    const fill = numbers(precipitation.attrs._FillValue?.json_value, 'fill')[0];
    requireCondition(fill === -9999.900390625, 'Unexpected IMERG float32 fill');
    const hash = sha256(bytes);
    const observation = validateImergCell({
      collection: 'GPM_3IMERGDF', version: '07', variable: 'precipitation', countVariable: 'precipitation_cnt',
      unit: 'mm/day', timeStandard: 'UTC', day: expectedDay,
      timeStartUTC: new Date(start).toISOString(), timeEndUTC: new Date(start + step).toISOString(),
      latitude: lat[yi], longitude: lon[xi], validHalfHourlySamples: counts[xi * lat.length + yi],
      fillValue: fill, value: values[xi * lat.length + yi], provenanceId: `IMERG-${hash}`,
    });
    const history = attr('history');
    const match = history.match(/https:\/\/opendap\.earthdata\.nasa\.gov\/\S+/);
    requireCondition(match, 'Missing reproducible transform URL');
    const url = new URL(match[0]);
    requireCondition(!url.username && !url.password && [...url.searchParams.keys()].every(k => k === 'dap4.ce'), 'Unsafe transformation URL');
    requireCondition(url.pathname.includes(`GPM_3IMERGDF.07%3A3B-DAY.MS.MRG.3IMERG.${compact}-S000000-E235959.V07B.nc4.dap.nc4`), 'Transform history disagrees with granule');
    return {
      kind: 'validated-access-sample', eligibleForCropComparison: false,
      observation, sha256: hash, bytes: bytes.length,
      product: { collection: 'GPM_3IMERGDF', version: '07', scienceVersion: 'V07B', doi: attr('DOI'), title: attr('title'), sourceType: 'satellite-gauge-merged precipitation estimate' },
      spatialSupport: { requested: { latitude: 44.565, longitude: 27.335 }, selected: { latitude: lat[yi], longitude: lon[xi] }, nativeResolutionDegrees: 0.1, subsetAxes: { lat, lon }, selectedIndices: { time: 0, lon: xi, lat: yi }, method: 'Containing native cell, no spatial interpolation or averaging' },
      temporalSupport: { rawTime: times, rawTimeBounds: timeBounds, rawTimeUnit: timeUnit, rawEndMarkerUTC: new Date(Math.round(endMarker)).toISOString(), globalEndUTC: `${expectedDay}T23:59:59.999Z`, convention: 'Inclusive source end-of-day markers mapped to exclusive next-midnight UTC; numeric bounds retained' },
      sourceMetadata: { inputPointers: inputs, productionTime: attr('ProductionTime'), transformHistory: history, transformUrl: url.href },
      quality: { rawFill: fill, validHalfHourlySamples: observation.validHalfHourlySamples, policy: observation.qualityPolicy, unit: 'mm/day', accumulationConversion: 'none' },
      limitations: ['One day does not validate historical crop windows.', 'Gridded satellite/gauge estimate, not field measurement.', '48 valid half-hours establish temporal support, not independent rainfall accuracy.'],
    };
  } finally { file.close(); }
}
