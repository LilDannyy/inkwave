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
    match)  echo '[{"name":"match","from":[11,12.5,-12],"look":[0,3.6,0],"fov":64}]' ;;
  esac
}
for s in ${@:-burst weir keeper wake}; do
  MP=karpbox; [ "$s" = match ] && MP=${MATCH_MAP:-halyard}
  ( cd "$ROOT" && MAP=$MP MODE=bazookarp ACTORS=1 PLAY=1 PRE="$HERE/shots-pre.js" PRE_ARGS="$s" OUT="$TMP" SHOTS="$(cam "$s")" \
      tools/botlab/run.sh tools/botlab/shoot.cjs ) | grep -E '^(PRE|shot|SHOT|REPORT|CONSOLE|WATCHDOG|MAP)' | cut -c1-600
  f="$TMP/$MP-bazookarp-day-$s.png"; o="$HERE/out/karp-bots-$s.jpg"; [ "$s" = match ] && o="$HERE/out/karp-bots-$MP-burst.jpg"
  [ -f "$f" ] && q=72; [ "$s" = match ] && q=55; sips -s format jpeg -s formatOptions $q -Z 1440 "$f" --out "$o" > /dev/null && ls -l "$o"
done
