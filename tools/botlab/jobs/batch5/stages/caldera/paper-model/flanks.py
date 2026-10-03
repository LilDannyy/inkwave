import numpy as np, math, json
from scipy.sparse.csgraph import dijkstra
import analyse as A, plan, raster
from raster import XX, ZZ
PAD = (0.0, -64.5)
def dist(lv, target, bans=(), skip=(), mode='turf'):
    S = raster.build(lv, skip=skip, mode=mode)
    G, idx, F = A.graph(S, hop=1.25)
    fx, fz = XX[F], ZZ[F]
    G2 = G.tolil()
    for (x0, x1, z0, z1) in bans:
        for n in np.where((fx > x0) & (fx < x1) & (fz > z0) & (fz < z1))[0]:
            G2.rows[n] = []; G2.data[n] = []
    G2 = G2.tocsr()
    a = A.nearest_node(idx, *PAD); b = A.nearest_node(idx, *target)
    return round(float(dijkstra(G2, indices=[a])[0][b]), 1)
ISL = (-13.0, 13.0, -24.0, 12.5)   # the island, both causeways' inner parts and the Casting Floors (not the faces)
res = {}
for lv in ('low', 'high'):
    r = {}
    # centre
    r['centre (causeway)'] = dist(lv, (0, 0))
    # right flank: own rim via the Slump → West Bridge → island W face
    r['right: West Bridge foot on the W face'] = dist(lv, (-13.2, 5.0), bans=[ISL, (13, 30, -40, 0)])
    r['right: north Slump head'] = dist(lv, (-23.0, 0.0), bans=[ISL, (13, 30, -40, 0)])
    # left flank: Spillway Bridge → Bravo's horn tip → East Bridge → E face
    r['left: East Bridge foot on the E face'] = dist(lv, (13.2, -5.0), bans=[ISL, (-30, -13, -40, 12)], skip=())
    # left low (LOW only): Spillway floor → Casting Floor → island SE shoulder; no bridge, no causeway
    r['left low: island SE shoulder via the Spillway floor'] = dist(lv, (9.0, -9.6), bans=[(-4.5, 4.5, -23.5, -11.0), (-30, -13, -40, 12), (13, 40, -20, 10)], skip=('Spillway Bridge',))
    # Casting Floor approach (centre swap): Lakefront → CF → SE shoulder, causeway banned
    r['Casting Floor: SE shoulder, causeway banned'] = dist(lv, (9.0, -9.6), bans=[(-4.5, 4.5, -23.5, -11.0)])
    res[lv] = {k: (v, round(v / 11.8, 2)) for k, v in r.items()}
print(json.dumps(res, indent=1))
