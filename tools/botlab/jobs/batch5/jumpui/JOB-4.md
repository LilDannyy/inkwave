# JOB-4 — jumpui: jump-ui once more at the final code (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/jumpui/results/JOB-4.txt` on botlab-b5-jumpui (commit + push). (~10 min)

Since JOB-3: TAB-map labels also keep clear of the zone / tower chips (f21911c), and jump-ui's pins part gained a jump
coming down on each zone / by the tower. Plus sub-tweaks twice: JOB-3's one failing check there (the sprinkler's drop
spread) is outside this package; two more runs show whether it's chance.

```bash
ONLY="jump-ui jump-ui-zones jump-ui-tower jump-ui-boss jump-ui-960 jump-ui-1280 sub-tweaks" SLOTS=3 PAR=3 LOG=.botlab/jumpui-j4 tools/botlab/jobs/batch5/jumpui/regress.sh
ONLY="sub-tweaks" SLOTS=3 LOG=.botlab/jumpui-j4b tools/botlab/jobs/batch5/jumpui/regress.sh
```

Into the results file: both outputs (`== name: RESULT …` lines and their FAIL / HARNESS lines) and a first line with the
commit and a one-line verdict.
