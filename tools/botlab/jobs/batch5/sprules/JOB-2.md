# JOB-2 — b5-sprules: regressions, then the package's own tests twice more (flakiness)

Branch `botlab-b5-sprules` (fork), at the sha named in the message. `git fetch fork && git checkout botlab-b5-sprules &&
git pull`, `caffeinate`, `SLOTS=3`. Run it AFTER JOB-1 (not alongside it). Results →
`tools/botlab/jobs/batch5/sprules/results/JOB-2.txt` on the same branch, then push.

```bash
cd ~/inkwave-botlab
SLOTS=3 PAR=3 tools/botlab/jobs/batch5/sprules/regress.sh
for i in 2 3; do SLOTS=3 PAR=2 ONLY='sp-rules net-sprules' LOG=.botlab/b5-sprules-regress-r$i tools/botlab/jobs/batch5/sprules/regress.sh; done
```

- The first line: sp-rules, bot-specials, drainbow, surf, sub-tweaks2, loadout-picker (3 at a time), then sfx-cues and
  audio-pause ALONE (they only pass alone), then the online ones one at a time: net-sprules, net-drainbow, net-surf,
  net-practice, net-splatfeed (~25 min).
- The loop: sp-rules and net-sprules twice more each.

**What to put in results/JOB-2.txt**: the script's own output for each run (one `== name: RESULT n/m k FAIL` line per
test plus its FAIL / HARNESS / WATCHDOG lines — already compact), and the wall time. For any test that FAILED or has no
RESULT line, also the last 30 lines of its log (`.botlab/b5-sprules-regress*/<name>.log`), cut to 300 characters a line.
