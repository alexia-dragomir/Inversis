"""Independent Phase 2 diagnostics from the separately verified raw-source oracle.
No TypeScript imports; no new NASA acquisition or observation interpolation.
"""
import hashlib
import json
from pathlib import Path

root=Path('public/evidence/history')
raw=(root/'combined-independent-oracle.json').read_bytes()
source=json.loads(raw)
physical={(r['crop'],r['year'],r['shift']):r for r in source['physical']}
plans={'baseline':['wheat','maize','sunflower','wheat','maize'],
       'a':['wheat','soybean','maize','sunflower','maize'],
       'b':['wheat','sunflower','maize','soybean','maize']}
refs={}
for kind in ['heat','dry']:
    values=sorted(r[kind] for r in source['physical'] if r['shift']==0)
    assert len(values)==40 and all(v is not None for v in values)
    refs[kind]={'lower':values[3],'upper':values[35]}

def compute(weight,shift,bounds,omit=None):
    losses={c:{} for c in plans}
    for start in range(2015,2021):
        scenario=f'fixed-{start}-{start+4}'
        if scenario==omit: continue
        for c,crops in plans.items():
            loss=0
            for i,crop in enumerate(crops):
                row=physical[(crop,start+i,shift)]
                for indicator,w in [('heat',weight),('dry',1-weight)]:
                    ref=bounds[indicator]
                    loss+=w*max(0,min(1,(row[indicator]-ref['lower'])/(ref['upper']-ref['lower'])))/5
            losses[c][scenario]=loss
    regrets={c:{s:v-min(losses[q][s] for q in plans) for s,v in values.items()} for c,values in losses.items()}
    worst={c:max(values.values()) for c,values in regrets.items()}
    selected=[c for c in plans if worst[c]-min(worst.values())<=1e-10]
    return {'heatWeight':weight,'shift':shift,'omitted':omit,'lossMatrix':losses,'regretMatrix':regrets,'worstRegrets':worst,'preferredSet':selected}

primary=[compute(i/20,s,source['referenceBounds']) for s in [-14,-7,0,7,14] for i in range(21)]
percentiles=[compute(i/20,s,refs) for s in [-14,-7,0,7,14] for i in range(21)]
omissions=[compute(.5,0,source['referenceBounds'],f'fixed-{y}-{y+4}') for y in range(2015,2021)]
result={'schemaVersion':'inversis-interpretation-oracle-v1','sourceOracleSha256':hashlib.sha256(raw).hexdigest(),
        'codeSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'percentileBounds':refs,
        'primaryCalendarGrid':primary,'percentileCalendarGrid':percentiles,'replayOmissions':omissions,
        'scope':'Independent arithmetic from the source-bound physical oracle; 105 primary + 105 P10/P90 weight/calendar configurations, six replay omissions. No confidence inference.'}
(root/'interpretation-oracle.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'percentileBounds':refs,'primarySets':sorted({tuple(c['preferredSet']) for c in primary}),'percentileSets':sorted({tuple(c['preferredSet']) for c in percentiles}),'omissionSets':[c['preferredSet'] for c in omissions]},indent=2))
