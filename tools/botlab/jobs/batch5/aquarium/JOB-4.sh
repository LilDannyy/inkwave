#!/bin/bash
# kind: balance
# [b5-aquarium] the lead's pipes on / off set for Gulper Aquarium (the Mac mini helper, 2026-10-16): DESIGN.md §6.2(d)
# caps exit camping at 2× the base death rate (single local matches read 1.1–3.0×). Turf War 3:00 and Zone Control, 6
# matches each with the pipes as built and 6 each with them off (PIPESOFF=1: LAYOUT.pipes.modes[mode] = 'off', the
# module's own switch — every leg shut, still drawn and solid), random loadouts, bots normal, DIAG=1, PAGEQ=pipestats.
# Code pinned at e1169a39 (git archive into $JOB_OUT; match-aq.cjs = its match.cjs + the switch, aq-match.cjs).
# Tables → $JOB_OUT/pipes.txt: camping per exit, rides per bot-minute, high-ground arrivals by pipe, stuck %, errors.
set -u
A=tools/botlab/jobs/batch5/aquarium
H="$JOB_OUT/code"; mkdir -p "$H" "$JOB_OUT/m"; git archive e1169a39 | tar -x -C "$H"; ln -s "$PWD/node_modules" "$H/node_modules"
node $A/aq-match.cjs "$H"
L="$JOB_OUT/lines.txt"; : > "$L"
for i in 1 2 3 4 5 6; do for sw in on off; do
  OFF=0; [ $sw = off ] && OFF=1
  echo "turf-$sw-$i MODE=turf SECS=180 PIPESOFF=$OFF" >> "$L"; echo "zones-$sw-$i MODE=zones PIPESOFF=$OFF" >> "$L"
done; done
export H
xargs -P 3 -L 1 bash -c 'n=$0; (cd "$H" && env "$@" MAP=aquarium PAGEQ=pipestats DIAG=1 WATCHDOG=1500000 OUT="$JOB_OUT/m/$n.json" tools/botlab/run.sh tools/botlab/match-aq.cjs > "$JOB_OUT/m/$n.log" 2>&1);
  echo "### $n: $(grep -E "^== " "$JOB_OUT/m/$n.log" | head -1 | cut -c1-140) | $(grep -E "^PIPES |FRAME ERRORS|WATCHDOG|HARNESS" "$JOB_OUT/m/$n.log" | tr "\n" " " | cut -c1-160)"' < "$L"
node $A/aq-agg.cjs "$JOB_OUT/m" > "$JOB_OUT/pipes.txt"; cat "$JOB_OUT/pipes.txt"
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H"
