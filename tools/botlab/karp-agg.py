#!/usr/bin/env python3
# [b5-karp] Bazookarp match aggregator (SPEC §10.3): over N karp-match.cjs OUT=*.json files, the §9.1 targets.
#   python3 tools/botlab/karp-agg.py dir/*.json        (or a directory)
# Prints the knockout rate and times, side balance (95 % interval), weir-plant rate, time to the first pop, Carp Blasts
# and resets per match, overtime by start reason and outcome (the losing team's share of S38a / S38c overtimes), free-zone
# seconds, stuck, the shared-bubble knockout share, clamp rejections, carrierRetreatFallback — then a PASS / FAIL / INFO row
# per target. (Fewer than 16 matches: the rows are INFO, the SPEC's targets are for ≥ 16.)
import json, math, os, sys, glob, statistics as st

def load(args):
    files = []
    for a in args:
        files += sorted(glob.glob(os.path.join(a, '*.json'))) if os.path.isdir(a) else [a]
    out = []
    for f in files:
        try:
            with open(f) as h: out.append(json.load(h))
        except Exception as e: print('skip', f, e)
    return out

def wilson(k, n, z=1.96):
    if not n: return (0, 0)
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); r = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - r) / d, (c + r) / d)

def main():
    R = load(sys.argv[1:] or ['.'])
    n = len(R)
    if not n: print('no matches'); return 1
    maps = sorted(set(r.get('map', '?') for r in R))
    ko = [r for r in R if r.get('reason') == 'knockout']
    koT = sorted(r['koT'] for r in ko if r.get('koT') is not None)
    winA = sum(1 for r in R if r.get('winner') == 0)
    plant = sum(1 for r in R if len(r.get('plants') or []) > 0)
    fp = [r['firstPop'] for r in R if r.get('firstPop') is not None]
    blasts = [r['blasts']['own'] + r['blasts']['enemy'] for r in R]
    resets = [sum((r.get('resets') or {}).values()) for r in R]
    zone = [r.get('fastT', {}).get('zone', 0) for r in R]
    stuck = [r.get('stuckPct', 0) for r in R]
    cst = [len(r.get('carrierStuck', {}).get('eps', [])) for r in R]
    clamped = [r.get('clamped', 0) for r in R]
    fallback = [r.get('retreatFallback', 0) for r in R]
    ots = [r['ot'] for r in R if r.get('ot')]
    late = [o for o in ots if o['why'] in ('dropped', 'planted')]
    lateWon = [o for o in late if o['end'] in ('comeback', 'knockout')]
    koBub = sum(1 for r in ko if r.get('koBubble'))
    cons = [r.get('console', 0) for r in R]
    lo, hi = wilson(winA, n)
    print(f'== Bazookarp: {n} match(es) on {", ".join(maps)}')
    print(f'   knockouts {len(ko)}/{n} ({100 * len(ko) / n:.0f}%) | times {koT} | median {round(st.median(koT), 1) if koT else "-"}')
    print(f'   Alpha wins {winA}/{n} ({100 * winA / n:.0f}%, 95% {100 * lo:.0f}–{100 * hi:.0f}%) | weir planted in {plant}/{n}')
    print(f'   first pop median {round(st.median(fp), 1) if fp else "-"} s {fp} | Carp Blasts {st.mean(blasts):.2f}/match | resets {st.mean(resets):.2f}/match | own-zone s {st.mean(zone):.1f}/match')
    print(f'   overtime {len(ots)}/{n} by start {dict((w, sum(1 for o in ots if o["why"] == w)) for w in ("held", "dropped", "planted"))} ends {dict((e, sum(1 for o in ots if o["end"] == e)) for e in set(o["end"] for o in ots))} | losing team won {len(lateWon)}/{len(late)} of S38a/S38c')
    print(f'   stuck mean {st.mean(stuck):.1f}% | carrier > 3 s episodes {sum(cst)} | clamp rejections {sum(clamped)} | carrierRetreatFallback {st.mean(fallback):.2f}/match | console lines {sum(cons)}')
    print(f'   knockouts within 8 s of a shared Bubble Guard {koBub}/{len(ko)}')
    # [b5-karp-bots] the bots' carries and the shell: carries ending in a splat within 2.5 s, carries that made no new ground,
    # the ×3 retreat seconds, the fallbacks (and the dips the engine forgives), who the bursts caught
    C = [c for r in R for c in (r.get('carries') or [])]
    short = sum(1 for c in C if c.get('how') == 'splat' and (c.get('dur') or 0) < 2.5)
    flat = sum(1 for c in C if not ((c.get('m') or 0) > 0))
    ret = [r.get('fastT', {}).get('retreat', 0) for r in R]
    soft = [r.get('fbSoft', 0) for r in R]
    bv = [v for r in R for v in (r.get('burstV') or [])]
    melee = sum(1 for v in bv if v.get('w') in ('roller', 'brush', 'blade', 'mitts'))
    print(f'   bots: carries {len(C)} — {short} ({100 * short / max(1, len(C)):.0f}%) a splat within 2.5 s, {flat} ({100 * flat / max(1, len(C)):.0f}%) no new ground | ×3 retreat s/match {[round(x, 1) for x in ret]} | fallback/match {fallback} (forgiven dips {soft}) | burst victims {len(bv)} ({melee} melee) {[(v.get("w"), v.get("role"), v.get("mode"), v.get("d")) for v in bv][:8]}')
    small = n < 16
    def row(name, ok, info):
        tag = 'INFO' if small else ('PASS' if ok else 'FAIL')
        print(f'   {tag} {name}: {info}')
    kr = len(ko) / n
    row('knockout rate 20–60%', 0.2 <= kr <= 0.6, f'{100 * kr:.0f}%')
    row('early knockouts (< 1:15) ≤ 1 of 16; median ≥ 2:30', sum(1 for t in koT if t < 75) <= max(1, n // 16) and (not koT or st.median(koT) >= 150), f'{sum(1 for t in koT if t < 75)} early, median {round(st.median(koT), 1) if koT else "-"}')
    row('weir planted ≥ 75%', plant / n >= 0.75, f'{100 * plant / n:.0f}%')
    row('side balance |A−B| ≤ 4 of 16 (40–60%)', abs(winA - (n - winA)) <= max(4, n // 4), f'A {winA} B {n - winA}')
    row('first pop median 6–12 s', bool(fp) and 6 <= st.median(fp) <= 12, f'{round(st.median(fp), 1) if fp else "-"} s')
    row('Carp Blasts ≤ 1.5 / match', st.mean(blasts) <= 1.5, f'{st.mean(blasts):.2f}')
    row('resets ≤ 2 / match', st.mean(resets) <= 2, f'{st.mean(resets):.2f}')
    row('own-free-zone time ≤ 3 s / match', st.mean(zone) <= 3, f'{st.mean(zone):.1f} s')
    row('stuck ≤ 1%, carrier > 5 s: 0', st.mean(stuck) <= 1 and sum(cst) == 0, f'{st.mean(stuck):.1f}%, {sum(cst)} carrier episodes')
    row('losing team wins ≥ 15% of S38a/S38c overtimes', len(late) < 6 or len(lateWon) / len(late) >= 0.15, f'{len(lateWon)}/{len(late)}' + (' (report only: < 6)' if len(late) < 6 else ''))
    row('shared-bubble knockout share ≤ 25% (flag)', not ko or koBub / len(ko) <= 0.25, f'{koBub}/{len(ko)}')
    row('clamp rejections 0', sum(clamped) == 0, f'{sum(clamped)}')
    row('carrierRetreatFallback ≤ 1 / match (flag)', st.mean(fallback) <= 1, f'{st.mean(fallback):.2f}')
    print(f'SUMMARY karp n={n} ko={len(ko)} winA={winA} plant={plant} firstPop={round(st.median(fp), 1) if fp else "-"} stuck={st.mean(stuck):.1f} clamped={sum(clamped)} console={sum(cons)}')
    return 0

if __name__ == '__main__': sys.exit(main())
