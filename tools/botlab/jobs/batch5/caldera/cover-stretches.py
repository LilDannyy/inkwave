# Open stretches in a cover map (cover-map.js's PASS line in a page.cjs log): every connected patch of floor whose
# nearest cover (>= 0.9 m) is more than LIM m away, i.e. every place an open circle wider than 2 x LIM m fits.
#   python3 cover-stretches.py page.log [LIM=5.0] [name]
# Prints one summary line and one line per patch: cells, the largest radius in it and where, its x / z extent.
import sys, json, base64, re
log = open(sys.argv[1]).read()
LIM = float(sys.argv[2]) if len(sys.argv) > 2 else 5.0
name = sys.argv[3] if len(sys.argv) > 3 else ''
info = json.loads(re.search(r'PASS cover map  (\{.*\})', log).group(1))
g = info['grid']; x0, z0, nx, nz = g['x0'], g['z0'], g['nx'], g['nz']; b = base64.b64decode(g['b64'])
open_ = {}
for j in range(nz):
    for i in range(nx):
        v = b[j * nx + i]
        if v != 255 and v / 10 > LIM: open_[(i, j)] = v / 10
seen, comps = set(), []
for k in open_:
    if k in seen: continue
    st, comp = [k], []
    seen.add(k)
    while st:
        c = st.pop(); comp.append(c)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                q = (c[0] + di, c[1] + dj)
                if q in open_ and q not in seen: seen.add(q); st.append(q)
    comps.append(comp)
comps.sort(key=lambda c: -max(open_[q] for q in c))
print(f"STRETCHES {name or info['map']}: {info['within5m_pct']}% of {info['floorCells']} cells within 5 m; largest open r {info['largestOpenRadius_m']} m at {info['at']}; {len(comps)} patch(es) farther than {LIM} m from cover")
for c in comps:
    best = max(c, key=lambda q: open_[q])
    xs = [x0 + q[0] + 0.5 for q in c]; zs = [z0 + q[1] + 0.5 for q in c]
    print(f"  patch {len(c):4d} cells  r max {open_[best]:.1f} m at ({x0 + best[0] + 0.5:.1f}, {z0 + best[1] + 0.5:.1f})  x {min(xs):.1f}..{max(xs):.1f}  z {min(zs):.1f}..{max(zs):.1f}")
