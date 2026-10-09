# kind: tests
# [b5-sub-dash] the dash-reach audit in full (every edge node; local runs took every 4th / 8th) on every stage, at 1/60
# and 1/24; then the dash's own tests and the regressions it touches, three times each for flakiness.
set -u
D="$JOB_OUT"
for MAP in tidewater kelpline halyard saltpan crossmarket lockgate terraces nantai craters calamari spirhalite treehills cargo bluestone aquarium caldera; do
  for A in 'step=1' 'dt=24;step=2'; do
    tag=$(echo "$A" | tr ';=' '__')
    WATCHDOG=3000000 MAP=$MAP MODE=turf PAGE=tools/botlab/tests/dash-reach.js PAGE_ARGS="$A" tools/botlab/run.sh tools/botlab/page.cjs > "$D/reach-$MAP-$tag.log" 2>&1
    echo "== reach $MAP $A: $(grep '^RESULT' "$D/reach-$MAP-$tag.log")"; grep '^FAIL' "$D/reach-$MAP-$tag.log" | cut -c1-600
  done
done > "$D/reach.txt"
for i in 1 2 3; do
  for T in sub-dash sub-tweaks sub-tweaks2 sub-scale deployables bot-specials loadout-picker input-swim; do
    WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/$T.js tools/botlab/run.sh tools/botlab/page.cjs > "$D/$T-$i.log" 2>&1
    echo "== $T #$i: $(grep '^RESULT' "$D/$T-$i.log") | $(grep 'console errors' "$D/$T-$i.log")"; grep '^FAIL' "$D/$T-$i.log" | cut -c1-400
  done
  for T in net-lobbykit net-practice; do
    WATCHDOG=900000 CLIENTS=2 Q0=autopilot Q1=autopilot APP_CSP=1 NET=tools/botlab/tests/$T.cjs tools/botlab/run.sh tools/botlab/netpage.cjs > "$D/$T-$i.log" 2>&1
    echo "== $T #$i: $(grep '^RESULT' "$D/$T-$i.log")"; grep '^FAIL' "$D/$T-$i.log" | cut -c1-400
  done
  WATCHDOG=900000 CLIENTS=2 Q0=autopilot Q1='autopilot&netlag=150&netjitter=60' NET=tools/botlab/tests/net-sub-dash.cjs tools/botlab/run.sh tools/botlab/netpage.cjs > "$D/net-sub-dash-$i.log" 2>&1
  echo "== net-sub-dash #$i: $(grep '^RESULT' "$D/net-sub-dash-$i.log")"; grep '^FAIL' "$D/net-sub-dash-$i.log" | cut -c1-400
done > "$D/tests.txt"
cat "$D/reach.txt" "$D/tests.txt"
