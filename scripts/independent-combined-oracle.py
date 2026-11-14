"""Independent raw-data rainfall+heat arithmetic. No imports from TypeScript.

Reads every retained original IMERG NetCDF archive through h5py, and raw POWER JSON.
Checks declared metadata and source hashes before computing any comparison.
"""
import datetime as dt
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile

local = Path('.local/python-validation')
if local.exists():
    sys.path.insert(0, str(local.resolve()))
import h5py
import numpy as np

root = Path('public/evidence/history')
rain, heat, source_hashes = {}, {}, {}
epoch = dt.datetime(1980, 1, 6, tzinfo=dt.timezone.utc)
for year in range(2015, 2025):
    raw = (root/'power'/f'{year}.json').read_bytes()
    power = json.loads(raw)
    assert power['header']['time_standard'] == 'UTC'
    assert power['parameters']['T2M_MAX']['units'] == 'C'
    source_hashes[f'power-{year}'] = hashlib.sha256(raw).hexdigest()
    for compact, value in power['properties']['parameter']['T2M_MAX'].items():
        assert np.isfinite(value) and value != power['header']['fill_value'] and value >= -273.15
        heat[dt.datetime.strptime(compact, '%Y%m%d').date()] = value
    path = root/'imerg'/f'{year}.tar.gz'
    packed = path.read_bytes()
    metadata = json.loads((root/'imerg'/f'{year}.manifest.json').read_text('utf8'))
    assert hashlib.sha256(packed).hexdigest() == metadata['archiveSha256']
    source_hashes[f'imerg-{year}'] = metadata['archiveSha256']
    captures = {c['day']: c for c in metadata['captures']}
    with tarfile.open(fileobj=io.BytesIO(packed), mode='r:gz') as archive:
        for member in archive:
            assert member.isfile() and '/' not in member.name and member.name.endswith('.nc4')
            date = dt.date.fromisoformat(member.name[:-4])
            assert date.year == year and date not in rain
            raw = archive.extractfile(member).read()
            capture = captures[date.isoformat()]
            assert hashlib.sha256(raw).hexdigest() == capture['sha256']
            with h5py.File(io.BytesIO(raw), 'r') as f:
                def text(value):
                    return value.decode('utf8') if isinstance(value, bytes) else str(value)
                assert text(f.attrs['DOI']) == '10.5067/GPM/IMERGDF/DAY/07'
                assert text(f.attrs['BeginDate']) == date.isoformat() == text(f.attrs['EndDate'])
                assert text(f['precipitation'].attrs['units']) == 'mm/day'
                assert text(f['precipitation_cnt'].attrs['units']) == 'count'
                assert text(f['time'].attrs['units']) == 'days since 1980-01-06 00:00:00Z'
                assert (epoch+dt.timedelta(days=float(f['time'][0]))).date() == date
                lat, lon = f['lat'][:], f['lon'][:]
                yi = np.flatnonzero((lat-.05 <= 44.565) & (44.565 < lat+.05))
                xi = np.flatnonzero((lon-.05 <= 27.335) & (27.335 < lon+.05))
                assert len(yi) == len(xi) == 1
                assert f['precipitation'].dims[1][0].name == '/lon' and f['precipitation'].dims[2][0].name == '/lat'
                value = float(f['precipitation'][0, int(xi[0]), int(yi[0])])
                count = int(f['precipitation_cnt'][0, int(xi[0]), int(yi[0])])
                fill = float(f['precipitation'].attrs['_FillValue'][0])
                assert value == capture['rawValue'] and count == capture['count']
                rain[date] = value if count == 48 and value != fill and np.isfinite(value) and value >= 0 else None
    print(f'Independent combined oracle: parsed {year}', flush=True)

expected = {dt.date(2015, 1, 1)+dt.timedelta(days=i) for i in range(3653)}
assert set(rain) == expected == set(heat)
windows = {'wheat': ('05-01', '06-30'), 'maize': ('07-01', '08-31'),
           'sunflower': ('06-20', '08-10'), 'soybean': ('06-15', '08-31')}
