# JOB-3 — sp-fixes: the three tests fixed after JOB-2 (branch botlab-spfix)

`git fetch && git checkout botlab-spfix && git pull`, caffeinate, SLOTS=3. Results → `tools/botlab/jobs/sp-fixes/results/JOB-3.txt`
on botlab-spfix (commit + push). (~20 min)

JOB-2's three misses, now fixed in the tests: net-surf scene=tower (A's sideways toss missed the 2 m/s tower's deck —
it now throws straight up with the tower's motion), surf-calamari 'rail' (fixed at 162711a, JOB-2 §3 confirmed), and
drainbow 'blind' (now judges the trigger during the escape itself). Three passes each, and net-surf / net-drainbow /
surf / surf-tower once more alongside:

```bash
for i in 1 2 3; do LOG=.botlab/spfix-j3-$i ONLY="net-surf-tower drainbow surf-calamari" SLOTS=3 PAR=3 tools/botlab/jobs/sp-fixes/regress.sh; done
LOG=.botlab/spfix-j3-x ONLY="net-surf net-drainbow surf surf-tower" SLOTS=3 PAR=3 tools/botlab/jobs/sp-fixes/regress.sh
```

All of the output into the results file.
