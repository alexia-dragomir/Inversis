import { initialDecision } from '../data/foundation';

export type PendingStage = 'decision' | 'stability' | 'certificate';
const content = {
  decision: { number: '02', title: 'A decision needs validated evidence.', subtitle: 'No recommendation is available.', next: 'stability', nextLabel: 'Inspect stability readiness', items: ['Validate NASA sources and their physical units.', 'Establish complete historical scenarios shared by all eligible candidates.', 'Check eligibility before calculating losses, regret and ties.'] },
  stability: { number: '03', title: 'Know the limits of a future comparison.', subtitle: 'Sensitivity and Next Evidence have not been computed.', next: 'certificate', nextLabel: 'Inspect certificate readiness', items: ['Test preferences while holding evidence and candidate eligibility fixed.', 'Recompute supported hypothetical answers; distinguish decision changes from eligibility-only changes.', 'Keep crop-window, normalization and cyclic-phase diagnostics separate.'] },
  certificate: { number: '04', title: 'An audit trail, before an answer.', subtitle: 'No Decision Certificate has been generated.', next: 'context', nextLabel: 'Return to context', items: ['Preserve source manifests, physical units, quality checks and exclusions.', 'Record the exact context, eligible scenarios, assumptions and computed result or refusal.', 'Fingerprint canonical inputs and outputs for reproducibility; an identifier is not independent certification.'] },
} as const;

export function PendingPage({ stage }: { readonly stage: PendingStage }) {
  const page = content[stage];
  return <section className="pending-page" aria-labelledby={`${stage}-title`}>
    <p className="eyebrow">{page.number} / {stage} · awaiting evidence</p>
    <h1 id={`${stage}-title`}>{page.title}</h1><p className="lead">{page.subtitle}</p>
    <div className="readiness-panel"><span className="status">Insufficient evidence</span><h2>No computed findings</h2>
      <ul>{initialDecision.status === 'INSUFFICIENT_EVIDENCE' && initialDecision.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <p>{initialDecision.warnings[0]}</p>
    </div>
    <div className="next-steps"><p className="eyebrow">Required before this step can produce results</p><ol>{page.items.map(item => <li key={item}>{item}</li>)}</ol></div>
    <a className="button" href={`#${page.next}`}>{page.nextLabel} <span aria-hidden="true">→</span></a>
  </section>;
}
