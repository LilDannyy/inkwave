# kind: balance
# after: JOB-1
# [b5-sub-dash] for the lead's consolidated pass (SPEC D11; not run tonight: balance sets are the lead's): the Dash Pellet
# against the Pop Pellet with the same weapons, Turf, 4 stages × 2 = 8 per arm; and a bots-only "dash disabled" control.
set -u
D="$JOB_OUT"
for MAP in halyard saltpan crossmarket treehills; do
  for k in 1 2; do
    for ARM in dash burst; do
      WATCHDOG=900000 MAP=$MAP MODE=turf SECS=180 SUBS="all=$ARM" OUT="$D/$MAP-$ARM-$k.json" tools/botlab/run.sh tools/botlab/match.cjs > "$D/$MAP-$ARM-$k.log" 2>&1 &
    done
    WATCHDOG=900000 MAP=$MAP MODE=turf SECS=180 SUBS='all=dash' DASH_AI=0 OUT="$D/$MAP-off-$k.json" tools/botlab/run.sh tools/botlab/match.cjs > "$D/$MAP-off-$k.log" 2>&1 &
    wait
  done
done
for f in "$D"/*.log; do echo "== $(basename $f)"; grep '^==\|stuck \|DASH\|K/D\|CONSOLE' "$f"; done
