#!/bin/bash
# kind: balance
# JOB-4 — sprules fix round 1: the Waddle Bomb Barrage in Zone Control. The reviewer: in JOB-1 (n 8) a team forced to it
# splatted ~3× as many foes per use as one forced to the Splat Bomb Barrage (0.22 vs 0.07), and asked for a targeted Zone
# Control set of at least 16 matches a cell — twice tonight's cap of 8, for this one mode and these five cells only.
# Zone Control only, 4 stages × 2 × both sides = 16 matches a cell, the forced team against random special rolls
# (balance.sh: weapons mirrored, the special gauge ×3):
#   wad    the Waddle Bomb Barrage as it is (a barrage's Waddle = the full Waddle Bomb: sense 7.5 m, chase 9 s, gap 0.5)
#   bar    the Splat Bomb Barrage (reference)
#   ski    the Skitter Bomb Barrage (reference: the other homing barrage)
#   wadS   what-if TUNE of a barrage's Waddle: sense 5 m, chase 5 s
#   wadSG  the same and a 0.65 s gap (10 a barrage, not 13)
# 80 matches (~40 min). Summary: agg.cjs (wins, K/D, foes splatted by the barrage per match and per use, uses).
set -u
D=.botlab/results/b5-sprules/job4
O=${JOB_OUT:-.botlab/sprules-j4}; mkdir -p "$O"
echo "### JOB-4 @ ${JOB_SHA:-?}: zones, cells wad bar ski wadS wadSG, 16 a cell"
MODES=zones CFGS='wad bar ski wadS wadSG' PAR=${PAR:-3} tools/botlab/jobs/batch5/sprules/balance.sh "$D" 0 2 > "$O/progress.log" 2>&1
echo "== matches: $(grep -c ' ok$' "$O/progress.log") ok, $(grep -c 'FAILED' "$O/progress.log") FAILED"
grep 'FAILED' "$O/progress.log" | head -10
node tools/botlab/jobs/batch5/sprules/agg.cjs "$D" | tee "$O/summary.txt"
