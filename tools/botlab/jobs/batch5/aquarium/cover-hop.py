# Cover share with the hop-up tops left out (fix round 1, review issue 6), any stage: reads cover-plus.js's per-cell
# output (page.cjs log) and reports the share of floor within 5 m of cover, the open stretches (cells > 5 m from cover)
# and the flat-and-bare discs, over (a) every floor cell, as cover-map.js counts them, and (b) the floor without the
# hop-up tops. A hop-up top is a small raised walkable top: a 4-connected patch of cells at one height (±0.05) under
# 12 m², standing ≥ 0.45 m above every floor cell round it (crates, benches, planters, hatches, skylights, Lookouts):
# cover-map.js counts a player standing on one as floor, but it is the cover itself, so its own top is never near
# "cover over it". Also lists the hop tops found, by tag, so the reader sees what was left out.
#   python3 cover-hop.py page.log [label]
import sys, json, re, collections
txt = open(sys.argv[1]).read(); label = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1]
C = json.loads(re.search(r'PASS cells\s+(\{.*\})\s*$', txt, re.M).group(1))['cells']
cell = {(c[0], c[1]): c for c in C}
# patches of equal height
seen, patches = set(), []
for k in cell:
    if k in seen: continue
    y = cell[k][2]; st = [k]; seen.add(k); g = []
    while st:
        p = st.pop(); g.append(p)
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (p[0] + d[0], p[1] + d[1])
            if q in cell and q not in seen and abs(cell[q][2] - y) <= 0.05: seen.add(q); st.append(q)
    patches.append(g)
hop = set(); hopTags = collections.Counter()
for g in patches:
    if len(g) >= 12: continue
    y = cell[g[0]][2]; S = set(g); rim = []
    for p in g:
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            q = (p[0] + d[0], p[1] + d[1])
            if q not in S and q in cell: rim.append(cell[q][2])
    if rim and all(y - r >= 0.45 for r in rim):
        hop |= S; hopTags[cell[g[0]][3]] += len(g)
def report(name, cells):
    n = len(cells); w5 = sum(1 for c in cells if c[4] <= 5)
    far = [c for c in cells if c[4] > 5]
    # open stretches: 8-connected cells > 5 m from cover
    S = {(c[0], c[1]): c for c in far}; done = set(); groups = []
    for k in S:
        if k in done: continue
        st = [k]; done.add(k); g = []
        while st:
            p = st.pop(); g.append(S[p])
            for dx in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    q = (p[0] + dx, p[1] + dz)
                    if q in S and q not in done: done.add(q); st.append(q)
        groups.append(g)
    groups.sort(key=lambda g: -max(c[4] for c in g))
    bare10 = sum(1 for c in cells if c[5] >= 5); bare8 = sum(1 for c in cells if c[5] >= 4)
    print(f'  {name}: {n} cells, {100 * w5 / n:.1f}% within 5 m of cover; {len(far)} cells > 5 m in {len(groups)} patches; flat-and-bare 10 m disc {bare10} cells, 8 m disc {bare8} cells')
    for g in groups[:8]:
        w = max(g, key=lambda c: c[4]); tags = collections.Counter(c[3] for c in g).most_common(2)
        print(f'     {len(g):3d} cells, worst {w[4]} m at ({w[0]}, {w[1]}) y {w[2]} {tags}')
print(f'== {label}')
report('all floor (cover-map.js)', C)
report('without hop-up tops', [c for c in C if (c[0], c[1]) not in hop])
print(f'  hop-up tops left out: {len(hop)} cells: ' + ', '.join(f'{t} {n}' for t, n in hopTags.most_common()))
