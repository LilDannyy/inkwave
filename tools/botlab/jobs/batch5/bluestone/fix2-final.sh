#!/bin/bash
# Bluestone fix round 2 (scratch): the final local measurements at the frozen head, then the pictures.  fix2-final.sh <S>
S="$1"; J=tools/botlab/jobs/batch5/bluestone
until grep -q "### done" "$S/runB.txt" 2>/dev/null; do sleep 10; done
echo "### head $(git rev-parse --short HEAD) $(date)"
bash $J/fix2-ink-more.sh "$S/runC" "1a 2a 3a Ha 1b 2b 3b Hb 1c 2c 3c 1d 2d 3d"
bash $J/fix2-local.sh "$S/runD" "boss regions tests modes"
bash $J/fix2-pictures.sh tools/botlab/jobs/batch5/stages/bluestone/out/blockout "$S/pics"
echo "### all done $(date)"
