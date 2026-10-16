#!/bin/bash
# (scratch) karp-bots pictures: one shoot.cjs run per scene of shots-pre.js on karpbox (MODE=bazookarp), then JPEG < 300 KB
# into out/.  tools/botlab/jobs/batch5/karp-bots/shots.sh [burst weir keeper wake]   (env: BOTLAB_OUT, SLOTS as usual)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../../.." && pwd)"
TMP="${TMP_SHOTS:-$ROOT/.botlab/karp-bots-shots}"; mkdir -p "$TMP" "$HERE/out"
cam() {
  case "$1" in
    burst)  echo '[{"name":"burst","from":[10.5,8.5,-12.5],"look":[0,0.6,0.5],"fov":68}]' ;;
    weir)   echo '[{"name":"weir","from":[-12,8,11],"look":[0.5,0.8,23.5],"fov":66}]' ;;
    keeper) echo '[{"name":"keeper","from":[10,7.5,-29],"look":[0,0.4,-43],"fov":66}]' ;;
    wake)   echo '[{"name":"wake","from":[-6,1.55,12.7],"look":[-6,0.25,27],"fov":70}]' ;;
  esac
}
for s in ${@:-burst weir keeper wake}; do
  ( cd "$ROOT" && MAP=karpbox MODE=bazookarp ACTORS=1 PLAY=1 PRE="$HERE/shots-pre.js" PRE_ARGS="$s" OUT="$TMP" SHOTS="$(cam "$s")" \
      tools/botlab/run.sh tools/botlab/shoot.cjs ) | grep -E '^(PRE|shot|SHOT|REPORT|CONSOLE|WATCHDOG|MAP)' | cut -c1-600
  f="$TMP/karpbox-bazookarp-day-$s.png"
  [ -f "$f" ] && sips -s format jpeg -s formatOptions 72 -Z 1440 "$f" --out "$HERE/out/karp-bots-$s.jpg" > /dev/null && ls -l "$HERE/out/karp-bots-$s.jpg"
done
