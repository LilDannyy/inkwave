# JOB-6 — jumpui: JOB-5's two single failures, repeated (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/jumpui/results/JOB-6.txt` on botlab-b5-jumpui (commit + push). (~15 min)

JOB-5 (at 17224bc) passed everything but one check each in two tests:
- jump-ui at 960×600, the enemy-mark check: the test's fault (random bot names: a long teammate name's tag sat where the
  enemy's tag goes on a small window, so the tag was lifted above it by design, and the check wanted it exactly on the
  spot). Fixed in 6bd31ef; reproduced and checked locally with long names.
- bot-specials, the Bubble Blower check (bubbleHold 0: the bot never picked that foe as its target in the window) — this
  package changes no bot code; this repeat shows whether it is chance.

```bash
for i in 1 2 3; do ONLY="jump-ui-960 jump-ui-1 bot-specials" SLOTS=3 PAR=3 LOG=.botlab/jumpui-j6-$i tools/botlab/jobs/batch5/jumpui/regress.sh; done
```

Into the results file: the three outputs (`== name: RESULT …` lines and their FAIL / HARNESS lines), a first line with
the commit and a one-line verdict.
