import { candidates, demoSite } from '../data/foundation';

export function ContextPage() {
  return <>
    <section className="intro" aria-labelledby="context-title">
      <div><p className="eyebrow">01 / Context · foundation</p>
        <h1 id="context-title">Know what would<br className="desktop-break" /> change the decision.</h1>
        <p className="lead">Crop-rotation decision assurance. Connect NASA environmental evidence, agronomic constraints and farmer priorities to a transparent, conditional comparison.</p>
        <a className="button" href="#decision">Inspect decision readiness <span aria-hidden="true">↗</span></a>
      </div>
      <aside className="site-card" aria-label="Demonstration location">
        <p className="eyebrow">Proposed demonstration</p><h2>{demoSite.name}</h2>
        <p className="coordinates">{demoSite.latitude}° N <span>/</span> {demoSite.longitude}° E</p>
        <dl><div><dt>Planning horizon</dt><dd>5 ordered years</dd></div><div><dt>Target history</dt><dd>2015–2024 · unvalidated</dd></div><div><dt>Water management</dt><dd>Rain-fed assumption</dd></div></dl>
        <p className="small-note">An illustrative location. No measured farm or field conditions are asserted.</p>
      </aside>
    </section>
    <section className="section" aria-labelledby="plans-title">
      <div className="section-heading"><div><p className="eyebrow">The decision context</p><h2 id="plans-title">Three plans. No established preference.</h2></div><span className="status">All conditional</span></div>
      <p>Fixed-start sequences proposed for comparison. Alternatives A and B have identical crop composition; their order differs.</p>
      <div className="rotation-table"><div className="rotation-head" aria-hidden="true"><span>Candidate</span>{[1, 2, 3, 4, 5].map(year => <span key={year}>Year {year}</span>)}</div>
        {candidates.map(candidate => <article className="rotation-row" key={candidate.id} aria-label={`${candidate.name}, conditional`}>
          <h3>{candidate.name}</h3><ol>{candidate.fiveYearOrderedCrops.map((crop, index) => <li key={index}><span className="mobile-year">Year {index + 1} · </span>{crop}</li>)}</ol>
        </article>)}
      </div>
    </section>
    <section className="section" aria-labelledby="evidence-title"><p className="eyebrow">What the comparison will need</p><h2 id="evidence-title">Four distinct kinds of evidence</h2>
      <div className="evidence-grid">
        <article><span className="card-index">01</span><h3>NASA evidence</h3><p>POWER, IMERG and optional SMAP observations or modeled estimates.</p><strong>Not ingested</strong></article>
        <article><span className="card-index">02</span><h3>Crop characteristics</h3><p>Sensitive windows and source-backed succession cautions.</p><strong>Assumptions to validate</strong></article>
        <article><span className="card-index">03</span><h3>Local soil &amp; history</h3><p>Soil, previous crops, disease history and management.</p><strong>Unknown field facts</strong></article>
        <article><span className="card-index">04</span><h3>Farmer priorities</h3><p>Explicit crop permissions and preferences over exposure swings.</p><strong>Not supplied</strong></article>
      </div>
    </section>
  </>;
}
