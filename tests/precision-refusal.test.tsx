import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {analyze,certificate,validateAnalysisEvidence} from '../src/engine/analysis';
import {AuditRecord} from '../src/components/AuditRecord';
import {DecisionInstrument} from '../src/components/DecisionInstrument';
import {PreferenceInstrument} from '../src/components/PreferenceInstrument';
import {preferenceSensitivity} from '../src/engine/stability';
import {numericalPolicy} from '../src/engine/decision';
const read=(name:string)=>JSON.parse(readFileSync(`public/evidence/history/${name}`,'utf8'));
const power=validateAnalysisEvidence(read('analysis-input.json'));
const full=validateAnalysisEvidence({...power,precipitation:read('imerg-analysis-input.json')});

it('renders missing-rainfall and no-eligible refusals without a fabricated winner or numerical margin',async()=>{
  for(const [evidence,forbidden] of [[power,[]],[full,['sunflower']]] as const){
    const analysis=await analyze(evidence,{mode:'heat-and-rainfall',shift:7,heatWeight:.2,forbidden});
    const sweep=await preferenceSensitivity({...analysis,...numericalPolicy,fingerprint:analysis.inputFingerprint},analysis.analysisFingerprint);
    const audit=await certificate(evidence,analysis,[]);
    expect(audit.decision.computation).toBeUndefined();
    expect(renderToStaticMarkup(<DecisionInstrument analysis={analysis}/>)).toBe('');
    const profile=renderToStaticMarkup(<PreferenceInstrument analysis={analysis} sweep={sweep} onWeight={()=>{}}/>);
    expect(profile).not.toContain('interactive-profile');
    expect(profile).toContain(forbidden.length?'No eligible plan':'insufficient');
    const html=renderToStaticMarkup(<AuditRecord audit={audit} onExport={()=>{}} busy={false}/>);
    expect(html).toContain('Not defined');expect(html).not.toContain('0.0000');
    expect(html).toContain(audit.fingerprint);expect(html).toContain('print-disclosures');
  }
});
