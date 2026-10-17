# Cover map analysis (scratch): python3 cover-stretches.py page.log [label]
# From cover-map.js's grid (1 m cells, distance to the nearest ≥ 0.9 m cover): the share within 5 m (the tool's own
# number), and every OPEN STRETCH over 10 m — a connected patch of floor cells farther than 5 m from any cover (so an
# open circle more than 10 m across) — with its size, centre, the farthest cell and how far it is from cover.
import sys, json, base64, re
log = open(sys.argv[1]).read(); label = sys.argv[2] if len(sys.argv) > 2 else ''
info = json.loads(re.search(r'PASS cover map  (\{.*\})', log).group(1))
g = info['grid']; x0, z0, nx, nz = g['x0'], g['z0'], g['nx'], g['nz']; b = base64.b64decode(g['b64'])
D = lambda i, j: b[j * nx + i] / 10 if b[j * nx + i] != 255 else None
seen = set(); patches = []
for j in range(nz):
    for i in range(nx):
        d = D(i, j)
        if d is None or d <= 5 or (i, j) in seen: continue
        st = [(i, j)]; seen.add((i, j)); cells = []
        while st:
            a, c = st.pop(); cells.append((a, c))
            for da, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p, q = a + da, c + dc
                if 0 <= p < nx and 0 <= q < nz and (p, q) not in seen:
                    v = D(p, q)
                    if v is not None and v > 5: seen.add((p, q)); st.append((p, q))
        far = max(cells, key=lambda t: D(*t)); cx = sum(c[0] for c in cells) / len(cells); cz = sum(c[1] for c in cells) / len(cells)
        patches.append({'cells': len(cells), 'centre': [round(x0 + cx + 0.5, 1), round(z0 + cz + 0.5, 1)], 'farthest': [x0 + far[0] + 0.5, z0 + far[1] + 0.5], 'r': D(*far)})
patches.sort(key=lambda p: -p['r'])
print(f"{label or info['map']}: {info['within5m_pct']}% of {info['floorCells']} floor cells within 5 m of cover; largest open circle r {info['largestOpenRadius_m']} m at {info['at']}")
print(f"  open stretches over 10 m across (cells > 5 m from cover): {len(patches)}")
for p in patches: print(f"   r {p['r']:4.1f} m  {p['cells']:3d} m²  centre {p['centre']}  farthest {p['farthest']}")
