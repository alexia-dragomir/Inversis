"""Read retained real NetCDFs using h5py, independently of the JS/WASM reader.

Install h5py==3.15.1 into an isolated environment (local validation uses .local/python-validation).
No fabricated observations; no interpolation. Retains source hashes and reader versions.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys

local = Path('.local/python-validation')
if local.exists():
    sys.path.insert(0, str(local.resolve()))
import h5py
import numpy as np

root = Path('public/evidence/imerg-dap4')
observations = []
epoch = dt.datetime(1980, 1, 6, tzinfo=dt.timezone.utc)
for path in sorted(root.glob('????-??-??.nc4')):
    day = path.stem
    with h5py.File(path, 'r') as f:
        def text(v):
            return v.decode('utf8') if isinstance(v, bytes) else str(v)
        assert text(f.attrs['DOI']) == '10.5067/GPM/IMERGDF/DAY/07'
        assert text(f.attrs['BeginDate']) == day == text(f.attrs['EndDate'])
        assert text(f['precipitation'].attrs['units']) == 'mm/day'
        assert text(f['precipitation_cnt'].attrs['units']) == 'count'
        assert text(f['time'].attrs['units']) == 'days since 1980-01-06 00:00:00Z'
        lat, lon = f['lat'][:], f['lon'][:]
        yi = np.flatnonzero((lat-.05 <= 44.565) & (44.565 < lat+.05))
        xi = np.flatnonzero((lon-.05 <= 27.335) & (27.335 < lon+.05))
        assert len(yi) == len(xi) == 1
        yi, xi = int(yi[0]), int(xi[0])
        assert f['precipitation'].shape == (1, len(lon), len(lat))
        assert f['precipitation'].dims[1][0].name == '/lon'
        assert f['precipitation'].dims[2][0].name == '/lat'
        start = epoch + dt.timedelta(days=float(f['time'][0]))
        assert start.isoformat() == day+'T00:00:00+00:00'
        bounds = f['time_bnds'][:].reshape(-1)
        assert bounds[0] == f['time'][0]
        assert 86398.999 <= (float(bounds[1])-float(bounds[0]))*86400 <= 86400
        value = float(f['precipitation'][0, xi, yi])
        count = int(f['precipitation_cnt'][0, xi, yi])
        fill = float(f['precipitation'].attrs['_FillValue'][0])
        assert fill < 0 and 0 <= count <= 48
        status = 'missing' if value == fill or count == 0 else 'unverified' if count < 48 else 'valid'
        assert status != 'valid' or np.isfinite(value) and value >= 0
        observations.append({'day': day, 'rawValue': value, 'count': count, 'status': status,
                             'latitude': float(lat[yi]), 'longitude': float(lon[xi]),
                             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
output = {'method': 'Independent h5py extraction from retained NetCDF4; containing native cell; no interpolation',
          'h5pyVersion': h5py.__version__, 'hdf5Version': h5py.version.hdf5_version,
          'numpyVersion': np.__version__, 'observations': observations,
          'oracleCodeSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
(root/'independent-oracle.json').write_text(json.dumps(output, indent=2)+'\n', encoding='utf8', newline='\n')
print(json.dumps(observations, indent=2))
