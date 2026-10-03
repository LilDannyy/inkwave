import numpy as np, math, json
import raster, plan
from raster import XX, ZZ, RES
PATH = [(0, 0), (0, -25.5), (3.5, -25.5), (3.5, -34.0), (-13.0, -34.0), (-13.0, -43.0), (8.0, -43.0), (8.0, -52.0)]
CPS = [(0, -22.5), (-8.0, -34.0), (-4.0, -43.0)]
def run(lv):
    S = raster.build(lv)
    top, roof, rail = S['top'], S['roof'], S['rail']
    L = 0; legs = []
    issues = []
    minfloor = 99
    for (a, b) in zip(PATH, PATH[1:]):
        seg = math.hypot(b[0] - a[0], b[1] - a[1]); legs.append(round(seg, 1)); L += seg
        n = int(seg / 0.25) + 1
        for k in range(n + 1):
            x = a[0] + (b[0] - a[0]) * k / n; z = a[1] + (b[1] - a[1]) * k / n
            lane = (np.abs(XX - x) <= 1.25) & (np.abs(ZZ - z) <= 1.25)
            fl = top[lane]
            minfloor = min(minfloor, float(np.nanmin(np.where(np.isfinite(fl), fl, np.nan))) if np.isfinite(fl).any() else -9)
            if not np.isfinite(fl).all():
                issues.append(('hole', round(x, 1), round(z, 1)))
            near = (np.abs(XX - x) <= 1.75) & (np.abs(ZZ - z) <= 1.75)
            if (roof & near).any() or (rail & near).any():
                issues.append(('clutter', round(x, 1), round(z, 1)))
    # dedupe
    seen = []; 
    for it in issues:
        if not seen or abs(seen[-1][1] - it[1]) + abs(seen[-1][2] - it[2]) > 1.0 or seen[-1][0] != it[0]:
            seen.append(it)
    # checkpoint distances
    def along(p):
        acc = 0
        for (a, b) in zip(PATH, PATH[1:]):
            seg = math.hypot(b[0] - a[0], b[1] - a[1])
            # on segment?
            ux, uz = (b[0] - a[0]) / seg, (b[1] - a[1]) / seg
            t = (p[0] - a[0]) * ux + (p[1] - a[1]) * uz
            off = abs(-(p[0] - a[0]) * uz + (p[1] - a[1]) * ux)
            if off < 0.01 and -0.01 <= t <= seg + 0.01:
                return acc + t
            acc += seg
    return dict(L=round(L, 1), legs=legs, minfloor=minfloor, cps=[(c, round(along(c), 1), round(100 * along(c) / L)) for c in CPS], issues=seen[:40])
for lv in ('low', 'high'):
    print(lv, json.dumps(run(lv)))
