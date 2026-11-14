import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { analyze, nextEvidence, validateAnalysisEvidence } from '../src/engine/analysis';
import { GuidedDemo, demoScreens } from '../src/components/GuidedDemo';
import { EvidenceWorkbench } from '../src/components/PreferenceInstrument';
import { MethodOverview } from '../src/components/MethodOverview';

it('defines exactly five steps with accessible navigation and completion controls', () => {
  expect(demoScreens).toEqual(['context', 'decision', 'decision', 'stability', 'certificate']);
  for (let index = 0; index < 5; index++) {
    const html = renderToStaticMarkup(<GuidedDemo index={index} onStep={()=>{}} onExit={()=>{}} example="soybean" onExample={()=>{}}/>);
    expect(html).toContain(`Step ${index + 1} of 5`);
    expect(html).toContain('Exit demo'); expect(html).toContain('Back');
    expect(html).toContain('Default reference analysis');
    expect(html).toContain(index < 4 ? '>Next<' : 'Explore independently');
    if (index === 4) expect(html).toContain('Restart demo');
  }
});

it('uses engine-produced permission branches without an Apply control in demo previews', async () => {
  const read = (name:string) => JSON.parse(readFileSync(`public/evidence/history/${name}`, 'utf8'));
  const evidence = validateAnalysisEvidence({...read('analysis-input.json'), precipitation:read('imerg-analysis-input.json')});
  const a = await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:.5});
  const items = await nextEvidence(evidence,a);
  if (a.evaluation.state !== 'evaluated') throw new Error('Unevaluated');
  for (const crop of ['soybean', 'sunflower']) {
    const html = renderToStaticMarkup(<EvidenceWorkbench items={items} before={a.evaluation.result} busy={false} onApply={()=>{throw new Error('Must not apply');}} previewOnly initialQuestion={`permission-${crop}`} initialAnswer="forbidden"/>);
    expect(html).not.toContain('Apply to analysis'); expect(html).toContain('Demo preview only');
    expect(html).toContain('Not defined');
    expect(html).toContain(crop === 'soybean' ? 'Sole eligible plan' : 'No eligible decision');
  }
});

it('keeps ordinary application controls and handles a non-permission preview', async () => {
  const read = (name:string) => JSON.parse(readFileSync(`public/evidence/history/${name}`, 'utf8'));
  const evidence = validateAnalysisEvidence({...read('analysis-input.json'), precipitation:read('imerg-analysis-input.json')});
  const a = await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:.5});
  const items = await nextEvidence(evidence,a);
  if (a.evaluation.state !== 'evaluated') throw new Error('Unevaluated');
  const ordinary = renderToStaticMarkup(<EvidenceWorkbench items={items} before={a.evaluation.result} busy={false} onApply={()=>{}} initialAnswer="forbidden"/>);
  expect(ordinary).toContain('Apply to analysis');
  const preview = renderToStaticMarkup(<EvidenceWorkbench items={items} before={a.evaluation.result} busy={false} onApply={()=>{}} previewOnly initialQuestion="relative-exposure-preference" initialAnswer="forbidden"/>);
  expect(preview).toContain('aria-pressed="true"'); expect(preview).not.toContain('Apply to analysis');
});

it('presents the five methodology stages in a semantic ordered list', () => {
  const html = renderToStaticMarkup(<MethodOverview/>);
  expect((html.match(/<li>/g)??[]).length).toBe(5);
  for (const stage of ['Observe','Measure','Compare','Challenge','Trace']) expect(html).toContain(stage);
});
