#!/usr/bin/env python3
# Bluestone round C fix 2 (scratch): python3 rcf2-regsum.py <run dir>... — ink-regions logs (regions<era>-<k>.log) → per era, per region, every run and the mean
import sys, glob, json, re, statistics as st
# python3 regsum.py dir... : ink-regions logs (regions<era>-<k>.log) → per era, per region, the runs and the mean
R = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(d + '/regions*.log')):
        m = re.search(r'regions(\d)-(\d+)\.log$', f); t = open(f).read()
        j = re.search(r'PASS ink by region[^{]*(\{.*\})', t)
        if not m or not j: print('no result', f); continue
        o = json.loads(j.group(1)); e = m.group(1)
        R.setdefault(e, []).append((d.split('/')[-1] + '/' + m.group(2), o))
for e, runs in sorted(R.items()):
    print(f'era {e}: {len(runs)} runs; total inked ' + ' '.join(f"{100*o['inked']:.1f}" for _, o in runs))
    keys = sorted({k for _, o in runs for k in o['regions']}, key=lambda k: -runs[0][1]['regions'].get(k, {'m2': 0})['m2'])
    for k in keys:
        v = [100 * o['regions'][k]['inked'] for _, o in runs if k in o['regions']]
        print(f"   {k:10s} m2 {runs[0][1]['regions'].get(k,{}).get('m2','?'):>5}  mean {st.mean(v):5.1f}  min {min(v):3.0f}  runs " + ' '.join(f'{x:.0f}' for x in v))
