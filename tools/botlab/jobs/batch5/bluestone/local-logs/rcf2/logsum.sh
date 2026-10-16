#!/bin/bash
# summarise a round-C work dir's Electron logs with rc-local.sh's own greps:  logsum.sh <dir>
D="$1"
line() { grep -E '^== |^   stuck |^   held |^   neutral|^   captures|^   control log|^   best shares|^   splats by cause|^   DIAG|^   checkpoints|^   knockout|^CONSOLE|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^RESULT_JSON' "$1" | grep -v 'no lightmap' | cut -c1-1600 | head -24; }
for f in "$D"/*.log; do [ -f "$f" ] || continue; b=$(basename "$f" .log)
  echo "### $b  ($(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$f"))"
  case "$b" in
    towercheck*) grep -vE '^     run ' "$f" | grep -E '^== |holes|clearance|ride |RESULT_JSON|WATCHDOG|CONSOLE' | cut -c1-600;;
    turf3r*|zones*|towermatch*) line "$f";;
    regions*) grep -E '^PASS ink|^PASS map|^FAIL|WATCHDOG' "$f" | cut -c1-1800;;
    perf*) grep -E '^REPORT' "$f" | cut -c1-500;;
    *) grep -E '^PASS|^FAIL|^RESULT|WATCHDOG' "$f" | sed 's/"b64":"[^"]*"/"b64":…/' | cut -c1-700;;
  esac
done
