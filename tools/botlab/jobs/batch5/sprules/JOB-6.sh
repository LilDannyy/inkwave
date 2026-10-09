#!/bin/bash
# kind: balance
# JOB-6 — sprules fix round 1, the after-numbers at the final code (9819b87 source: a barrage's Waddle senses 5 m and
# chases 5 s, committed in config.js — JOB-4 measured that only as a what-if TUNE, wadS, at 0805f0a). No TUNE here.
#   zones: wad 16 (the size of JOB-4's cells, so before 0.191 / wadS 0.147 per use compare straight)
#   turf:  wad, mys, bar 8 each (the cap): the trim must not leave the Waddle / Mystery barrages weak in Turf War, where
#          JOB-1 had them even with the Splat Bomb Barrage (0.10 / 0.08 vs 0.11 foes a use, n 8)
#   zones: mys 8 (a sixth of the Mystery's throws are barrage Waddles too)
# 48 matches (~25 min). Summary: agg.cjs.
set -u
D=.botlab/results/b5-sprules/job6
O=${JOB_OUT:-.botlab/sprules-j6}; mkdir -p "$O"
B=tools/botlab/jobs/batch5/sprules/balance.sh
echo "### JOB-6 @ ${JOB_SHA:-?}: final code, no TUNE — zones wad 16, mys 8; turf wad mys bar 8"
MODES=zones CFGS=wad PAR=${PAR:-3} $B "$D" 0 2 > "$O/progress-zw.log" 2>&1
MODES=zones CFGS=mys PAR=${PAR:-3} $B "$D" 0 1 > "$O/progress-zm.log" 2>&1
MODES=turf CFGS='wad mys bar' PAR=${PAR:-3} $B "$D" 1 0 > "$O/progress-t.log" 2>&1
cat "$O"/progress-*.log | grep -E ' ok$| FAILED$' > "$O/progress.log"
echo "== matches: $(grep -c ' ok$' "$O/progress.log") ok, $(grep -c 'FAILED' "$O/progress.log") FAILED"
grep 'FAILED' "$O/progress.log" | head -10
node tools/botlab/jobs/batch5/sprules/agg.cjs "$D" | tee "$O/summary.txt"
