const stages = [
  ['Observe', 'Retrieve and validate historical temperature and precipitation evidence.'],
  ['Measure', 'Calculate declared heat and dry-spell exposure within provisional crop windows.'],
  ['Compare', 'Evaluate three candidate rotations across shared five-year historical replays.'],
  ['Challenge', 'Test preference weights, crop-window assumptions, and hypothetical eligibility constraints.'],
  ['Trace', 'Preserve the decision, assumptions, source records, limitations, and fingerprint.'],
] as const;

export function MethodOverview() {
  return <section className="method-overview section"><h2>From observation to decision.</h2><p>Five connected steps turn historical environmental evidence into a conditional, reproducible comparison.</p><ol>{stages.map(([title, description], index) => <li key={title}><span className="eyebrow">0{index + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>;
}
