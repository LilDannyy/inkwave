# JOB-2 (zipcheer) — regressions on the new code, and its own tests three times (flakiness)

Branch `botlab-b5-zipcheer` at the sha named in the message (the batch's base + the Zipline buffs and the Cheer Orb
rework). About 25–30 min.

```bash
cd ~/inkwave-botlab && git fetch && git checkout botlab-b5-zipcheer && git pull
caffeinate -i -s bash -c '
  SLOTS=3 PAR=3 LOG=.botlab/zc-j2 tools/botlab/jobs/batch5/zipcheer/regress.sh
  for i in 2 3; do SLOTS=3 LOG=.botlab/zc-j2-$i ONLY="zipcheer net-zipcheer" tools/botlab/jobs/batch5/zipcheer/regress.sh; done
' 2>&1 | tee .botlab/zc-j2.out
```

`regress.sh` runs: zipcheer, bot-specials (turf + tower), hud-lead (turf + zones), input-swim in a batch of 3; then
sfx-cues and audio-pause ALONE; then net-zipcheer, net-practice, net-turf one at a time. The loop runs zipcheer and
net-zipcheer twice more.

Put in `tools/botlab/jobs/batch5/zipcheer/results/JOB-2.txt`: the whole of `.botlab/zc-j2.out` (it is compact: one
`== name: RESULT …` line per test plus its FAIL lines), and the sha you ran. For any test with a FAIL, HARNESS or
WATCHDOG line, also its log's last 15 lines. Commit only that file, push to `botlab-b5-zipcheer`.
