import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Brand } from './components/Brand';
import { demoScreens } from './components/GuidedDemo';
import { AnalysisWorkspace } from './components/AnalysisWorkspace';

export const steps = ['context', 'decision', 'stability', 'certificate'] as const;
export type Step = typeof steps[number];
export function stepFromHash(hash: string): Step {
  return steps.find(step => `#${step}` === hash) ?? 'context';
}
export function App() {
  const [step, setStep] = useState<Step>(() => stepFromHash(window.location.hash));
  const [navigation, setNavigation] = useState(0);
  // Keep the user's workspace mounted and inert during the tour. The second
  // workspace owns its own default options, engine bundle and certificate.
  const [demo, setDemo] = useState<{index:number; origin:Step; example:'soybean'|'sunflower'; revision:number}|null>(null);
  const startDemo = () => { setDemo({index:0,origin:step,example:'soybean',revision:0}); window.location.hash='context'; };
  const exitDemo = () => { if(demo){window.location.hash=demo.origin;setStep(demo.origin);setDemo(null);main.current?.focus();} };
  const changeDemoStep = (index:number) => { if(demo){setDemo({...demo,index,example:'soybean',revision:demo.revision+1});window.location.hash=demoScreens[index]!;} };
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const onHashChange = () => { const next=stepFromHash(window.location.hash); setStep(next); setNavigation(n=>n+1); setDemo(current=>current&&demoScreens[current.index]!==next?{...current,index:next==='context'?0:next==='decision'?1:next==='stability'?3:4,revision:current.revision+1}:current); };
    window.addEventListener('hashchange', onHashChange);
    return () => { window.removeEventListener('hashchange', onHashChange); window.history.scrollRestoration = previousRestoration; };
  }, []);
  // Run after the destination DOM commits, before paint. Demo panels retain their
  // own deliberate focus/scroll behavior; skip-to-content is also independent.
  useLayoutEffect(() => {
    if (!demo) { main.current?.focus({preventScroll:true}); window.scrollTo({top:0,left:0,behavior:'instant'}); }
  }, [step,navigation,demo]);
  useEffect(() => { document.title = `Inversis · ${step[0]?.toUpperCase()}${step.slice(1)}`; }, [step]);

  return <div onClickCapture={event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const anchor=(event.target as Element).closest('a');
    if(anchor&&steps.some(s=>anchor.getAttribute('href')===`#${s}`)&&anchor.hash===window.location.hash){event.preventDefault();setNavigation(n=>n+1);}
  }}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a>
    <header className="header"><a className="wordmark" href="#context" aria-label="Inversis — Context"><Brand/></a>
      <nav aria-label="Decision workflow">{steps.map((item, index) => <a href={`#${item}`} key={item} aria-current={step === item ? 'page' : undefined}><span className="nav-number" aria-hidden="true">0{index + 1}</span>{item}</a>)}</nav>
      <span className="stage-label">EARTH EVIDENCE<br/><b>DECISION INTELLIGENCE</b></span>
    </header>
    <div className="workspace"><div className="evidence-notice"><span className="notice-dot" aria-hidden="true" />Historical model · provisional <span className="notice-detail">Source coverage determines which comparisons can run. Field suitability remains unresolved.</span></div>
      <main id="main" ref={main} tabIndex={-1}><div className="user-workspace" hidden={demo!==null} inert={demo!==null}><AnalysisWorkspace step={demo?.origin??step} onStartDemo={startDemo}/></div>
      {demo&&<div className="demo-workspace"><p className="demo-banner">Guided demo · default reference configuration. Your applied analysis is preserved. <button className="text-button" onClick={exitDemo}>Return to your analysis</button></p><AnalysisWorkspace step={step} demo={{index:demo.index,onStep:changeDemoStep,onExit:exitDemo,example:demo.example,onExample:example=>setDemo({...demo,example})}} demoRevision={demo.revision}/></div>}</main>
      <footer><span>Inversis · Know what would change the decision.</span><span>Historical exposure ≠ future prediction</span></footer>
    </div>
  </div>;
}
