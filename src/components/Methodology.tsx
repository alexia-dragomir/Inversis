import { plannedSources } from '../data/foundation';

export function Methodology() {
  return <details className="methodology">
    <summary>Method &amp; provenance</summary>
    <div className="method-content">
      <h2>Every conclusion needs an evidence trail.</h2>
      <p>This foundation contains proposed inputs only. Source versions, variables, units, UTC alignment, grid footprints, coverage and quality must be verified before any calculation.</p>
      <div className="source-grid">{plannedSources.map(source => <article key={source.name}>
        <span className="eyebrow">{source.status}</span><h3>{source.name}</h3>
        <p>{source.product}</p><p>{source.role}</p><small>{source.unit}</small>
      </article>)}</div>
      <p>The intended comparison uses ordered five-year plans across common, complete historical windows. Normalized exposures will describe relative environmental exposure, not biological crop damage.</p>
      <p>Gridded estimates are not field measurements. Historical replay is not a forecast. Preference weights are not biological coefficients. IMERG and SMAP may share precipitation forcing.</p>
    </div>
  </details>;
}
