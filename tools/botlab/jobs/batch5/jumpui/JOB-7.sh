#!/bin/bash
# kind: tests
# JOB-7 — jumpui, review fix round 1 (code at 1f54184): TAB-map labels never on a pin (stems too), discs off zone /
# tower chips, world tags kept out of the top HUD (stack down instead), 11 px floors, the furniture read throttled; the
# jump-ui test bounded and extended (crowd scene, sizes). The reviewer found Zone Control at 960×600 failing and no run
# of Zone Control / Tower Command at 960×600 or 1280×720 anywhere: regress.sh now runs jump-ui in every mode at every
# size (12 runs).
# Round 1: the whole regress list (the 12 jump-ui runs, tower-ink, sub-tweaks, hud-lead ×3, map-reveal, input-swim,
# bot-specials, then sfx-cues alone, net-jump-ui, its tower scene, net-practice, net-turf).
# Rounds 2–3: jump-ui at 960×600 in every mode, and Zone Control / Tower Command at 1280×720.
set -u
R=tools/botlab/jobs/batch5/jumpui/regress.sh
S=${JOB_OUT:-.botlab/jumpui-j7}/summary.txt; mkdir -p "$(dirname "$S")"
echo "### round 1 @ ${JOB_SHA:-?}: the whole regress list" | tee -a "$S"
PAR=${PAR:-3} LOG=.botlab/jumpui-j7-1 $R | tee -a "$S"
for i in 2 3; do
  echo "### round $i: jump-ui at 960x600 (every mode) + zones / tower at 1280x720" | tee -a "$S"
  ONLY="jump-ui-960 jump-ui-zones-960 jump-ui-tower-960 jump-ui-boss-960 jump-ui-zones-1280 jump-ui-tower-1280" PAR=${PAR:-3} LOG=.botlab/jumpui-j7-$i $R | tee -a "$S"
done
