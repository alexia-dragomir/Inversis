import { useEffect, useRef } from 'react';
import type { Step } from '../App';

export const demoScreens: readonly Step[] = ['context', 'decision', 'decision', 'stability', 'certificate'];
const titles = ['Start with observed conditions.', 'Find the smallest worst-case regret.', 'A different replay can favor a different plan.', 'Test the evidence that could change the decision.', 'Every decision has a traceable record.'];
const descriptions = [
  'Ten years of temperature and precipitation evidence establish the historical conditions used to compare three five-year crop rotations. This is gridded environmental evidence, not a verified farm measurement.',
  'Compare the engine-derived maximum regrets below. The default reference selection limits the largest missed opportunity across shared historical replays; it need not win every replay.',
  'Start with 2018–2022, then try another replay. Compare its weighted exposure and replay-best plan with the overall minimax selection. These are different questions.',
  'Some assumptions change the comparison margin. Others change which plans are eligible to be compared at all. Try both hypothetical permissions below; nothing is applied to your analysis.',
  'The default reference record preserves inputs, assumptions, source provenance, comparison results, limitations, and a verifiable fingerprint. JSON is canonical; print is its readable companion.',
];
export interface DemoControls { index: number; onStep: (step: number) => void; onExit: () => void; example: 'soybean' | 'sunflower'; onExample: (example: 'soybean' | 'sunflower') => void }

export function GuidedDemo({ index, onStep, onExit, example, onExample }: DemoControls) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus({ preventScroll: true }); panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }, [index]);
  return <aside className="demo-guide" aria-label="Guided demonstration" tabIndex={-1} ref={panel}>
    <div className="guide-meta"><span>Step {index + 1} of 5 · 60–90 second exploration</span><button className="text-button" onClick={onExit}>Exit demo</button></div>
    <p className="eyebrow">Default reference analysis · isolated from your settings</p>
    <h2>{titles[index]}</h2><p>{descriptions[index]}</p>
    {index === 3 && <><div className="guide-examples"><button aria-pressed={example === 'soybean'} onClick={() => onExample('soybean')}>Example A · Soybean</button><button aria-pressed={example === 'sunflower'} onClick={() => onExample('sunflower')}>Example B · Sunflower</button></div><p className="small-note">{example === 'soybean' ? 'Prohibiting soybean leaves Baseline as the sole eligible candidate. The preferred name remains, but competitive superiority cannot be inferred without an alternative.' : 'Prohibiting sunflower leaves no eligible candidate. This assumption prevents selection; Inversis does not invent a replacement recommendation.'} Toggle Permitted and Prohibited in the real preview below.</p></>}
    {index === 4 && <p><strong>You’ve seen the decision, challenged it, and traced its evidence.</strong></p>}
    <div className="guide-actions"><button className="secondary-button" disabled={index === 0} onClick={() => onStep(index - 1)}>Back</button>{index < 4 ? <button className="button" onClick={() => onStep(index + 1)}>Next</button> : <><button className="button" onClick={onExit}>Explore independently</button><button className="secondary-button" onClick={() => onStep(0)}>Restart demo</button></>}</div>
  </aside>;
}
