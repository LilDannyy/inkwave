#!/bin/bash
# Bluestone Junction blockout pictures, one era per call (scratch):  pictures.sh <era> <out dir> [work dir]
#   top, both aerials, both sides, mid from four places at player height, the spawn through the player's own camera;
#   the top with the zones (MODE=zones) and with the tower's rail (MODE=tower); the ink after the bots played 20 s.
#   JPEG, 1400 px wide, under 300 KB each. Runs through the slot lock (BOTLAB_OUT / SLOTS from the caller).
E="$1"; O="$2"; W="${3:-$(mktemp -d)}"
R=tools/botlab/run.sh
mkdir -p "$O" "$W"
MIDS='[{"name":"mid-6oclock","from":[6.5,1.75,-17.5],"look":[0,2.8,0],"fov":75},{"name":"mid-8oclock","from":[-21,1.75,-9],"look":[0,2.8,0],"fov":75},{"name":"mid-4oclock","from":[16,1.75,-9],"look":[0,2.8,0],"fov":75},{"name":"mid-concourse","from":[0,3.05,-5.5],"look":[0,2,20],"fov":75}]'
jpg() { # src.png dst.jpg
  sips -Z 1400 -s format jpeg -s formatOptions 68 "$1" --out "$2" > /dev/null
  [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null
  return 0
}
ERA=$E MAP=bluestone TIME=day MODE=turf OUT="$W/t" SHOTS="top,aerialA,aerialB,sideL,sideR,play,$MIDS" $R tools/botlab/shoot.cjs > "$W/turf$E.log" 2>&1
ERA=$E MAP=bluestone TIME=day MODE=zones OUT="$W/z" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/zones$E.log" 2>&1
ERA=$E MAP=bluestone TIME=day MODE=tower OUT="$W/w" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/tower$E.log" 2>&1
ERA=$E MAP=bluestone TIME=day MODE=turf PLAY=20 OUT="$W/p" SHOTS='top,aerialA' $R tools/botlab/shoot.cjs > "$W/play$E.log" 2>&1
for s in top aerialA aerialB sideL sideR play mid-6oclock mid-8oclock mid-4oclock mid-concourse; do
  [ -f "$W/t/bluestone-day-$s.png" ] && jpg "$W/t/bluestone-day-$s.png" "$O/era$E-$s.jpg"
done
[ -f "$W/z/bluestone-zones-day-top.png" ] && jpg "$W/z/bluestone-zones-day-top.png" "$O/era$E-top-zones.jpg"
[ -f "$W/w/bluestone-tower-day-top.png" ] && jpg "$W/w/bluestone-tower-day-top.png" "$O/era$E-top-tower.jpg"
[ -f "$W/p/bluestone-day-top.png" ] && jpg "$W/p/bluestone-day-top.png" "$O/era$E-ink-play20-top.jpg"
[ -f "$W/p/bluestone-day-aerialA.png" ] && jpg "$W/p/bluestone-day-aerialA.png" "$O/era$E-ink-play20-aerialA.jpg"
for f in turf zones tower play; do echo "### era $E $f"; grep -E '^REPORT|^CONSOLE|^  \[|WATCHDOG|SHOT FAIL|MAP MISMATCH' "$W/$f$E.log" | cut -c1-400; done
ls -la "$O" | grep "era$E-"
