#!/bin/bash
# round B: shots → r3-*.jpg (< 300 KB) in the job's out/blockout, plus the sheets
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1; H=$S/shots
cd /Users/danielosling/Desktop/1/st-b5-caldera; O=tools/botlab/jobs/batch5/stages/caldera/out/blockout
j() { [ -f "$1" ] || { echo "missing $1"; return; }; for q in 82 74 66 58 50; do sips -Z ${3:-1600} -s format jpeg -s formatOptions $q "$1" --out "$O/$2" >/dev/null; [ $(stat -f%z "$O/$2") -lt 295000 ] && break; done; echo "$2 $(stat -f%z "$O/$2")"; }
j $H/low/caldera-day-top.png r3-top-low.jpg; j $H/high/caldera-day-top.png r3-top-high.jpg
j $H/zones/caldera-zones-day-top.png r3-top-zones.jpg; j $H/tower/caldera-tower-day-top.png r3-top-tower.jpg
for m in mid1 mid2 mid3 slump bay tail alphahalf midob; do j $H/low/caldera-day-$m.png r3-$m-low.jpg; j $H/high/caldera-day-$m.png r3-$m-high.jpg; done
j $H/high/caldera-day-lookout.png r3-organ-lookout-high.jpg; j $H/high/caldera-day-race2.png r3-race2-high.jpg
j $H/low/caldera-day-play.png r3-play-alpha.jpg
j $H/low/caldera-day-aerialA.png r3-aerial-a.jpg; j $H/low/caldera-day-aerialB.png r3-aerial-b.jpg; j $H/high/caldera-day-aerialA.png r3-aerial-a-high.jpg
j $H/low/caldera-day-sideL.png r3-side-l.jpg; j $H/low/caldera-day-sideR.png r3-side-r.jpg
for m in yard terrace rim horn ridge; do j $H/low/caldera-day-$m.png r3-$m-eye.jpg; done
j $H/ink/caldera-day-top.png r3-ink-play20-top.jpg; j $H/ink/caldera-day-mid.png r3-ink-play20-mid.jpg
cd $S
python3 /Users/danielosling/Desktop/1/st-b5-caldera/tools/botlab/jobs/batch5/caldera/r3/sheet.py $H/low/caldera-day-shape.png $H/high/caldera-day-shape.png /Users/danielosling/Desktop/1/st-b5-aquarium/tools/botlab/jobs/batch5/stages/aquarium/out/blockout/top-tide-down.jpg ../cal-r3/shots/ref/craters-day-shape.png ../cal-r3/shots/ref/halyard-day-shape.png plan-low.json plan-high.json ../cal-r3 /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-shape-sheet.jpg "Highmark round B"
python3 /Users/danielosling/Desktop/1/st-b5-caldera/tools/botlab/jobs/batch5/caldera/r3/plan.py plan-low.json plan-high.json ../cal-r3 $S/plan-sheet.png > $S/logs/plan-metrics.txt && sips -Z 2400 -s format jpeg -s formatOptions 70 $S/plan-sheet.png --out /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-plan-and-footprints.jpg >/dev/null; echo "r3-plan-and-footprints.jpg $(stat -f%z /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-plan-and-footprints.jpg)"
python3 covsheet.py /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-cover-maps-vs-halyard.jpg "Highmark LOW" logs/cover-map-low.log "Highmark HIGH" logs/cover-map-high.log "Halyard" ../cal-r3/cov-hal.txt
python3 gridplan.py plan-low.json plan-g-low.png "round B LOW (10 m grid)" >/dev/null && sips -Z 1300 -s format jpeg -s formatOptions 70 plan-g-low.png --out /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-plan-grid-low.jpg >/dev/null
python3 gridplan.py plan-high.json plan-g-high.png "round B HIGH (10 m grid)" >/dev/null && sips -Z 1300 -s format jpeg -s formatOptions 70 plan-g-high.png --out /Users/danielosling/Desktop/1/st-b5-caldera/$O/r3-plan-grid-high.jpg >/dev/null
echo done
