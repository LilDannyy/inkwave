import numpy as np, raster, plan
from raster import XX, ZZ
from geo import pip
items = []
for p in raster.all_pieces():
    if p['side'] == 'B': continue
    if p['kind'] == 'roof' or p['ramp'] is not None or p['name'] in ('Pumice Moorings', 'Casting bed', 'Weighbridge pit', 'Bastion', 'Gauge Post') or 'stump' in p['name'] or 'mound' in p['name'] or 'cone' in p['name']:
        items.append((p['name'], pip(p['poly'], XX, ZZ)))
import math
for (nm, cx, cz, R, h, base) in plan.MOUNDS:
    items.append((nm + ' base', np.hypot(XX - cx, ZZ - cz) < R))
bad = []
for i in range(len(items)):
    for j in range(i + 1, len(items)):
        a, b = items[i], items[j]
        if {a[0], b[0]} <= {'Surge Gauge pier'}: continue
        ov = (a[1] & b[1]).sum() * 0.0625
        if ov > 0.05:
            bad.append((a[0], b[0], round(ov, 2)))
print('\n'.join(map(str, bad)) or 'no overlaps')
# stones and organs vs static walkable/roof
