#!/usr/bin/env python3
# Bluestone blockout: the arms' dead ends (fix round 1, review issue 1).   python3 deadend.py <dump.json>
# A 0.5 m raster of the floor a kid can stand on (walkable tops with 1.45 m clear above, not under cover or walls),
# joined to its 4 neighbours when the step between them is ≤ 1.25 m (a hop; drops are joined too). Alpha's arm is the
# band |off| ≤ 15 along Flathead Street beyond along −20 (Bravo's is the mirror). The arm is cut at every 0.5 m of
# along, one cross-section at a time (the band's cells there removed): the part beyond the cut is a DEAD END when it no
# longer reaches the concourse. Prints the largest dead-end floor (m²) and where its cut is, per arm.
import json, sys, numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
D = json.load(open(sys.argv[1])); RES = 0.5; X0, X1, Z0, Z1 = -64, 64, -86, 86
nx, nz = int((X1 - X0) / RES), int((Z1 - Z0) / RES)
xs = X0 + (np.arange(nx) + 0.5) * RES; zs = Z0 + (np.arange(nz) + 0.5) * RES
GX, GZ = np.meshgrid(xs, zs)
S65, C65 = np.sin(np.radians(65)), np.cos(np.radians(65))
def win(poly):   # the raster window of a polygon's bounding box
    P = np.array(poly); x0, z0 = P.min(0); x1, z1 = P.max(0)
    return slice(max(0, int((z0 - Z0) / RES) - 1), min(nz, int((z1 - Z0) / RES) + 2)), slice(max(0, int((x0 - X0) / RES) - 1), min(nx, int((x1 - X0) / RES) + 2))
def mask(poly, w):
    P = np.array(poly); gx, gz = GX[w], GZ[w]; S = []
    for i in range(len(P)):
        ax, az = P[i]; bx, bz = P[(i + 1) % len(P)]; S.append((bx - ax) * (gz - az) - (bz - az) * (gx - ax))
    S = np.stack(S); return np.all(S >= -1e-9, 0) | np.all(S <= 1e-9, 0)
pcs = []
for p in D['pieces']:
    if not p['solid']: continue
    w = win(p['poly']); m = mask(p['poly'], w)
    if not m.any(): continue
    gx, gz = GX[w], GZ[w]
    if p['k'] == 'r':
        lx, lz = p['lo']; hx, hz = p['hi']; dx, dz = hx - lx, hz - lz; L2 = dx * dx + dz * dz
        top = p['ly'] + np.clip(((gx - lx) * dx + (gz - lz) * dz) / L2, 0, 1) * (p['hy'] - p['ly']); bot = top - 1.0
    else: top = np.full(gx.shape, p['y1']); bot = np.full(gx.shape, p['y0'])
    pcs.append(dict(w=w, m=m, top=np.where(m, top, -99.0), bot=np.where(m, bot, 99.0), walk=not p['roof'] and not p['rail'] and not p['hidden'] and p['y1'] < 20))
# every cell's solids as interval lists: the highest walkable top with 1.45 m clear above it
cols = {}
for k, q in enumerate(pcs):
    js, is_ = np.nonzero(q['m'])
    for j, i in zip(js + q['w'][0].start, is_ + q['w'][1].start): cols.setdefault((j, i), []).append(k)
# every standable top in a cell (up to 3 levels: the ring under the Halo, the Halo over it), lowest first
NL = 3
floorL = np.full((NL,) + GX.shape, -9.0)
for (j, i), ks in cols.items():
    iv = [(pcs[k]['bot'][j - pcs[k]['w'][0].start, i - pcs[k]['w'][1].start], pcs[k]['top'][j - pcs[k]['w'][0].start, i - pcs[k]['w'][1].start], pcs[k]['walk']) for k in ks]
    st = sorted({round(float(t), 3) for b, t, wk in iv if wk and all(not (b2 < t + 1.45 and t2 > t + 0.05) for b2, t2, _ in iv)})
    for n, t in enumerate(st[:NL]): floorL[n, j, i] = t
walkL = floorL > -1
walk = walkL.any(0)
idxL = -np.ones(floorL.shape, int); idxL[walkL] = np.arange(walkL.sum()); N = walkL.sum()
def edges(keep):
    r, c = [], []
    for dj, di in ((0, 1), (1, 0)):
        for la in range(NL):
            for lb in range(NL):
                fa, fb = floorL[la, : nz - dj, : nx - di], floorL[lb, dj:, di:]
                a = keep[: nz - dj, : nx - di] & keep[dj:, di:] & (fa > -1) & (fb > -1) & (np.abs(fa - fb) <= 1.25)
                r.append(idxL[la, : nz - dj, : nx - di][a]); c.append(idxL[lb, dj:, di:][a])
    r = np.concatenate(r); c = np.concatenate(c)
    return coo_matrix((np.ones(len(r)), (r, c)), shape=(N, N))
centre = idxL[0, int((0 - Z0) / RES), int((0 - X0) / RES)]
print(f'floor {walkL.sum() * RES * RES:.0f} m2 (standable, every level, this build)')
for name, sgn in (('Alpha', 1), ('Bravo', -1)):
    al = sgn * (GX * S65 + GZ * C65); off = sgn * (-GX * C65 + GZ * S65)
    band = walk & (np.abs(off) <= 15) & (al <= -20)
    worst = (0.0, None)
    for a in np.arange(-20, -64, -0.5):
        cut = band & (al <= a) & (al > a - RES)
        if not cut.any(): continue
        _, lab = connected_components(edges(walk & ~cut), directed=False)
        far = band & (al <= a - RES)
        if not far.any(): continue
        fl = walkL & far[None]
        ok = lab[idxL[fl]] == lab[centre]
        dead = (~ok).sum() * RES * RES
        if dead > worst[0]: worst = (dead, a)
    print(f'{name}: dead-end floor {worst[0]:.0f} m2' + (f' (beyond along {worst[1]:.1f})' if worst[1] is not None else ''))
