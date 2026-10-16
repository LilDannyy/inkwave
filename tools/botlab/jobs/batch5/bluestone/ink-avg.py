#!/usr/bin/env python3
# Bluestone (scratch): python3 ink-avg.py <dir>... — average both teams' Turf War ink per cell (turf<era><tag>.log,
# turfH<tag>.log) across the given run folders; prints each run and the mean ± sd per cell.
import sys, re, glob, statistics as st
cells = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(d + '/turf*.log')):
        m = re.search(r'turf([123H])(\w+)\.log$', f); t = open(f).read()
        r = re.search(r'turf ([\d.]+)% vs ([\d.]+)%', t)
        if not m or not r: continue
        cells.setdefault(m.group(1), []).append((f.split('/')[-2] + '/' + m.group(2), float(r.group(1)) + float(r.group(2))))
for k in sorted(cells):
    v = [x for _, x in cells[k]]
    print(f"{'Halyard' if k == 'H' else 'era ' + k}: n={len(v)} mean {st.mean(v):.1f} sd {st.pstdev(v):.1f}  runs " + ' '.join(f'{x:.1f}' for _, x in cells[k]))
