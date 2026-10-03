# Gulper Aquarium: read cover-map.js's result line (page.cjs output) and report the share of floor within 5 m of cover,
# overall and outside the excluded areas (the Feeding Deck top, the spawn decks), and every open stretch: a connected
# patch of floor cells more than 5 m from cover (an open circle wider than 10 m), with its centre, size and worst point.
#   python3 cover-stats.py page.log [aquarium|other]
import sys, json, base64, re, math
log = open(sys.argv[1]).read(); stage = sys.argv[2] if len(sys.argv) > 2 else 'aquarium'
info = json.loads(re.search(r'PASS cover map  (\{.*\})', log).group(1))
g = info['grid']; x0, z0, nx, nz = g['x0'], g['z0'], g['nx'], g['nz']; b = base64.b64decode(g['b64'])
C30 = math.cos(math.radians(30))
def blade(x, z):  # Alpha's blade frame; Bravo's by the turn
    if z > 0: x, z = -x, -z
    dz = z + 32.5; return 0.5 * x - C30 * dz, C30 * x + 0.5 * dz
def excluded(x, z):
    if stage != 'aquarium': return False
    if math.hypot(x, z) <= 7.6: return True                 # the Feeding Deck's top (the centre zone)
    s, w = blade(x, z)
    return s >= 31.0 and abs(w) <= 16.5                      # the spawn deck, its stairs and landings
cells = {}
for j in range(nz):
    for i in range(nx):
        v = b[j * nx + i]
        if v == 255: continue
        cells[(i, j)] = v / 10
n = len(cells); w5 = sum(1 for d in cells.values() if d <= 5)
inc = {k: d for k, d in cells.items() if not excluded(x0 + k[0] + 0.5, z0 + k[1] + 0.5)}
w5i = sum(1 for d in inc.values() if d <= 5)
print(f"floor cells {n}: {100*w5/n:.1f}% within 5 m of cover; outside the excluded areas {len(inc)}: {100*w5i/len(inc):.1f}%")
dist = sorted(inc.values()); print(f"median distance to cover {dist[len(dist)//2]:.1f} m; within 3 m {100*sum(1 for d in dist if d<=3)/len(dist):.1f}%")
# open stretches: 8-connected cells with d > 5
seen = set(); out = []
for k, d in inc.items():
    if d <= 5 or k in seen: continue
    st = [k]; seen.add(k); comp = []
    while st:
        c = st.pop(); comp.append(c)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                q = (c[0] + di, c[1] + dj)
                if q in inc and q not in seen and inc[q] > 5: seen.add(q); st.append(q)
    worst = max(comp, key=lambda c: inc[c])
    xs = [x0 + c[0] + 0.5 for c in comp]; zs = [z0 + c[1] + 0.5 for c in comp]
    out.append((inc[worst], len(comp), (round(sum(xs)/len(xs), 1), round(sum(zs)/len(zs), 1)), (x0 + worst[0] + 0.5, z0 + worst[1] + 0.5), (min(xs), max(xs), min(zs), max(zs))))
out.sort(reverse=True)
print(f"open stretches (cells > 5 m from cover, outside the excluded areas): {len(out)}")
for r, a, c, wpt, bb in out: print(f"  open circle r {r:.1f} m (diameter {2*r:.1f}) at {wpt}; {a} m² of floor > 5 m from cover round {c}; x {bb[0]}..{bb[1]} z {bb[2]}..{bb[3]}")
if stage == 'aquarium':
    for name, f in [('deck top', lambda x, z: math.hypot(x, z) <= 7.6), ('spawn decks', lambda x, z: not math.hypot(x, z) <= 7.6 and excluded(x, z))]:
        sel = [d for k, d in cells.items() if f(x0 + k[0] + 0.5, z0 + k[1] + 0.5)]
        if sel: print(f"  {name}: {len(sel)} cells, {100*sum(1 for d in sel if d<=5)/len(sel):.1f}% within 5 m, worst {max(sel):.1f} m")
