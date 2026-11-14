import { useState } from 'react';
import type { DecisionCertificate } from '../domain/contracts';
import { Brand } from './Brand';
import { displayScore, planLabel, scoreSummary } from './display';

export function AuditRecord({audit,onExport,busy}:{audit:DecisionCertificate;onExport:()=>void;busy:boolean}) {
  const [copyStatus,setCopyStatus]=useState('');
  const copyFingerprint=async()=>{try{await navigator.clipboard.writeText(audit.fingerprint);setCopyStatus('Full SHA-256 copied.');}catch{setCopyStatus('Clipboard unavailable. Select and copy the full fingerprint below.');}};
  const categories=[
    {name:'Integrity and provenance',match:(s:string)=>/fingerprint|endorsement|certification/i.test(s)},
    {name:'Historical and geographic scope',match:(s:string)=>/historical|overlap|geograph|gridded|scenario/i.test(s)},
    {name:'Crop-window and threshold assumptions',match:(s:string)=>/threshold|window/i.test(s)},
    {name:'Field eligibility and agronomic unknowns',match:(s:string)=>/soil|disease|management|suitability|previous.crop/i.test(s)},
    {name:'Interpretation and non-prediction boundaries',match:(s:string)=>/future|predict|yield|probab/i.test(s)},
    {name:'Exposure-model assumptions',match:()=>true},
  ];
  const groups=categories.map(c=>({name:c.name,items:audit.limitations.filter(s=>categories.find(g=>g.match(s))===c)})).filter(g=>g.items.length);
  const summary=scoreSummary(audit.decision);
  const sourceIds=[...new Set(audit.sourceManifest.map(s=>s.sourceId))];
  return <>
    <section className="audit-record">
      <header><Brand/><div className="audit-seal">Inversis decision record<br/><b>Historical exposure · 2015–2024 UTC</b></div></header>
      <div className="audit-body"><div><p className="eyebrow">Conditional minimax selection</p><h2>{audit.decision.computation?planLabel(audit.decision.preferredSet):audit.decision.status.replaceAll('_',' ').toLowerCase()}</h2><p>{summary?audit.decision.activeCandidateIds.length===1?'Only one eligible plan remains. Zero regret is not evidence of competitive superiority.':'The selected set minimizes its largest missed opportunity across the complete shared historical replays.':'reasons' in audit.decision?audit.decision.reasons.join(' '):''}</p><p className="small-note">Historical environmental exposure, not agricultural certification or a forecast.</p><div className="audit-actions"><button className="button" disabled={busy} onClick={onExport}>Download certificate JSON ↓</button><button className="secondary-button" disabled={busy} onClick={()=>window.print()}>Print record</button></div><p className="small-note">JSON is the canonical record. The printable presentation is a human-readable summary.</p></div>
        <dl>{[['Model',audit.modelVersion],['Historical domain','2015–2024 UTC'],['Common complete replays',String(audit.decision.validScenarioIds.length)],['Preference',audit.context.preferenceWeights.map(w=>`${Math.round(w.weight*100)}% ${w.indicator}`).join(' / ')],['Field suitability','Not established']].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      </div>
      <div className="audit-rationale" aria-label="Decision rationale"><div><span>Lowest maximum regret</span><strong>{summary?displayScore(summary.best.value):'Not defined'}</strong></div><div><span>Next minimax score</span><strong>{summary?.next?displayScore(summary.next.value):'No competitor'}</strong></div><div><span>Minimax margin</span><strong>{summary?.margin!==null&&summary?.margin!==undefined?displayScore(summary.margin):'Not defined'}</strong></div><p>Normalized exposure units. Margin is second-lowest minus lowest worst regret; it is not confidence. Ties remain sets.</p></div>
      <div className="audit-assumptions"><h3>Current assumptions</h3>{audit.context.assumptions.map(a=><p key={a.id}>{a.statement}</p>)}</div>
      <div className="fingerprint-panel"><div><p className="eyebrow">Canonical SHA-256</p><span>Generation timestamp excluded · sorted-json-v1</span></div><code className="canonical-hash">{audit.fingerprint}</code><button className="secondary-button copy-fingerprint" onClick={()=>void copyFingerprint()}>Copy fingerprint</button><span className="copy-status" role="status">{copyStatus}</span><p>Verify the JSON with <code>npm run certificate:verify -- FILE.json</code>. The fingerprint checks record integrity, not NASA endorsement, peer review or agronomic validity.</p></div>
      <div className="audit-source-summary"><h3>Evidence provenance</h3><p>{sourceIds.join(' · ')}</p><p>Original source archives, retrieval records and exact matrices are retained with the canonical JSON. <a href="https://alexia-dragomir.github.io/Inversis/#context">Inspect sources and provenance in Inversis</a>.</p><p className="print-only">Printable presentation of the canonical JSON record. Generated at {audit.generatedAtUTC}. Reproduce and verify the JSON separately.</p></div>
    </section>
    <section className="section certificate-limitations"><p className="eyebrow">Scope travels with the record</p><h2>Traceable evidence. Explicit limits.</h2><p>No yield forecast, calibrated crop damage, future-climate prediction or verified field suitability is established. Thresholds, crop windows and farmer exclusions remain provisional or hypothetical.</p>{groups.map(g=><details key={g.name} className="methodology"><summary>{g.name} · {g.items.length} {g.items.length===1?'disclosure':'disclosures'}</summary><ul>{g.items.map((s,i)=><li key={i}>{s}</li>)}</ul></details>)}<div className="print-only print-disclosures">{groups.map(g=><section key={g.name}><h3>{g.name}</h3><ul>{g.items.map((s,i)=><li key={i}>{s}</li>)}</ul></section>)}</div></section>
  </>;
}
