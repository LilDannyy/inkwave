# Zone Control lead changes (fix round 1, review issue 3; DESIGN.md §6.2 asks "≥ 4 lead changes in 3 of 4 runs" and
# match.cjs prints none): rebuilds each match's two counts second by second from what match.cjs already logs — the
# control log (time, owner, objective), the penalties in order and the final counts — with src/game/zones.js's rules
# (the owner counts off its penalty first, then its count, at ZONES.rateCenter 1 / rateHome 0.5 / rateAway 2 per s; a
# team that loses the objective to the other team takes the next logged penalty), checks the rebuild against the final
# counts, and counts the lead changes (the strict leader — the lower count — switching from one team to the other).
#   python3 zones-lead.py match1.log [match2.log …]       (any stage; one or more RESULT_JSON lines per log)
import sys, json, re
RATE = {'center': (1.0, 1.0), 'sideA': (0.5, 2.0), 'sideB': (2.0, 0.5)}   # (Alpha's, Bravo's) rate on each objective
def analyse(r):
    log = [(float(t), o, obj) for t, o, obj in re.findall(r'([\d.]+):([NAB])@(\w+)', r.get('log', ''))]
    pens = list(r.get('penalties', []))
    count, pen, owner, last, obj, t0 = [100.0, 100.0], [0.0, 0.0], -1, -1, 'center', 0.0
    leader, changes, lead_t = None, 0, [0.0, 0.0]
    def lead():
        return None if abs(count[0] - count[1]) < 1e-6 else (0 if count[0] < count[1] else 1)
    def advance(t1):
        nonlocal t0, leader, changes
        while t0 < t1 - 1e-9:
            dt = min(0.05, t1 - t0)
            if owner >= 0:
                d = RATE[obj][owner] * dt
                p = min(pen[owner], d); pen[owner] -= p; d -= p
                count[owner] = max(0.0, count[owner] - d)
            L = lead()
            if L is not None:
                lead_t[L] += dt
                if leader is not None and L != leader: changes += 1
                leader = L
            t0 += dt
    for t, o, ob in log:
        advance(t)
        new = -1 if o == 'N' else 'AB'.index(o)
        if new >= 0 and last == 1 - new and pens:
            q = pens.pop(0); pen[q['team']] += q['p']
        if new >= 0: last = new
        owner, obj = new, ob
    end = float(r.get('simT', 300)) + float(r.get('overtimeT') or 0)
    advance(end)
    rc = [round(c) for c in count]
    return {'final': r.get('counts'), 'rebuilt': rc, 'ok': r.get('counts') is not None and all(abs(a - b) <= 1.5 for a, b in zip(rc, r['counts'])),
            'leadChanges': changes, 'takeovers': r.get('takeovers'), 'captures': r.get('captures'), 'firstCapture': r.get('firstCapture'),
            'neutral': r.get('neutral'), 'held': r.get('held'), 'leadS': [round(x) for x in lead_t], 'winner': 'AB'[r['winner']] if r.get('winner') in (0, 1) else '-'}
rows = []
for f in sys.argv[1:]:
    for line in open(f):
        if line.startswith('RESULT_JSON '):
            r = json.loads(line[12:]); a = analyse(r); a['file'] = f.split('/')[-1]; a['map'] = r.get('map'); rows.append(a)
for a in rows:
    print(f"{a['map']:10s} {a['file']:24s} final {a['final']} (rebuilt {a['rebuilt']}{'' if a['ok'] else ' MISMATCH'}) winner {a['winner']} | lead changes {a['leadChanges']} | takeovers {a['takeovers']} of {a['captures']} captures | first capture {a['firstCapture']} s | neutral {a['neutral']} s | held {a['held']} | led A {a['leadS'][0]} s B {a['leadS'][1]} s")
for m in sorted({a['map'] for a in rows}):
    R = [a for a in rows if a['map'] == m]
    print(f"SUMMARY {m}: {len(R)} matches; lead changes {[a['leadChanges'] for a in R]} (≥ 4 in {sum(1 for a in R if a['leadChanges'] >= 4)} of {len(R)}); takeovers {[a['takeovers'] for a in R]}; margins {[abs(a['final'][0] - a['final'][1]) for a in R]}; neutral s {[a['neutral'] for a in R]}; rebuild ok {sum(1 for a in R if a['ok'])}/{len(R)}")
