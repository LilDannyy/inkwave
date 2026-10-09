#!/usr/bin/env python3
# Bluestone blockout: the appear check (fix round 1, review issue 3; DESIGN.md §3.6 #3, §6.1 #4; ENGINE rules 19-22).
#   python3 appear-check.py <dump-union.json>        (dump-layout.mjs with ERA=all, MODE=turf or tower)
# For each jump (1→2, 2→3): every piece that exists in the new era and not in the old one, cell by cell (0.25 m) over its
# footprint, against every place a kid can STAND in the old era beneath or inside it: a walkable top (solid, not roof,
# rail or hidden) with nothing solid of the old era in the 1.45 m above it. A violation is a new piece that occupies any
# of the 3.4 m above such a top (ENGINE: a swim-jump apex of 1.77 m + a 1.45 m kid + margin). Prints each offending
# (new piece, old top) pair with the area and the worst gap, and RESULT <n> violations.
import json, sys, numpy as np
D = json.load(open(sys.argv[1])); P = D['pieces']
MASK = {'1': 1, '12': 3, '2': 2, '23': 6, '3': 4, '': 7}
has = lambda p, e: (MASK[p['eras']] >> (e - 1)) & 1
RES = 0.25
def cells(poly):
    Pp = np.array(poly); x0, z0 = Pp.min(0); x1, z1 = Pp.max(0)
    xs = np.arange(np.floor(x0 / RES) * RES + RES / 2, x1, RES); zs = np.arange(np.floor(z0 / RES) * RES + RES / 2, z1, RES)
    if not len(xs) or not len(zs): return np.zeros((0, 2))
    GX, GZ = np.meshgrid(xs, zs); m = inside(poly, GX, GZ)
    return np.stack([GX[m], GZ[m]], 1)
def inside(poly, x, z):
    Pp = np.array(poly); S = []
    for i in range(len(Pp)):
        ax, az = Pp[i]; bx, bz = Pp[(i + 1) % len(Pp)]; S.append((bx - ax) * (z - az) - (bz - az) * (x - ax))
    S = np.stack(S); return np.all(S >= -1e-9, 0) | np.all(S <= 1e-9, 0)
def top_at(p, x, z):   # the piece's top (ramps: on the slope) and bottom at (x, z)
    if p['k'] == 'r':
        lx, lz = p['lo']; hx, hz = p['hi']; dx, dz = hx - lx, hz - lz; L2 = dx * dx + dz * dz
        t = np.clip(((x - lx) * dx + (z - lz) * dz) / L2, 0, 1); top = p['ly'] + t * (p['hy'] - p['ly'])
        return top, top - 1.0   # (ramps: their body under the slope; 1 m is enough here)
    return np.full(np.shape(x), p['y1']), np.full(np.shape(x), p['y0'])
def bbox(p):
    a = np.array(p['poly']); return a[:, 0].min(), a[:, 0].max(), a[:, 1].min(), a[:, 1].max()
for p in P: p['bb'] = bbox(p)
def near(p, q): return not (q['bb'][1] < p['bb'][0] or q['bb'][0] > p['bb'][1] or q['bb'][3] < p['bb'][2] or q['bb'][2] > p['bb'][3])
total = 0
for ea, eb in ((1, 2), (2, 3)):
    old = [q for q in P if has(q, ea) and q['solid']]
    walk = [q for q in old if not q['roof'] and not q['rail'] and not q['hidden']]
    new = [p for p in P if has(p, eb) and not has(p, ea) and p['solid']]
    found = {}
    for p in new:
        C = cells(p['poly'])
        if not len(C): continue
        ptop, pbot = top_at(p, C[:, 0], C[:, 1])
        cand_w = [q for q in walk if near(p, q)]; cand_o = [q for q in old if near(p, q)]
        for q in cand_w:
            m = inside(q['poly'], C[:, 0], C[:, 1])
            if not m.any(): continue
            X, Z = C[m, 0], C[m, 1]; qt, _ = top_at(q, X, Z); pt, pb = ptop[m], pbot[m]
            # standable: nothing solid of the old era in (qt + 0.05, qt + 1.45)
            free = np.ones(len(X), bool)
            for o in cand_o:
                if o is q: continue
                mo = inside(o['poly'], X, Z)
                if not mo.any(): continue
                ot, ob = top_at(o, X, Z)
                free &= ~(mo & (ob < qt + 1.45) & (ot > qt + 0.05))
            # the new piece occupies part of the 3.4 m above the top
            hit = free & (pb < qt + 3.4) & (pt > qt + 0.02)
            if hit.any():
                key = (ea, eb, p['tag'], p['grp'], q['tag'])
                gap = float(np.min(np.maximum(pb[hit] - qt[hit], 0)))
                area = hit.sum() * RES * RES
                w = found.get(key)
                if not w or area > w[0]: found[key] = (area, round(gap, 2), [round(float(X[hit][0]), 2), round(float(Z[hit][0]), 2)], round(float(qt[hit][0]), 2))
    print(f'== jump {ea} -> {eb}: {len(new)} appearing pieces, {len(found)} violations')
    for k, v in sorted(found.items(), key=lambda kv: -kv[1][0]):
        print(f'   {k[2]} [{k[3]}] over {k[4]} (top {v[3]}): {v[0]:.2f} m2, gap {v[1]} m, at {v[2]}')
    total += len(found)
print('RESULT', total, 'violations')
