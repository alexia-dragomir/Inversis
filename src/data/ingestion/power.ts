import type { Coverage, Observation, ProvenanceRecord } from '../../domain/contracts.ts';
import { completeDailyCoverage, dayUTC, calendarDays, finite, record, requireCondition, text } from './validation.ts';

export const powerRequest = {
  latitude: 44.565, longitude: 27.335, start: '2024-01-01', end: '2024-01-07',
  url: 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX&community=AG&longitude=27.335&latitude=44.565&start=20240101&end=20240107&format=JSON&time-standard=UTC',
} as const;

export function createPowerRequest(start: string, end: string) {
  calendarDays(start, end, 366);
  const url = new URL(powerRequest.url);
  url.searchParams.set('start', start.replaceAll('-', ''));
  url.searchParams.set('end', end.replaceAll('-', ''));
  return { ...powerRequest, start, end, url: url.href };
}

export interface PowerSample {
  readonly kind: 'validated-access-sample';
  readonly eligibleForCropComparison: false;
  readonly observations: readonly Observation<'degC'>[];
  readonly coverage: Coverage;
  readonly provenance: ProvenanceRecord;
  readonly limitations: readonly string[];
}

export interface VerifiedCapture {
  readonly url: string;
  readonly retrievedAt: string;
  readonly sha256: string;
}

/** Metadata/schema/physical-value validation, not independent reanalysis validation. */
export function parsePower(payload: unknown, capture: VerifiedCapture, request: ReturnType<typeof createPowerRequest> = powerRequest): PowerSample {
  requireCondition(capture.url === request.url, 'POWER capture URL differs from declared request');
  const root = record(payload, 'POWER response');
  requireCondition(root.type === 'Feature', 'Expected POWER GeoJSON Feature');
  const geometry = record(root.geometry, 'geometry');
  requireCondition(geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length === 3, 'Expected three POWER point coordinates');
  const [longitude, latitude, elevation] = geometry.coordinates as unknown[];
  requireCondition(Math.abs(finite(longitude, 'longitude') - request.longitude) < 1e-6 && Math.abs(finite(latitude, 'latitude') - request.latitude) < 1e-6, 'POWER response coordinates do not match request');
  finite(elevation, 'elevation');
  const header = record(root.header, 'header');
  requireCondition(header.time_standard === 'UTC', 'POWER response must explicitly report UTC');
  requireCondition(header.start === request.start.replaceAll('-', '') && header.end === request.end.replaceAll('-', ''), 'POWER returned period differs from request');
  const api = record(header.api, 'api');
  requireCondition(api.name === 'POWER Daily API', 'Unexpected NASA service');
  const serviceVersion = text(api.version, 'API version');
  requireCondition(Array.isArray(header.sources) && header.sources.includes('MERRA2') && header.sources.includes('POWER') && header.sources.every(s => typeof s === 'string'), 'Expected MERRA2/POWER source metadata');
  const fill = finite(header.fill_value, 'fill value');
  requireCondition(fill < -273.15, 'Unexpected temperature fill sentinel');
  requireCondition(Array.isArray(root.messages) && root.messages.length === 0, 'POWER messages require manual review');
  const parameter = record(record(root.parameters, 'parameters').T2M_MAX, 'T2M_MAX metadata');
  requireCondition(parameter.units === 'C', 'POWER T2M_MAX units must be C; no silent conversion');
  requireCondition(parameter.longname === 'Temperature at 2 Meters Maximum', 'Unexpected T2M_MAX description');
  const series = record(record(record(root.properties, 'properties').parameter, 'parameter').T2M_MAX, 'T2M_MAX series');
  const dates = calendarDays(request.start, request.end, 366);
  const keys = dates.map(day => day.replaceAll('-', ''));
  requireCondition(Object.keys(series).every(key => keys.includes(key)), 'Unexpected or malformed daily date key');
  const provenanceId = `power-t2m-max-${capture.sha256}`;
  const observations: Observation<'degC'>[] = dates.map(day => {
    const key = day.replaceAll('-', '');
    const value = series[key];
    const missing = value === undefined || value === null || value === fill;
    if (!missing) {
      finite(value, `T2M_MAX ${day}`);
      requireCondition((value as number) >= -273.15, 'Temperature below absolute zero');
    }
    return {
      id: `POWER.T2M_MAX.UTC.${day}`, provenanceId,
      timeStartUTC: new Date(dayUTC(day)).toISOString(),
      timeEndUTC: new Date(dayUTC(day) + 86400000).toISOString(),
      rawValue: value === undefined ? null : value as number | null,
      measurement: missing
        ? { status: 'missing', reason: value === fill ? 'NASA-declared fill sentinel' : 'Absent/null daily observation' }
        : { status: 'valid', quantity: { value: value as number, unit: 'degC' }, flags: ['source-daily-value', 'no-per-day-quality-flags-returned'] },
    };
  });
  const provenance: ProvenanceRecord = {
    id: provenanceId, sourceId: 'NASA-POWER/T2M_MAX/MERRA2', productFamily: 'NASA POWER meteorology',
    collectionVersion: null, serviceVersion, scienceVersion: null,
    variablePath: 'properties.parameter.T2M_MAX', sourceType: 'model-derived',
    sourceUrl: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/', doi: null,
    queryOrGranule: capture.url, retrievalTimeUTC: capture.retrievedAt,
    sourceTimeStandard: 'UTC', utcAlignment: 'Explicit UTC request and returned header; midnight-to-midnight intervals, exclusive end.',
    temporalSupport: 'Daily maximum of source 2 m air temperature; not instantaneous or a daily mean.',
    spatialSupport: {
      requestedCoordinates: { latitude: powerRequest.latitude, longitude: powerRequest.longitude },
      selectedCoordinates: null,
      footprint: 'Gridded reanalysis; response echoes requested coordinate, not native cell centre/bounds.',
      nativeResolution: 'Source-native gridded meteorology; numeric resolution and exact cell bounds are not reported in this response.',
      extractionMethod: 'NASA POWER daily point service; underlying sampling delegated to POWER, native cell not exposed in this response.',
    },
    rawUnit: 'C', fillValues: [fill], processingVersion: 'inversis-source-validation-v1',
    transformations: ['C metadata mapped to canonical degC without changing numeric values.', 'YYYYMMDD keys represented as full UTC-day intervals.', 'Declared fill, absent and null values retained explicitly as missing; no interpolation.'],
    sha256: capture.sha256, dependenceNotes: ['MERRA2/POWER source names retained from header; not a direct field measurement.'],
  };
  return {
    kind: 'validated-access-sample', eligibleForCropComparison: false, observations,
    coverage: completeDailyCoverage(observations, request.start, request.end), provenance,
    limitations: ['Source availability alone does not establish complete common crop windows or five-year scenarios.', 'Native cell identity and underlying collection/science version are not reported by this response; API version is not a dataset version.', 'Daily availability is checked; subdaily completeness and per-day source QC are not exposed by this API response.', 'Values are modeled gridded temperature estimates, not farm measurements.'],
  };
}
