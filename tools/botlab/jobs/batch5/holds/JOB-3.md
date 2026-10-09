# JOB-3 — batch 5 `holds`: the holds tests ×3 on the final head (branch botlab-b5-holds)

`git fetch && git checkout botlab-b5-holds && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/holds/results/JOB-3.txt` on botlab-b5-holds (commit + push), with `git rev-parse --short HEAD`.

Since JOB-2 (8b8b351): the blaster aims 3 cm closer, the flourish's rise 2 cm closer, the holds test's bots check skips
pop frames, net-holds keeps specials out of its window. Only the package's own tests, for flakiness (~10 min):

```bash
ONLY="holds net-holds" REP=3 SLOTS=3 PAR=3 tools/botlab/jobs/batch5/holds/regress.sh
for i in 1 2; do ONLY="net-holds" LOG=.botlab/b5-holds-regress-$i tools/botlab/jobs/batch5/holds/regress.sh; done
```

All of the output in the results file (each run's `==` line and FAIL lines; net-holds prints `[net] cN uncaught: …` if
a page throws — copy those lines too).
