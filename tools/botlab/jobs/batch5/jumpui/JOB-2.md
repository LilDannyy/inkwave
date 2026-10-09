# JOB-2 — jumpui: everything again at the final commit (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/jumpui/results/JOB-2.txt` on botlab-b5-jumpui (commit + push). (~35 min)

Since JOB-1: the world tag stands in for a return beacon's own badge, TAB-map tags over the pins, minimap tags over your
own arrow, a white alert name, a remote jump onto a tower rider lands on the moving deck (jumpMarks.js), and two more
online checks (a Zipline's mark ended on the spot; `NET_ARGS=scene=tower`).

```bash
REP=3 SLOTS=3 PAR=3 LOG=.botlab/jumpui-j2 tools/botlab/jobs/batch5/jumpui/regress.sh
```

Same list as JOB-1 plus `net-jump-ui-tower` ×3 (after `net-jump-ui` ×3). Into the results file: the script's whole
output (`== name: RESULT …` lines and their FAIL lines), a first line with the commit and a one-line verdict, and for a
failing test the 30 lines of its log around the first FAIL (`.botlab/jumpui-j2/<name>.log`).
