# kind: tests
# The Scrap Sentry (b5-sub-sentry), for the Mac mini when it is back (2026-10-09: it is down; everything below ran
# once locally): its page test in every mode, its two-client test, the regressions it touches — three times each for
# flakiness — and 4 bot matches with it forced (errors only). No balance sets (the lead's consolidated pass).
set -u
P() { local name=$1; shift; env "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$JOB_OUT/$name.log" 2>&1; echo "### $name $(grep -E '^RESULT|WATCHDOG|HARNESS' "$JOB_OUT/$name.log" | tr '\n' ' ') FAIL=$(grep -c '^FAIL' "$JOB_OUT/$name.log")"; grep '^FAIL' "$JOB_OUT/$name.log" | cut -c1-300; }
N() { local name=$1; shift; env "$@" tools/botlab/run.sh tools/botlab/netpage.cjs > "$JOB_OUT/$name.log" 2>&1; echo "### $name $(grep -E '^RESULT|WATCHDOG|HARNESS' "$JOB_OUT/$name.log" | tr '\n' ' ') FAIL=$(grep -c '^FAIL' "$JOB_OUT/$name.log")"; grep '^FAIL' "$JOB_OUT/$name.log" | cut -c1-300; }
for r in 1 2 3; do
  P sub-sentry-$r MAP=testbox MODE=turf WATCHDOG=900000 PAGE=tools/botlab/tests/sub-sentry.js &
  P sub-sentry-tower-$r MAP=testbox MODE=tower WATCHDOG=900000 PAGE=tools/botlab/tests/sub-sentry.js PAGE_ARGS=only=tower &
  P sub-sentry-zones-$r MAP=halyard MODE=zones WATCHDOG=900000 PAGE=tools/botlab/tests/sub-sentry.js PAGE_ARGS=only=zones &
  wait
  N net-sub-sentry-$r CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-sentry.cjs &
  N net-sub-sentry-tower-$r CLIENTS=2 Q0=autopilot Q1=autopilot NET_ARGS=scene=tower NET=tools/botlab/tests/net-sub-sentry.cjs &
  P sub-sentry-boss-$r MAP=testbox MODE=boss WATCHDOG=900000 PAGE=tools/botlab/tests/sub-sentry.js PAGE_ARGS=only=boss &
  wait
done
for t in sub-tweaks sub-tweaks2 sub-scale deployables bot-specials loadout-picker stage-mods sub-scaffold; do
  P $t MAP=testbox MODE=turf WATCHDOG=900000 PAGE=tools/botlab/tests/$t.js
done
P deployables-tower MAP=testbox MODE=tower WATCHDOG=900000 PAGE=tools/botlab/tests/deployables.js PAGE_ARGS=only=tower
N net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-lobbykit.cjs
N net-practice CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=tools/botlab/tests/net-practice.cjs
N net-deploy CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-deploy.cjs
# 4 bot matches with the sentry forced (errors only; the SENTRY line for the record)
for spec in "halyard turf" "crossmarket turf" "halyard zones" "saltpan tower"; do
  set -- $spec
  OUT="$JOB_OUT/match-$1-$2.json" MAP=$1 MODE=$2 SECS=180 SUBS=all=sentry tools/botlab/run.sh tools/botlab/match.cjs > "$JOB_OUT/match-$1-$2.log" 2>&1
  echo "### match $1 $2: $(grep -E 'SENTRY|FRAME ERRORS|CONSOLE' "$JOB_OUT/match-$1-$2.log" | cut -c1-400 | tr '\n' ' ')"
done
