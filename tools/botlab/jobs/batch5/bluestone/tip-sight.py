#!/usr/bin/env python3
# Bluestone blockout (scratch, round B fix 1, review issue 2): the tram terminus's view, the review's ray test.
#   python3 tip-sight.py <dump.json> [<dump.json> …]      (dump-layout.mjs, ERA=1|2|3, MODE=turf)
# Kid eyes on a 1.5 m grid over Alpha's terminus platform (its top, from the layout: along −56 … −48, off 3.5 … 9.5,
# 1.4 + 1.45 m), aimed at chest height (1.0) on a grid over Prow Place (x −23.5 … −19.5, z −28 … −18); a line is clear
# when no solid piece (rails, glass and hidden pieces excepted: they do not stop sight) holds any of its points (0.25 m
# steps). Also the view back down the arm street: the same eyes to chest height on the street's axis line (off −2 … 6)
# at along −36 … −24. Prints the share of clear lines and the pieces that block the most.
import json, sys, numpy as np
S65, C65 = np.sin(np.radians(65)), np.cos(np.radians(65))
AO = lambda a, o: np.array([a * S65 - o * C65, a * C65 + o * S65])
def load(fn):
    D = json.load(open(fn)); out = []
    for p in D['pieces']:
        if not p['solid'] or p['rail'] or p['hidden']: continue
        P = np.array(p['poly'])
        if p['k'] == 'r': y0, y1, lo, hi = min(p['ly'], p['hy']) - 1.0, max(p['ly'], p['hy']), p['lo'], p['hi']
        else: y0, y1, lo, hi = p['y0'], p['y1'], None, None
        out.append((P, y0, y1, p['tag'], lo, hi, p))
    return D, out
def inpoly(P, x, z):
    s = []
    for i in range(len(P)):
        ax, az = P[i]; bx, bz = P[(i + 1) % len(P)]; s.append((bx - ax) * (z - az) - (bz - az) * (x - ax))
    s = np.stack(s); return np.all(s >= -1e-9, 0) | np.all(s <= 1e-9, 0)
def clear(pcs, e, t):
    n = int(np.linalg.norm(t[[0, 2]] - e[[0, 2]]) / 0.25) + 2
    f = np.linspace(0.02, 0.98, n); X = e[0] + (t[0] - e[0]) * f; Y = e[1] + (t[1] - e[1]) * f; Z = e[2] + (t[2] - e[2]) * f
    who = set()
    for P, y0, y1, tag, lo, hi, p in pcs:
        x0, z0 = P.min(0); x1, z1 = P.max(0)
        c = (X >= x0) & (X <= x1) & (Z >= z0) & (Z <= z1)
        if not c.any(): continue
        m = c.copy(); m[c] = inpoly(P, X[c], Z[c])
        if lo is not None:   # a ramp: its solid is under the slope
            lx, lz = lo; hx, hz = hi; dx, dz = hx - lx, hz - lz; L2 = dx * dx + dz * dz
            top = p['ly'] + np.clip(((X - lx) * dx + (Z - lz) * dz) / L2, 0, 1) * (p['hy'] - p['ly']); h = m & (Y < top) & (Y > top - 1.0)
        else: h = m & (Y > y0) & (Y < y1)
        if h.any(): who.add(tag)
    return not who, who
for fn in sys.argv[1:]:
    D, pcs = load(fn)
    plat = [q for q in pcs if q[3] == 'terminus' and q[0][:, 1].mean() < 0]
    if not plat: print(fn, 'no terminus platform'); continue
    P = plat[0][0]; ytop = plat[0][2]
    al = P[:, 0] * S65 + P[:, 1] * C65; of = -P[:, 0] * C65 + P[:, 1] * S65
    eyes = [np.array([*AO(a, o)[:1], ytop + 1.45, AO(a, o)[1]]) for a in np.arange(al.min() + 0.75, al.max() - 0.5, 1.5) for o in np.arange(of.min() + 0.75, of.max() - 0.5, 1.5)]
    eyes = [np.array([e[0], e[1], e[2]]) for e in eyes]
    prow = [np.array([x, 1.0, z]) for x in np.linspace(-23.5, -19.5, 4) for z in np.linspace(-28, -18, 6)]
    arm = [np.array([*AO(a, o)[:1], 1.0, AO(a, o)[1]]) for a in np.arange(-36, -23, 3) for o in (-2, 2, 6)]
    arm = [np.array([t[0], t[1], t[2]]) for t in arm]
    for name, tg in (('Prow Place', prow), ('down the arm', arm)):
        n = ok = 0; blk = {}
        for e in eyes:
            for t in tg:
                c, who = clear(pcs, e, t); n += 1; ok += c
                for w in who: blk[w] = blk.get(w, 0) + 1
        top = ', '.join(f'{k} {v}' for k, v in sorted(blk.items(), key=lambda kv: -kv[1])[:5])
        print(f'era {D.get("era")}: platform (top {ytop:.2f}, {len(eyes)} eyes) -> {name}: {ok}/{n} lines clear = {100 * ok / n:.0f} %   blocked most by: {top}')
