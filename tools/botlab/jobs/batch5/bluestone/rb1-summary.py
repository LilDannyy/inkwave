#!/usr/bin/env python3
# Bluestone round B fix 1 (scratch): python3 rb1-summary.py <run dir> — the era-3 Turf War ink (turf3r*.log: both teams'
# turf, mean and sd), ink by region per era (regions<era>-<k>.log: each region's inked share per run and the mean), and
# the garden / Halo fine map and the coarse map averaged over the era-3 region runs.
import sys, re, json, glob, statistics as st
D = sys.argv[1]
v = []
for f in sorted(glob.glob(f'{D}/turf3r*.log'), key=lambda p: int(re.search(r'r(\d+)\.log$', p).group(1))):
    r = re.search(r'turf ([\d.]+)% vs ([\d.]+)%', open(f).read())
    if r: v.append(float(r.group(1)) + float(r.group(2)))
if v: print(f'era-3 Turf War, both teams: n={len(v)} mean {st.mean(v):.1f} % sd {st.pstdev(v):.1f}  runs ' + ', '.join(f'{x:.1f}' for x in v))
for era in '123':
    fs = sorted(glob.glob(f'{D}/regions{era}-*.log'))
    if not fs: continue
    regs, tot, G, M = {}, [], [], []
    for f in fs:
        t = open(f).read(); m = re.search(r'PASS ink by region[^{]*(\{.*?\})\s*$', t, re.M)
        if not m: continue
        d = json.loads(m.group(1)); tot.append((d['total_m2'], d['inked']))
        for k, o in d['regions'].items(): regs.setdefault(k, []).append((o['m2'], o['inked']))
        g = re.search(r'PASS garden / Halo at 1.5 m[^\[]*(\[.*?\])\s*$', t, re.M); c = re.search(r'PASS map \(x[^\[]*(\[.*?\])\s*$', t, re.M)
        if g: G.append(json.loads(g.group(1)))
        if c: M.append(json.loads(c.group(1)))
    if not tot: continue
    print(f'\nink-regions era {era}: n={len(tot)} turf {tot[0][0]} m2, total inked ' + ', '.join(f'{x * 100:.1f}' for _, x in tot) + f'  mean {100 * st.mean(x for _, x in tot):.1f} %')
    for k, l in sorted(regs.items(), key=lambda kv: -kv[1][0][0]):
        print(f'  {k:12s} {l[0][0]:5d} m2  ' + ' '.join(f'{x * 100:3.0f}' for _, x in l) + f'   mean {100 * st.mean(x for _, x in l):.0f} %')
    if era != '3': continue
    def avg(maps, lab):
        out = []
        for rows in zip(*maps):
            line = ''
            for cs in zip(*[r[lab + 1:] for r in rows]):
                q = [int(c) for c in cs if c != '.']; line += '  .' if not q else f'{sum(q) / len(q):3.0f}'
            out.append(rows[0][:lab] + ' ' + line)
        return out
    if G: print('  garden / Halo at 1.5 m (x −39 … −9 by 1.5 m; mean inked tenths):'); print('\n'.join('   ' + r for r in avg(G, 6)))
    if M: print('  the coarse map (x −64 … 32 by 4 m, z 0 … −88; mean inked tenths, Bravo folded):'); print('\n'.join('   ' + r for r in avg(M, 4)))
