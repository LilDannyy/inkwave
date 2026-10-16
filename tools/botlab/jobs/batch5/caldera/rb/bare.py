# bare same-level plates: for each floor cell, the distance to the nearest cell that is not floor at the same height
# (a tier face, a cover block, a hole, the edge): a value ≥ 5 is the centre of a 10 m disc of bare plate
import sys, json, numpy as np
from scipy import ndimage
for f in sys.argv[1:]:
    d = json.load(open(f)); g = np.array(d['grid'], float).reshape(d['nz'], d['nx'])
    best = np.zeros_like(g)
    for y in sorted(set(np.round(g[g > -1], 1))):
        same = np.abs(g - y) < 0.06
        dist = ndimage.distance_transform_edt(same)
        best[same] = dist[same]
    lab, n = ndimage.label(best >= 5)
    out = []
    for k in range(1, n + 1):
        m = lab == k; ys, xs = np.nonzero(m); j = np.argmax(np.where(m, best, 0)); jy, jx = np.unravel_index(j, best.shape)
        out.append((round(float(best[jy, jx]) * 2, 1), d['x0'] + jx + 0.5, round(float(g[jy, jx]), 1), d['z0'] + jy + 0.5))
    out.sort(reverse=True)
    print(f, 'bare discs ≥ 10 m (diameter, x, y, z):', out[:12])
