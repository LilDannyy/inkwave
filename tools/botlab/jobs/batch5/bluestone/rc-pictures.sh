#!/bin/bash
# Bluestone blockout round C (scratch): pictures, one Electron run per (era, mode) through the shared slot lock (the Mac
# mini is unavailable).   rc-pictures.sh <out dir> <work dir> "<sets>"   sets: std1 std2 std3 z1 z2 z3 w1 w2 w3 p1 p2 p3 cross
#   stdN  era N, Turf War: top, aerials, sides, the player camera at the spawn, mid from three angles, the new places
#   zN    era N, Zone Control: top (the zones)      wN  era N, Tower Command: top (the rail)
#   pN    era N, the ink after bots play 20 s (top, aerialA)       cross  Crossroads Market's mid (the comparison)
O="$1"; W="$2"; SETS="$3"; R=tools/botlab/run.sh
cd "$(dirname "$0")/../../../../.." || exit 1
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$O" "$W"
has() { case " $SETS " in *" $1 "*) return 0;; esac; return 1; }
jpg() { sips -Z 1400 -s format jpeg -s formatOptions 68 "$1" --out "$2" > /dev/null; [ "$(stat -f %z "$2")" -gt 300000 ] && sips -s format jpeg -s formatOptions 50 "$1" -Z 1400 --out "$2" > /dev/null; return 0; }
shot() { # era mode prefix cams [env]
  local e=$1 m=$2 p=$3 c=$4
  env $5 ERA=$e MAP=bluestone TIME=day MODE=$m OUT="$W/$p" SHOTS="$c" WATCHDOG=900000 $R tools/botlab/shoot.cjs > "$W/$p.log" 2>&1
  echo "### $p"; grep -E '^REPORT|SHOT FAIL|WATCHDOG|MAP MISMATCH' "$W/$p.log" | cut -c1-300
  for f in "$W/$p"/*.png; do [ -f "$f" ] || continue; n=$(basename "$f" .png | sed -E 's/^bluestone-(zones-|tower-|boss-)?day-//'); jpg "$f" "$O/$p-$n.jpg"; done
}
MIDS='{"name":"mid-from-knee","from":[-21,1.75,-9],"look":[0,2.8,0],"fov":75},{"name":"mid-from-river","from":[12.5,1.75,-16.5],"look":[0,2.8,0],"fov":75},{"name":"mid-from-ring-730","from":[-13,1.75,-13],"look":[0,3,0],"fov":75},{"name":"mid-from-boathouse","from":[24,1.75,-5],"look":[0,2.8,0],"fov":75}'
PLACES='{"name":"swimston-from-forecourt","from":[-20,2.75,-51],"look":[-20,1.5,-20],"fov":75},{"name":"hoki-lane","from":[-34,1.75,-46],"look":[-33,1.5,-22],"fov":75},{"name":"knee-high","from":[-8,18,-40],"look":[-24,0,-12],"fov":70},{"name":"river-corner-high","from":[-14,18,-52],"look":[4,0,-30],"fov":70},{"name":"quay-to-punt","from":[-8,1.75,-46],"look":[8,0.5,-42],"fov":75},{"name":"punt-to-mid","from":[12.5,1.4,-38],"look":[10,1.5,-12],"fov":75},{"name":"gpo-terrace","from":[-11.5,2.95,-42],"look":[-14,1.5,-24],"fov":75}'
P3='{"name":"halo-from-concourse","from":[0,3,-4],"look":[-6,6,-14],"fov":80},{"name":"river-stair","from":[14,1.75,-14],"look":[-2,3.5,-18],"fov":75},{"name":"boat-stair","from":[8,1.75,-2],"look":[16,4,-8],"fov":75},{"name":"garden-from-quay","from":[-8,1.75,-36],"look":[8,0,-36],"fov":75}'
STD='top,aerialA,aerialB,sideL,sideR,play'
has std1 && shot 1 turf r4-era1 "$STD,[$MIDS,$PLACES]"
has std2 && shot 2 turf r4-era2 "$STD,[$MIDS,$PLACES]"
has std3 && shot 3 turf r4-era3 "$STD,[$MIDS,$PLACES,$P3]"
for e in 1 2 3; do
  has z$e && { ERA=$e MAP=bluestone TIME=day MODE=zones OUT="$W/z$e" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/z$e.log" 2>&1; [ -f "$W/z$e/bluestone-zones-day-top.png" ] && jpg "$W/z$e/bluestone-zones-day-top.png" "$O/r4-era$e-top-zones.jpg"; echo "### zones top $e"; grep -E '^REPORT|WATCHDOG' "$W/z$e.log" | cut -c1-200; }
  has w$e && { ERA=$e MAP=bluestone TIME=day MODE=tower OUT="$W/w$e" SHOTS='top' $R tools/botlab/shoot.cjs > "$W/w$e.log" 2>&1; [ -f "$W/w$e/bluestone-tower-day-top.png" ] && jpg "$W/w$e/bluestone-tower-day-top.png" "$O/r4-era$e-top-tower.jpg"; echo "### tower top $e"; grep -E '^REPORT|WATCHDOG' "$W/w$e.log" | cut -c1-200; }
  has p$e && { ERA=$e MAP=bluestone TIME=day MODE=turf PLAY=20 OUT="$W/p$e" SHOTS='top,aerialA' $R tools/botlab/shoot.cjs > "$W/p$e.log" 2>&1
    [ -f "$W/p$e/bluestone-day-top.png" ] && jpg "$W/p$e/bluestone-day-top.png" "$O/r4-era$e-ink-play20-top.jpg"
    [ -f "$W/p$e/bluestone-day-aerialA.png" ] && jpg "$W/p$e/bluestone-day-aerialA.png" "$O/r4-era$e-ink-play20-aerialA.jpg"; echo "### ink $e"; grep -E '^REPORT|WATCHDOG' "$W/p$e.log" | cut -c1-200; }
done
has cross && { MAP=crossmarket TIME=day MODE=turf OUT="$W/cross" SHOTS='[{"name":"mid","from":[-9,1.75,-13],"look":[0,3,0],"fov":75}]' $R tools/botlab/shoot.cjs > "$W/cross.log" 2>&1; echo "### crossmarket mid"; grep -E '^REPORT' "$W/cross.log" | cut -c1-200; }
echo "### done"
