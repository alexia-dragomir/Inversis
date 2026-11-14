"""Independent h5py audit and deterministic annual archives of actual NASA bytes.

Run only after the daily acquisition completes. This does not create observations.
"""
import datetime as dt
import gzip
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

root = Path('public/evidence/history/imerg')
root.mkdir(parents=True, exist_ok=True)
epoch = dt.datetime(1980, 1, 6, tzinfo=dt.timezone.utc)
years = [int(sys.argv[1])] if len(sys.argv) > 1 else range(2015, 2025)
assert all(2015 <= year <= 2024 for year in years)
for year in years:
    captures, members = [], []
    day = dt.date(year, 1, 1)
    while day.year == year:
        date = day.isoformat()
        path = Path(f'.local/imerg-dap4/downloads/{date}.nc4')
        public = Path(f'public/evidence/imerg-dap4/{date}.nc4')
        if public.exists():
            path = public
            receipt = json.loads(Path(str(path)+'.receipt.json').read_text('utf8'))
            url, retrieved = receipt['sourceUrl'], receipt['retrievalTimeUTC']
        else:
            receipt = json.loads(Path(str(path)+'.http.json').read_text('utf8'))
            assert receipt['status'] == 200
            url, retrieved = receipt['url'], receipt['retrievedAtUTC']
        raw = path.read_bytes()
        checksum = hashlib.sha256(raw).hexdigest()
        assert checksum == receipt['sha256'] and len(raw) == receipt['bytes']
        assert url.startswith('https://opendap.earthdata.nasa.gov/collections/C2723754864-GES_DISC/')
        assert 'Authorization' not in json.dumps(receipt) and 'X-Amz-' not in url
        with h5py.File(io.BytesIO(raw), 'r') as f:
            def text(v):
                return v.decode('utf8') if isinstance(v, bytes) else str(v)
            assert text(f.attrs['DOI']) == '10.5067/GPM/IMERGDF/DAY/07'
            assert text(f.attrs['BeginDate']) == date == text(f.attrs['EndDate'])
            assert text(f['precipitation'].attrs['units']) == 'mm/day'
            assert text(f['precipitation_cnt'].attrs['units']) == 'count'
            assert text(f['time'].attrs['units']) == 'days since 1980-01-06 00:00:00Z'
            assert url in text(f.attrs['history'])
            lat, lon = f['lat'][:], f['lon'][:]
            yi = np.flatnonzero((lat-.05 <= 44.565) & (44.565 < lat+.05))
            xi = np.flatnonzero((lon-.05 <= 27.335) & (27.335 < lon+.05))
            assert len(yi) == len(xi) == 1
            yi, xi = int(yi[0]), int(xi[0])
            assert f['precipitation'].shape == (1, len(lon), len(lat))
            assert f['precipitation'].dims[1][0].name == '/lon'
            assert f['precipitation'].dims[2][0].name == '/lat'
            start = epoch + dt.timedelta(days=float(f['time'][0]))
            assert start.isoformat() == date+'T00:00:00+00:00'
            bounds = f['time_bnds'][:].reshape(-1)
            assert bounds[0] == f['time'][0]
            assert 86398.999 <= (float(bounds[1])-float(bounds[0]))*86400 <= 86400
            value = float(f['precipitation'][0, xi, yi])
            count = int(f['precipitation_cnt'][0, xi, yi])
            fill = float(f['precipitation'].attrs['_FillValue'][0])
            assert fill == -9999.900390625 and 0 <= count <= 48
            status = 'missing' if value == fill or count == 0 else 'unverified' if count < 48 else 'valid'
            assert status != 'valid' or np.isfinite(value) and value >= 0
            captures.append({'day': date, 'rawValue': value, 'count': count, 'status': status,
                             'latitude': float(lat[yi]), 'longitude': float(lon[xi]),
                             'sha256': checksum, 'bytes': len(raw), 'sourceUrl': url,
                             'retrievalTimeUTC': retrieved, 'receipt': receipt})
        members.append((date+'.nc4', raw))
        day += dt.timedelta(days=1)
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w', format=tarfile.USTAR_FORMAT) as archive:
        for name, raw in members:
            info = tarfile.TarInfo(name)
            info.size, info.mtime, info.mode = len(raw), 0, 0o644
            archive.addfile(info, io.BytesIO(raw))
    compressed = io.BytesIO()
    with gzip.GzipFile(fileobj=compressed, mode='wb', filename='', compresslevel=9, mtime=0) as stream:
        stream.write(buffer.getvalue())
    packed = compressed.getvalue()
    (root/f'{year}.tar.gz').write_bytes(packed)
    manifest = {'schemaVersion': 'inversis-imerg-year-v1', 'year': year,
                'archiveSha256': hashlib.sha256(packed).hexdigest(), 'archiveBytes': len(packed),
                'reader': {'h5py': h5py.__version__, 'hdf5': h5py.version.hdf5_version, 'numpy': np.__version__},
                'independentReaderCodeSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'captures': captures}
    (root/f'{year}.manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf8', newline='\n')
    print(f'{year}: {len(captures)} independently parsed daily files; {len(packed)} archived bytes', flush=True)
