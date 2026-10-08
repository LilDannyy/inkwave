#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/caldera/out/*.jpg
# Highmark Foundry blockout, the references it is judged against (independent of the stage's own geometry):
#   - Halyard's cover map with cover-map.js (the target: at least its share within 5 m of cover, and its open stretches)
#   - top shots of Halyard, Craters and Spirhalite from ONE fixed camera (250 m up, 35° fov: the same scale as the
#     caldera's own shape shot) for the shape sheet
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/caldera/out
mkdir -p "$O" "$J/shots"
echo "== Halyard cover map"
MAP=halyard MODE=turf PAGE=tools/botlab/tests/cover-map.js WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/cover-halyard.log" 2>&1
python3 tools/botlab/jobs/batch5/caldera/cover-stretches.py "$J/cover-halyard.log" 5.0 halyard > "$J/cover-halyard.txt" 2>&1
python3 tools/botlab/cover-map.py "$J/cover-halyard.log" "$J/cover-halyard.png" "Halyard Marina (reference)" >> "$J/cover-halyard.txt" 2>&1
[ -f "$J/cover-halyard.png" ] && sips -s format jpeg -s formatOptions 80 "$J/cover-halyard.png" --out "$O/ref-cover-halyard.jpg" >/dev/null
grep -E '^PASS|^FAIL|^RESULT' "$J/cover-halyard.log" | cut -c1-300 >> "$J/cover-halyard.txt"
echo "== shape shots (one camera for every stage)"
CAM='[{"name":"shape","from":[-0.02,250,0],"look":[0,0,0],"fov":35}]'
for m in halyard craters spirhalite; do
  MAP=$m TIME=day MODE=turf OUT="$J/shots" SHOTS="$CAM" $R tools/botlab/shoot.cjs > "$J/shape-$m.log" 2>&1 &
done
wait
for m in halyard craters spirhalite; do
  grep -E '^REPORT|^shot|WATCHDOG' "$J/shape-$m.log" | cut -c1-300 > "$J/shape-$m.txt"
  [ -f "$J/shots/$m-day-shape.png" ] && sips -Z 1600 -s format jpeg -s formatOptions 82 "$J/shots/$m-day-shape.png" --out "$O/ref-shape-$m.jpg" >/dev/null
done
ls -la "$O" > "$J/out-list.txt"
echo "RESULT done"
