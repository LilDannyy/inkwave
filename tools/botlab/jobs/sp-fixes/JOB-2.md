# JOB-2 — sp-fixes: every regression on the final code (branch botlab-spfix)

`git fetch && git checkout botlab-spfix && git pull`, caffeinate, SLOTS=3. Results → `tools/botlab/jobs/sp-fixes/results/JOB-2.txt`
on botlab-spfix (commit + push). JOB-1 can finish first; this one doesn't depend on it.

What changed since JOB-1: Surf N' Turf follows gravity on moving things (rides the tower, falls when its floor goes,
pushed by railcars, lifted by rising blocks; each ring centred where it left from; new records [5] / [6]); the
net-surf staging now comes from the config (it failed 11/12 since the ring reach doubled); a Tower Command scene for
net-surf; surf.js's ink bands run to rMax; net-drainbow checks the one-shade ink online.

## 1. All of the regressions (~35 min)

```bash
SLOTS=3 PAR=3 tools/botlab/jobs/sp-fixes/regress.sh
```

(the page tests in a batch — drainbow, surf, surf-roof, surf-tower, surf-hedge, surf-calamari, bot-specials (turf +
tower), tower-rules, movers, bot-sight, world-build — then sfx-cues and audio-pause ALONE, then the online ones:
net-drainbow, net-surf, net-surf-tower, net-practice.) All of its output into the results file.

## 2. The online and new tests twice more (stability, ~20 min)

```bash
for i in 2 3; do LOG=.botlab/spfix-regress-$i ONLY="net-surf net-surf-tower net-drainbow drainbow surf-tower surf-calamari" SLOTS=3 PAR=3 tools/botlab/jobs/sp-fixes/regress.sh; done
```

All of its output too.
