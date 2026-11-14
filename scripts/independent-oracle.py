"""Independent standard-library arithmetic check, using retained real POWER bytes.

No imports from the TypeScript engine. No synthetic data or missing-value filling.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path

root = Path('public/evidence/history')
windows = {'wheat': ('05-01', '06-30'), 'maize': ('07-01', '08-31'),
           'sunflower': ('06-20', '08-10'), 'soybean': ('06-15', '08-31')}
plans = {'baseline': ['wheat', 'maize', 'sunflower', 'wheat', 'maize'],
         'a': ['wheat', 'soybean', 'maize', 'sunflower', 'maize'],
         'b': ['wheat', 'sunflower', 'maize', 'soybean', 'maize']}
physical = {}
checksums = {}
for year in range(2015, 2025):
    raw = (root / 'power' / f'{year}.json').read_bytes()
    checksums[str(year)] = hashlib.sha256(raw).hexdigest()
    response = json.loads(raw)
    assert response['header']['time_standard'] == 'UTC'
    assert response['parameters']['T2M_MAX']['units'] == 'C'
    values = response['properties']['parameter']['T2M_MAX']
    fill = response['header']['fill_value']
    for crop, (begin, end) in windows.items():
        day = dt.date.fromisoformat(f'{year}-{begin}')
        stop = dt.date.fromisoformat(f'{year}-{end}')
        hot = count = 0
        while day <= stop:
            value = values[day.strftime('%Y%m%d')]
            assert isinstance(value, (int, float)) and value != fill and value >= -273.15
            hot += value >= 35
            count += 1
            day += dt.timedelta(days=1)
        physical[(crop, year)] = {'hotDays': hot, 'expectedDays': count, 'fraction': hot / count}

low = min(v['fraction'] for v in physical.values())
high = max(v['fraction'] for v in physical.values())
assert high > low
losses = {candidate: {} for candidate in plans}
regrets = {candidate: {} for candidate in plans}
for start in range(2015, 2021):
    scenario = f'fixed-{start}-{start+4}'
    for candidate, crops in plans.items():
        exposures = [(physical[(crop, start+position)]['fraction']-low)/(high-low)
                     for position, crop in enumerate(crops)]
        losses[candidate][scenario] = sum(exposures)/5
    best = min(losses[candidate][scenario] for candidate in plans)
    for candidate in plans:
        regrets[candidate][scenario] = losses[candidate][scenario]-best
worst = {c: max(values.values()) for c, values in regrets.items()}
average = {c: sum(values.values())/len(values) for c, values in losses.items()}
preferred = [c for c, value in worst.items() if value-min(worst.values()) <= 1e-10]
output = {'method': 'Independent Python stdlib oracle; actual POWER only; zero shift; no exclusions; heat weight 1',
          'sourceHashes': checksums, 'referenceBounds': {'lower': low, 'upper': high},
          'spotChecks': [{'crop': crop, 'year': year, **physical[(crop, year)]}
                         for crop, year in [('wheat', 2015), ('maize', 2024)]],
          'lossMatrix': losses, 'regretMatrix': regrets, 'worstRegrets': worst,
          'averageLoss': average, 'preferredSet': preferred,
          'oracleCodeSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
(root / 'independent-oracle.json').write_text(json.dumps(output, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'spotChecks': output['spotChecks'], 'referenceBounds': output['referenceBounds'],
                  'worstRegrets': worst, 'averageLoss': average, 'preferredSet': preferred}, indent=2))
