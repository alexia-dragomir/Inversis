import { plannedSources } from '../data/foundation';

export function Methodology() {
  return <details className="methodology">
    <summary>Method &amp; provenance</summary>
    <div className="method-content">
      <h2>Every conclusion needs an evidence trail.</h2>
      <p>The POWER access sample covers 1–7 January 2024 in UTC, with seven daily values and no missing days. It does not establish historical coverage for crop comparison. The API does not report the native grid-cell center or per-day quality flags.</p>
      <p><a href="/evidence/stage1/power.sample.json">POWER validation and provenance</a> · <a href="/evidence/stage1/raw/power.json">Original NASA response</a> · <a href="/evidence/stage1/imerg.discovery.json">IMERG discovery metadata</a></p>
      <p>IMERG Final V07B reports 0 mm/day on 1 January 2024 with 48 valid half-hours at the native cell centered on 44.55° N, 27.35° E. An independent download reproduced the same value, count and grid. One day is insufficient for historical analysis. <a href="/evidence/stage1/imerg.sample.json">IMERG sample validation and provenance</a></p>
      <div className="source-grid">{plannedSources.map(source => <article key={source.name}>
        <span className="eyebrow">{source.status}</span><h3>{source.name}</h3>
        <p>{source.product}</p><p>{source.role}</p><small>{source.unit}</small>
      </article>)}</div>
      <p>The intended comparison uses ordered five-year plans across common, complete historical windows. Normalized exposures will describe relative environmental exposure, not biological crop damage.</p>
      <p>Gridded estimates are not field measurements. Historical replay is not a forecast. Preference weights are not biological coefficients. IMERG and SMAP may share precipitation forcing.</p>
    </div>
  </details>;
}