plans = {'baseline': ['wheat', 'maize', 'sunflower', 'wheat', 'maize'],
         'a': ['wheat', 'soybean', 'maize', 'sunflower', 'maize'],
         'b': ['wheat', 'sunflower', 'maize', 'soybean', 'maize']}
physical = {}
for shift in [-14, -7, 0, 7, 14]:
    for year in range(2015, 2025):
        for crop, (begin, end) in windows.items():
            day = dt.date.fromisoformat(f'{year}-{begin}')+dt.timedelta(days=shift)
            stop = dt.date.fromisoformat(f'{year}-{end}')+dt.timedelta(days=shift)
            hot = count = run = longest = 0
            valid = True
            while day <= stop:
                if rain[day] is None:
                    valid = False
                else:
                    run = run+1 if rain[day] < 1 else 0
                    longest = max(longest, run)
                hot += heat[day] >= 35
                count += 1
                day += dt.timedelta(days=1)
            physical[(crop, year, shift)] = {'heat': hot/count, 'dry': longest if valid else None, 'hotDays': hot, 'expectedDays': count}
reference = {}
for indicator in ['heat', 'dry']:
    population = [v[indicator] for (crop, year, shift), v in physical.items() if shift == 0]
    assert len(population) == 40 and all(v is not None for v in population)
    reference[indicator] = {'lower': min(population), 'upper': max(population)}
    assert reference[indicator]['upper'] > reference[indicator]['lower']

def calculate(weight, shift=0, phase=0):
    losses, regrets = {c: {} for c in plans}, {c: {} for c in plans}
    for start in range(2015, 2021):
        scenario = f'fixed-{start}-{start+4}'
        complete = all(physical[(crops[(p+phase)%5], start+p, shift)]['dry'] is not None
                       for crops in plans.values() for p in range(5))
        if not complete:
            continue
        for candidate, crops in plans.items():
            exposures = {'heat': [], 'dry': []}
            for p in range(5):
                row = physical[(crops[(p+phase)%5], start+p, shift)]
                for indicator in ['heat', 'dry']:
                    ref = reference[indicator]
                    exposures[indicator].append(max(0, min(1, (row[indicator]-ref['lower'])/(ref['upper']-ref['lower']))))
            losses[candidate][scenario] = weight*sum(exposures['heat'])/5+(1-weight)*sum(exposures['dry'])/5
        minimum = min(losses[c][scenario] for c in plans)
        for candidate in plans:
            regrets[candidate][scenario] = losses[candidate][scenario]-minimum
    assert len(losses['baseline']) >= 2
    worst = {c: max(values.values()) for c, values in regrets.items()}
    average = {c: sum(values.values())/len(values) for c, values in losses.items()}
    return {'heatWeight': weight, 'shift': shift, 'phase': phase, 'lossMatrix': losses,
            'regretMatrix': regrets, 'worstRegrets': worst, 'averageLoss': average,
            'preferredSet': [c for c in plans if worst[c]-min(worst.values()) <= 1e-10]}

cases = [calculate(i/20) for i in range(21)]
cases += [calculate(.5, shift=s) for s in [-14, -7, 7, 14]]
cases += [calculate(.5, phase=p) for p in [1, 2, 3, 4]]
output = {'method': 'Independent Python arithmetic from every original POWER response and IMERG NetCDF; no TS imports',
          'sourceHashes': source_hashes, 'referenceBounds': reference,
          'dailyCoverage': {'expected': 3653, 'rainValid': sum(v is not None for v in rain.values()), 'heatValid': len(heat)},
          'physical': [{'crop': crop, 'year': year, 'shift': shift, **v} for (crop, year, shift), v in physical.items()],
          'cases': cases, 'oracleCodeSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'reader': {'h5py': h5py.__version__, 'hdf5': h5py.version.hdf5_version, 'numpy': np.__version__}}
(root/'combined-independent-oracle.json').write_text(json.dumps(output, indent=2)+'\n', encoding='utf8', newline='\n')
print(json.dumps({'referenceBounds': reference, 'default': cases[10], 'gridPreferredSets': [c['preferredSet'] for c in cases[:21]]}, indent=2))
