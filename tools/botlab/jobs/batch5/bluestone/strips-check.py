#!/usr/bin/env python3
# Bluestone blockout: DESIGN.md §6.1 #2's strip test (fix round 1, review issue 5).
#   python3 strips-check.py <dump.json> [limit 25]      (dump-layout.mjs with ERA=1|2|3, MODE=turf)
# Every straight 2 m-wide strip of floor along four directions (N–S, E–W, along Flathead Street 65°, across it 155°):
# its length while all of it is floor of one tier (within 0.15 m of where it starts) with no free-standing object of
# 0.9 m or more in it (cover: a solid piece under 40 m², 0.9 m or taller, not a tier, kerb or base). Walls, buildings,
# railings, edges and tier steps end a strip. Prints the strips longer than the limit (deduplicated by place), longest
# first, and RESULT <longest> <count over the limit>.
import json, sys, numpy as np
D = json.load(open(sys.argv[1])); LIM = float(sys.argv[2]) if len(sys.argv) > 2 else 25.0
RES = 0.1; X0, X1, Z0, Z1 = -64, 64, -86, 86
nx, nz = int((X1 - X0) / RES), int((Z1 - Z0) / RES)
xs = X0 + (np.arange(nx) + 0.5) * RES; zs = Z0 + (np.arange(nz) + 0.5) * RES
GX, GZ = np.meshgrid(xs, zs)
floor = np.full(GX.shape, -9.0); obj = np.zeros(GX.shape, bool); wall = np.zeros(GX.shape, bool)
TIERS = ('street', 'terrace', 'kerb', 'terrace-kerb', 'circus', 'carriageway', 'alley', 'alley-kerb')
def mask(poly):
    P = np.array(poly); x0, z0 = P.min(0); x1, z1 = P.max(0)
    i0, i1 = max(0, int((x0 - X0) / RES) - 1), min(nx, int((x1 - X0) / RES) + 2); j0, j1 = max(0, int((z0 - Z0) / RES) - 1), min(nz, int((z1 - Z0) / RES) + 2)
    m = np.zeros(GX.shape, bool); gx, gz = GX[j0:j1, i0:i1], GZ[j0:j1, i0:i1]; S = []
    for i in range(len(P)):
        ax, az = P[i]; bx, bz = P[(i + 1) % len(P)]; S.append((bx - ax) * (gz - az) - (bz - az) * (gx - ax))
    S = np.stack(S); m[j0:j1, i0:i1] = np.all(S >= -1e-9, 0) | np.all(S <= 1e-9, 0); return m
for p in D['pieces']:
    if not p['solid'] or p['hidden']: continue
    m = mask(p['poly'])
    if not m.any(): continue
    P = np.array(p['poly']); area = 0.5 * abs(np.dot(P[:, 0], np.roll(P[:, 1], 1)) - np.dot(P[:, 1], np.roll(P[:, 0], 1)))
    h = p['y1'] - p['y0']; base = 'base' in p['tag']
    if p['rail']: wall |= m; continue
    if p['roof']:
        if p['y0'] > 3.1: continue        # overhead (verandas, roofs, the dome): not in the way
        (obj if area < 40 else wall)[m] = True; continue
    if p['y1'] > 20: continue
    if p['k'] != 'r' and area < 40 and h >= 0.9 and not base and p['tag'] not in TIERS: obj |= m; continue
    if p['k'] == 'r':
        lx, lz = p['lo']; hx, hz = p['hi']; dx, dz = hx - lx, hz - lz; L2 = dx * dx + dz * dz
        top = p['ly'] + np.clip(((GX - lx) * dx + (GZ - lz) * dz) / L2, 0, 1) * (p['hy'] - p['ly'])
        floor = np.where(m, np.maximum(floor, top), floor)
    else:
        floor = np.where(m, np.maximum(floor, p['y1']), floor)
walk = (floor > -1) & ~wall & ~obj
F = np.where(walk, floor, np.nan)
def sample(A, X, Z, fill):
    i = np.floor((X - X0) / RES).astype(int); j = np.floor((Z - Z0) / RES).astype(int)
    ok = (i >= 0) & (i < nx) & (j >= 0) & (j < nz); out = np.full(X.shape, fill, dtype=float)
    out[ok] = A[j[ok], i[ok]]; return out
rows = []
STEP = 0.1   # along a strip; strips are laid every 0.25 m across, each 2 m wide (five lines 0.5 m apart)
for ang in (0, 90, 65, 155):
    a = np.radians(ang); u = np.array([np.sin(a), np.cos(a)]); v = np.array([np.cos(a), -np.sin(a)])   # along, across
    L = 230; S = np.arange(-L / 2, L / 2, STEP); Tn = np.arange(-L / 2, L / 2, 0.25)
    for t in Tn:
        Lm = np.stack([sample(F, u[0] * S + v[0] * (t + d), u[1] * S + v[1] * (t + d), np.nan) for d in (-1, -0.5, 0, 0.5, 1)])
        ok = ~np.isnan(Lm).any(0)
        if ok.sum() * STEP <= LIM: continue
        Lz = np.where(ok, Lm, 0.0)
        ok &= (Lz.max(0) - Lz.min(0)) < 0.15                                  # one tier across the strip
        cont = np.ones(len(S), bool); cont[1:] = np.all(np.abs(Lz[:, 1:] - Lz[:, :-1]) < 0.15, 0)   # no step along it
        # runs of ok samples split where cont fails: walk the starts of ok stretches and the cont breaks
        starts = np.flatnonzero(ok & (np.concatenate([[True], ~ok[:-1]]) | ~cont))
        k_done = -1
        for k0 in starts:
            if k0 < k_done: continue
            k1 = k0 + 1
            while k1 < len(S) and ok[k1] and cont[k1] and np.all(np.abs(Lz[:, k1] - Lz[2, k0]) < 0.15): k1 += 1   # one tier along it
            run = (k1 - k0) * STEP
            if k1 < len(S) and ok[k1] and cont[k1]: starts = np.append(starts, k1)   # (a tier change: a new run starts here)
            k_done = k1
            if run > LIM:
                p0 = u * S[k0] + v * t; p1 = u * S[k1 - 1] + v * t; c = (p0 + p1) / 2
                rows.append((run, ang, round(float(Lm[2, k0]), 2), [round(float(p0[0]), 1), round(float(p0[1]), 1)], [round(float(p1[0]), 1), round(float(p1[1]), 1)], (round(c[0] / 6), round(c[1] / 6), ang)))
rows.sort(key=lambda r: -r[0]); seen = set(); out = []
for r in rows:
    if r[5] in seen: continue
    seen.add(r[5]); out.append(r)
for r in out[:20]: print(f'   {r[0]:5.1f} m  dir {r[1]:3d}°  tier {r[2]:5.2f}  from {r[3]} to {r[4]}')
print('RESULT longest', out[0][0] if out else 0.0, 'm;', len(out), f'strips over {LIM:g} m')
