#!/bin/bash
# kind: tests
# JOB-6 — jumpui: JOB-5's two single failures, repeated (the new runner protocol: COMMON.md, 2026-10-04)
# - jump-ui at 960×600, the enemy-mark check: the test's fault (random bot names: a long teammate name's tag sat where the
#   enemy's tag goes on a small window, so the tag was lifted above it by design, and the check wanted it exactly on the
#   spot). Fixed in 6bd31ef; reproduced and checked locally with long names.
# - bot-specials, the Bubble Blower check (bubbleHold 0: the scene never put the bubble on the bot's line of fire) — this
#   package changes no bot code; the repeats show whether it is chance.
# Round 1: every jump-ui run (turf, 960×600, 1280×720, zones, tower, boss, boss 960×600) + bot-specials; rounds 2–3:
# jump-ui (turf, 960×600, 1280×720) + bot-specials.
set -u
R=tools/botlab/jobs/batch5/jumpui/regress.sh
S=${JOB_OUT:-.botlab/jumpui-j6}/summary.txt; mkdir -p "$(dirname "$S")"
echo "### round 1 @ ${JOB_SHA:-?}" | tee -a "$S"
ONLY="jump-ui jump-ui-zones jump-ui-tower jump-ui-boss jump-ui-boss-960 bot-specials" PAR=${PAR:-3} LOG=.botlab/jumpui-j6-1 $R | tee -a "$S"
for i in 2 3; do
  echo "### round $i" | tee -a "$S"
  ONLY="jump-ui bot-specials" PAR=${PAR:-3} LOG=.botlab/jumpui-j6-$i $R | tee -a "$S"
done
