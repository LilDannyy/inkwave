# measures of the paper plan: areas, drownable share, open lava, routes, cover, exits
import math, sys, json
import numpy as np
from scipy import ndimage
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
import raster, plan
from raster import XX, ZZ, RES, NX, NZ, X0, Z0
from geo import pip, rotpoly

A_CELL = RES * RES


def states(mode='turf'):
    return {lv: raster.build(lv, mode=mode) for lv in ('low', 'high')}


def floor_mask(S):
    """walkable floor: finite top, not under a roof, not lava now; riders count"""
    return np.isfinite(S['top']) & ~S['roof'] & ~S['lava'] & ~S['rail']


def areas(ST):
    out = {}
    lo, hi = ST['low'], ST['high']
    f_lo, f_hi = floor_mask(lo), floor_mask(hi)
    stat = np.isfinite(lo['top']) & ~lo['roof'] & ~lo['rail'] & ~lo['rid']
    drown = stat & lo['reg'] & (lo['top'] < plan.HIGH + 0.15) & (lo['top'] > plan.LOW + 0.15)
    out['floor_low'] = f_lo.sum() * A_CELL
    out['floor_high'] = f_hi.sum() * A_CELL
    out['drown'] = drown.sum() * A_CELL
    out['drown_pct'] = 100 * out['drown'] / (stat.sum() * A_CELL)
    out['region'] = lo['reg'].sum() * A_CELL
    out['open_lava_low'] = lo['lava'].sum() * A_CELL
    out['open_lava_high'] = hi['lava'].sum() * A_CELL
    ys = np.where(f_lo)
    xs_, zs_ = XX[f_lo], ZZ[f_lo]
    out['extent'] = [float(xs_.min()), float(xs_.max()), float(zs_.min()), float(zs_.max())]
    # drownable per half
    out['drown_alpha'] = (drown & (ZZ < 0)).sum() * A_CELL
    return out, drown


def graph(S, hop=1.25, drop=3.4, kid=False):
    """8-neighbour grid graph on floor cells. walk |dy| ≤ 0.5 (any dir); hop 0.5 < dy ≤ hop (orthogonal); drop."""
    F = floor_mask(S)
    top = np.where(F, S['top'], np.nan)
    idx = -np.ones(F.shape, int)
    idx[F] = np.arange(F.sum())
    rows, cols, w = [], [], []
    H, W = F.shape
    for dz, dx in [(0, 1), (1, 0), (1, 1), (1, -1), (0, -1), (-1, 0), (-1, -1), (-1, 1)]:
        a = F[max(0, -dz):H - max(0, dz), max(0, -dx):W - max(0, dx)]
        b = F[max(0, dz):H - max(0, -dz) or None, max(0, dx):W - max(0, -dx) or None]
        ta = top[max(0, -dz):H - max(0, dz), max(0, -dx):W - max(0, dx)]
        tb = top[max(0, dz):H - max(0, -dz) or None, max(0, dx):W - max(0, -dx) or None]
        ia = idx[max(0, -dz):H - max(0, dz), max(0, -dx):W - max(0, dx)]
        ib = idx[max(0, dz):H - max(0, -dz) or None, max(0, dx):W - max(0, -dx) or None]
        dy = tb - ta
        diag = dz != 0 and dx != 0
        flat = RES * (math.sqrt(2) if diag else 1)
        ok = a & b & (np.abs(dy) <= 0.5)
        if not diag:
            ok |= a & b & (dy > 0.5) & (dy <= hop)
            ok |= a & b & (dy < -0.5) & (dy >= -drop)
        cost = np.where(np.abs(dy) <= 0.5, np.sqrt(flat ** 2 + dy ** 2), flat + np.abs(dy))
        rows.append(ia[ok]); cols.append(ib[ok]); w.append(cost[ok])
    rows = np.concatenate(rows); cols = np.concatenate(cols); w = np.concatenate(w)
    G = csr_matrix((w, (rows, cols)), shape=(F.sum(), F.sum()))
    return G, idx, F


def cell(x, z):
    return int((z - Z0) / RES), int((x - X0) / RES)


def nearest_node(idx, x, z):
    j, i = cell(x, z)
    best = None
    for r in range(0, 12):
        for dj in range(-r, r + 1):
            for di in range(-r, r + 1):
                jj, ii = j + dj, i + di
                if 0 <= jj < idx.shape[0] and 0 <= ii < idx.shape[1] and idx[jj, ii] >= 0:
                    d = dj * dj + di * di
                    if best is None or d < best[0]:
                        best = (d, idx[jj, ii])
        if best:
            return best[1]
    return None


def dist_field(S, src_pts, **kw):
    G, idx, F = graph(S, **kw)
    srcs = [nearest_node(idx, x, z) for x, z in src_pts]
    D = dijkstra(G, directed=True, indices=srcs, min_only=True)
    out = np.full(F.shape, np.inf)
    out[F] = D
    return out, G, idx, F


def path_len(S, a, b, **kw):
    D, G, idx, F = dist_field(S, [a], **kw)
    j, i = cell(*b)
    nb = nearest_node(idx, *b)
    jj, ii = np.argwhere(idx == nb)[0]
    return D[jj, ii]


def cover(S, rmax=16):
    """cover-map.js: per 1 m floor cell, the distance to the nearest solid ≥ floor + 0.9 (no rails, no riders)"""
    F = np.isfinite(S['top']) & ~S['roof'] & ~S['rail'] & ~S['rid'] & ~S['lava']
    top = np.where(np.isfinite(S['top']) & ~S['rid'], S['top'], -np.inf)
    solid_h = np.where(S['roof'], 99.0, top)
    res = {}
    dist = np.full(F.shape, np.inf)
    levels = np.unique(np.round(top[F] * 10) / 10)
    for y in levels:
        m = F & (np.abs(top - y) < 0.05)
        if not m.any():
            continue
        solid = solid_h >= y + 0.9
        dt = ndimage.distance_transform_edt(~solid) * RES
        dist[m] = dt[m]
    # sample on a 1 m lattice like cover-map.js
    step = int(1 / RES)
    sub = dist[step // 2::step, step // 2::step]
    fm = F[step // 2::step, step // 2::step]
    vals = sub[fm]
    return dict(within5=float(100 * (vals <= 5).mean()), maxopen=float(vals.max()), n=int(fm.sum())), dist


if __name__ == '__main__':
    ST = states()
    a, drown = areas(ST)
    print(json.dumps({k: (round(v, 1) if isinstance(v, float) else v) for k, v in a.items()}, indent=1))
