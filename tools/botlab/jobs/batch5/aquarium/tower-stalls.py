# Tower Command: where the pushes stop (fix round 1, review issue 4), from tower-match.cjs logs (any stage): per match
# the best push per team and checkpoints cleared, and every control change's track position (tower-match's control log
# "t:owner@s"; s > 0 on Bravo's half = Alpha's push). A push "ends" where the attacking team loses control (the next
# change goes to the other team or neutral) — its progress into the enemy half then (Alpha's s, Bravo's −s) is listed
# per team and binned every 5 m, so a choke shows
# as a pile-up in one bin.  python3 tower-stalls.py tower-*.log [--corner S]
import sys, re, collections
args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] != '--corner']
corner = float(sys.argv[sys.argv.index('--corner') + 1]) if '--corner' in sys.argv else None
ends = collections.defaultdict(list); best = collections.defaultdict(list)
for f in args:
    txt = open(f).read()
    head = re.search(r'^== (\w+) \[tower[^\]]*\]: winner (\S+) \(([^)]*)\) \| counts ([\d.]+) vs ([\d.]+).*?best push A ([\d.]+)m B ([\d.]+)m', txt, re.M)
    cp = re.search(r'checkpoints cleared A (\d+) B (\d+)', txt)
    log = re.search(r'^   control log (.*)$', txt, re.M)
    if not head: print(f'{f}: no summary'); continue
    m = head.group(1)
    ev = [(float(t), o, float(s)) for t, o, s in re.findall(r'([\d.]+):([NAB])@(-?[\d.]+)', log.group(1) if log else '')]
    stops = {'A': [], 'B': []}
    for i, (t, o, s) in enumerate(ev):
        if o in 'AB' and i + 1 < len(ev):   # the attacker's progress when it lost control (A pushes +s, B −s); only pushes into the enemy half
            prog = ev[i + 1][2] if o == 'A' else -ev[i + 1][2]
            if prog > 0: stops[o].append(prog)
    for k in 'AB': ends[(m, k)] += stops[k]
    best[m] += [float(head.group(6)), float(head.group(7))]
    print(f"{m:9s} {f.split('/')[-1]:22s} winner {head.group(2)} ({head.group(3)}) counts {head.group(4)}/{head.group(5)} | best push A {head.group(6)} B {head.group(7)} | cps cleared A {cp.group(1) if cp else '?'} B {cp.group(2) if cp else '?'} | control changes {len(ev)} | pushes ended at A {[round(x) for x in stops['A']]} B {[round(x) for x in stops['B']]}")
for m in sorted({k[0] for k in ends}):
    allv = ends[(m, 'A')] + ends[(m, 'B')]
    bins = collections.Counter(int(v // 5) * 5 for v in allv if v >= 10)
    near = sum(1 for v in allv if corner is not None and abs(v - corner) <= 2)
    print(f"SUMMARY {m}: team-best pushes {sorted(best[m])}; push ends ≥ 10 m by 5 m bin {dict(sorted(bins.items()))}" + (f"; within 2 m of s {corner}: {near} of {len(allv)}" if corner is not None else ''))
