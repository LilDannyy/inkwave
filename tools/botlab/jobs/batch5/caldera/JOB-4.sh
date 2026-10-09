#!/bin/bash
# kind: balance
# Highmark Foundry blockout, fix round 1 (the review's issue 6): Zone Control side balance at both lava levels, 8 matches
# per level, every match with MIRRORED loadouts (both teams the same four weapons, subs and specials, slot for slot), four
# loadout sets × 2; then Turf War ×2 per level for stuck episodes. One compact line per match: winner, reason, counts,
# held time per side, stuck %, the side-zone rotations. (The blockout builds one lava level per run: LAVA=low|high.)
R=tools/botlab/run.sh
J="${JOB_OUT:?}"
P="${PAR:-3}"
mkdir -p "$J/m"
W=( "shooter,roller,charger,spinner" "twins,brush,bow,bucket" "blaster,blade,brolly,mitts" "shooter,charger,twins,roller" )
SB=( "bomb,sticky,burst,seeker" "sticky,bomb,seeker,burst" "burst,seeker,bomb,sticky" "seeker,burst,sticky,bomb" )
SP=( "zooka,bubbler,strike,crab" "storm,zooka,bubbler,strike" "crab,strike,zooka,bubbler" "bubbler,crab,storm,zooka" )
line() { # log -> one line
  local f="$1"; local n; n=$(basename "$f" .log)
  python3 - "$f" "$n" <<'PY'
import json, re, sys
t = open(sys.argv[1]).read(); n = sys.argv[2]
m = re.search(r'^RESULT_JSON (\{.*\})$', t, re.M)
if not m: print(f"{n}: NO RESULT  " + ' '.join(l for l in t.splitlines() if 'WATCHDOG' in l or 'HARNESS' in l or 'rror' in l)[:200]); sys.exit()
r = json.loads(m.group(1))
eps = sorted(r.get('eps') or [], key=lambda e: -e.get('dur', 0))[:2]
ep = '; '.join(f"{e['dur']}s {e['w']} {e['mode']} @{e['pos']}" for e in eps)
if r.get('mode') == 'zones' or 'held' in r:
  side = ' '.join(re.findall(r'(center|sideA|sideB)@', r.get('windows', '')))
  print(f"{n}: winner {'AB'[r['winner']] if r.get('winner') in (0,1) else r.get('winner')} ({r.get('reason')}) counts {r.get('counts')} pen {r.get('penalty')} held A {r['held'][0]} B {r['held'][1]} OT {r.get('overtime')} stuck {r['stuckPct']}% | {side} | longest {ep}")
else:
  print(f"{n}: turf {r.get('cov')} stuck {r['stuckPct']}% splats {r.get('splats')} water {r.get('water')} | longest {ep}")
PY
}
jobs=()
for lv in low high; do for k in 0 1 2 3; do for rep in 1 2; do
  jobs+=( "$lv zones $k $rep" )
done; done; done
for lv in low high; do for rep in 1 2; do jobs+=( "$lv turf - $rep" ); done; done
run1() {
  set -- $1; local lv=$1 mode=$2 k=$3 rep=$4 f
  if [ "$mode" = zones ]; then
    f="$J/m/zones-$lv-L$k-$rep.log"
    LAVA=$lv MAP=caldera MODE=zones WEAPONS="${W[$k]},${W[$k]}" SUBS="${SB[$k]},${SB[$k]}" SPECIALS="${SP[$k]},${SP[$k]}" WATCHDOG=1500000 $R tools/botlab/match.cjs > "$f" 2>&1
  else
    f="$J/m/turf-$lv-$rep.log"
    LAVA=$lv MAP=caldera MODE=turf SECS=180 DIAG=1 WATCHDOG=1500000 $R tools/botlab/match.cjs > "$f" 2>&1
  fi
  echo "== $(line "$f")"
}
i=0
for j in "${jobs[@]}"; do run1 "$j" >> "$J/lines.txt" & i=$((i+1)); if [ $i -ge "$P" ]; then wait; i=0; fi; done; wait
sort "$J/lines.txt" > "$J/summary.txt"
python3 - "$J/summary.txt" > "$J/tally.txt" <<'PY'
import re, sys
rows = open(sys.argv[1]).read().splitlines()
for lv in ('low', 'high'):
  z = [r for r in rows if f'zones-{lv}-' in r and 'winner' in r]
  a = sum(' winner A ' in r for r in z); b = sum(' winner B ' in r for r in z)
  hA = sum(float(re.search(r'held A ([\d.]+)', r).group(1)) for r in z); hB = sum(float(re.search(r'held A [\d.]+ B ([\d.]+)', r).group(1)) for r in z)
  sa = sum(r.split('|')[1].split().count('sideA') for r in z); sb = sum(r.split('|')[1].split().count('sideB') for r in z)
  print(f"### zones {lv}: {len(z)} matches, Alpha {a} / Bravo {b}; held A {hA:.1f} s / B {hB:.1f} s; side-zone activations sideA {sa} / sideB {sb}")
PY
cat "$J/tally.txt"; echo "RESULT done"
