#!/bin/bash
F=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/fx2
until grep -q "RESULT checks done" $F/logs/checks.out; do sleep 5; done
cd $F && ./checks.sh tower cover spawn climb size audit rides > $F/logs/checks2.out 2>&1
./pics.sh > $F/logs/pics.out 2>&1
./bots.sh > $F/logs/bots.out 2>&1
echo "RESULT final done"
