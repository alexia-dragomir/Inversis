import { useEffect, useRef, useState } from 'react';
import { ContextPage } from './pages/ContextPage';
import { PendingPage } from './pages/PendingPage';
import { Methodology } from './components/Methodology';

export const steps = ['context', 'decision', 'stability', 'certificate'] as const;
export type Step = typeof steps[number];
export function stepFromHash(hash: string): Step {
  return steps.find(step => `#${step}` === hash) ?? 'context';
}
export function App() {
  const [step, setStep] = useState<Step>(() => stepFromHash(window.location.hash));
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const onHashChange = () => { setStep(stepFromHash(window.location.hash)); main.current?.focus(); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { document.title = `Inversis · ${step[0]?.toUpperCase()}${step.slice(1)}`; }, [step]);

  return <>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a>
    <header className="header"><a className="wordmark" href="#context" aria-label="Inversis — Context">Inversis<span className="wordmark-dot" aria-hidden="true">.</span></a>
      <nav aria-label="Decision workflow">{steps.map((item, index) => <a href={`#${item}`} key={item} aria-current={step === item ? 'page' : undefined}><span className="nav-number" aria-hidden="true">0{index + 1}</span>{item}</a>)}</nav>
      <span className="stage-label">Stage 1 / Evidence</span>
    </header>
    <div className="workspace"><div className="evidence-notice"><span className="notice-dot" aria-hidden="true" />Evidence incomplete <span className="notice-detail">POWER and IMERG access samples validated. Crop comparisons remain withheld.</span></div>
      <main id="main" ref={main} tabIndex={-1}>{step === 'context' ? <ContextPage /> : <PendingPage stage={step} />}</main>
      <Methodology />
      <footer><span>Inversis · Know what would change the decision.</span><span>Historical exposure ≠ future prediction</span></footer>
    </div>
  </>;
}
