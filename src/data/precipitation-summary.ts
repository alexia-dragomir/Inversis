import manifest from '../../public/evidence/imerg-dap4/manifest.json';

// Source-display boundary only. Never used to admit historical scenarios.
// npm run imerg:verify reparses retained binaries and verifies this generated manifest.
export const precipitationSamples = manifest.samples.map(sample => {
  const observation = sample.observation;
  if (sample.product.collection !== 'GPM_3IMERGDF' || sample.product.scienceVersion !== 'V07B'
      || observation.validHalfHourlySamples !== 48 || observation.measurement.status !== 'valid'
      || observation.measurement.quantity.unit !== 'mm/day' || !Number.isFinite(observation.measurement.quantity.value)
      || observation.measurement.quantity.value < 0 || sample.sha256 !== sample.receipt.sha256) {
    throw new Error('Invalid precipitation display evidence');
  }
  return {day:observation.timeStartUTC.slice(0,10),value:observation.measurement.quantity.value,count:observation.validHalfHourlySamples,sha256:sample.sha256,rawPath:sample.rawPath};
});
