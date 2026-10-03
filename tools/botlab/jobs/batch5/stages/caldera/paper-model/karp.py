import numpy as np, math, json
from scipy.sparse.csgraph import dijkstra
import analyse as A, plan, raster
from raster import XX, ZZ, RES
GATE = (9.0, -52.0)       # Bravo's attack on Alpha's half (data: negate)
WEIR = (0.0, -24.5)
POND = (0.0, 0.0)
PAD = (0.0, -64.5)


def node_xy(idx, n):
    j, i = np.argwhere(idx == n)[0]
    return XX[j, i], ZZ[j, i]


def run(lv, mode='bazookarp'):
    S = raster.build(lv, mode=mode)
    G, idx, F = A.graph(S, hop=1.25)
    # carrier graph: drop nodes inside either spawn barrier (r 4.2+0.6 round the pads, y > pad - 1)
    bar = (np.hypot(XX - PAD[0], ZZ - PAD[1]) < 4.8) | (np.hypot(XX + PAD[0], ZZ + PAD[1]) < 4.8)
    gate = A.nearest_node(idx, *GATE); weir = A.nearest_node(idx, *WEIR); pond = A.nearest_node(idx, *POND)
    Gt = G.T.tocsr()
    DG = dijkstra(Gt, directed=True, indices=[gate])[0]          # metres from node TO the gate
    L = DG[pond]; Dw = DG[weir]
    out = dict(L=round(float(L), 1), weir_D=round(float(Dw), 1), weir_count=math.ceil(100 * Dw / L),
               progress_pct=round(100 * (L - Dw) / L, 1), weir_to_gate=round(float(Dw), 1), weir_to_gate_pct=round(100 * Dw / L, 1))
    # leg 1 routes: Pond → weir
    def two_routes(a, b):
        D, pred = dijkstra(G, directed=True, indices=[a], return_predecessors=True)
        D = D[0]; pred = pred[0]
        path = [b]
        while path[-1] != a and pred[path[-1]] >= 0:
            path.append(pred[path[-1]])
        r1 = D[b]
        pts = np.array([node_xy(idx, n) for n in path[::3]])
        ax, az = node_xy(idx, a); bx, bz = node_xy(idx, b)
        # forbid nodes within 2.5 m of route 1 except within 6 m of either end
        fx, fz = XX[F], ZZ[F]
        dmin = np.full(fx.shape, np.inf)
        for (px, pz) in pts:
            dmin = np.minimum(dmin, np.hypot(fx - px, fz - pz))
        near_end = (np.hypot(fx - ax, fz - az) < 6) | (np.hypot(fx - bx, fz - bz) < 6)
        ban = (dmin < 2.5) & ~near_end
        keep = ~ban
        G2 = G.tocsr().copy()
        banned = np.where(ban)[0]
        G2 = G2.tolil(); 
        for n in banned:
            G2.rows[n] = []; G2.data[n] = []
        G2 = G2.tocsr()
        Gc = G2.tocsc().tolil()
        G2 = G2.tocsr()
        D2 = dijkstra(G2, directed=True, indices=[a])[0]
        return float(r1), float(D2[b])
    r1, r2 = two_routes(pond, weir)
    out['leg1'] = (round(r1, 1), round(r2, 1), round(r2 / r1, 2))
    r1, r2 = two_routes(weir, gate)
    out['leg2'] = (round(r1, 1), round(r2, 1), round(r2 / r1, 2))
    # gate checks
    out['pad_to_gate'] = round(math.hypot(GATE[0] - PAD[0], GATE[1] - PAD[1]), 1)
    out['gate_angle_deg'] = round(math.degrees(math.atan2(abs(GATE[0] - PAD[0]), abs(GATE[1] - PAD[1]))), 1)
    return out


if __name__ == '__main__':
    for lv in ('low', 'high'):
        print(lv, json.dumps(run(lv)))
    print('turf-mode high (no gantry):', json.dumps(run('high', mode='turf')))
