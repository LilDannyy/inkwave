#!/bin/bash
# kind: tests
# after: JOB-7
# JOB-8 — jumpui: JOB-7's one failure repeated. bot-specials dropped its Mega Stamp check once (18/19) at 6fc9a53; this
# package changes no bot code (HUD only), and JOB-6 had bot-specials 19/19 ×3. Four more runs at the same code, the
# whole FAIL line kept (the regress log cuts it at 600 characters).
set -u
T=tools/botlab/tests; RUN=tools/botlab/run.sh
O=${JOB_OUT:-.botlab/jumpui-j8}; mkdir -p "$O" .botlab/jumpui-j8
echo "### bot-specials x4 @ ${JOB_SHA:-?}" | tee -a "$O/summary.txt"
for i in 1 2 3 4; do echo "bot-specials-$i MAP=testbox MODE=turf WATCHDOG=900000 PAGE=$T/bot-specials.js $RUN tools/botlab/page.cjs"; done |
  xargs -P "${PAR:-3}" -L 1 bash -c 'n=$0; env "$@" > .botlab/jumpui-j8/$n.log 2>&1; echo "== $n: $(grep -E "^RESULT" .botlab/jumpui-j8/$n.log | tail -1) $(grep -c "^FAIL" .botlab/jumpui-j8/$n.log) FAIL"'  | tee -a "$O/summary.txt"
for f in .botlab/jumpui-j8/bot-specials-*.log; do grep -E '^FAIL|HARNESS|console errors: [^n]' "$f" | sed "s|^|$(basename "$f" .log): |" | cut -c1-2500; done | tee "$O/fails.txt"
