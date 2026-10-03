# JOB-5 — jumpui: the whole list once more at the final code (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/jumpui/results/JOB-5.txt` on botlab-b5-jumpui (commit + push). (~35 min)

Why: JOB-3 ran the regressions and the two-client tests at 3ae5fbd; since then only the TAB-map label layout changed
(f21911c, src/ui/hud-jumps.js). This puts every test of the package's proof on the final code in one run.

```bash
SLOTS=3 PAR=3 LOG=.botlab/jumpui-j5 tools/botlab/jobs/batch5/jumpui/regress.sh
```

That is: jump-ui (Turf War, Zone Control, Tower Command, Boss Battle, 960×600, 1280×720, Boss Battle 960×600),
tower-ink, sub-tweaks, hud-lead (turf / zones / tower), map-reveal, input-swim, bot-specials; sfx-cues alone;
net-jump-ui, net-jump-ui scene=tower, net-practice, net-turf.

Into the results file: the script's whole output (`== name: RESULT …` lines and their FAIL / HARNESS lines), a first
line with the commit and a one-line verdict, and for a failing test the 30 lines of its log around the first FAIL
(`.botlab/jumpui-j5/<name>.log`). If a test fails, run that one test once more and say whether it passed the second time.
