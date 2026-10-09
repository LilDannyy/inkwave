# JOB-3 — jumpui fix round 1: everything at the new code (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/jumpui/results/JOB-3.txt` on botlab-b5-jumpui (commit + push). (~50 min)

Since JOB-2 (the review's fixes): landing tags laid out round each other in the world view, the minimap and the TAB
map (TAB tags now under the pins, labels clear of them); the "jumping to you" alerts side by side, under whatever
hangs below the top bar (boss bar, zone chip, tower track, TRACKED / POISONED), with the callouts / banners / count
dropping below them; the other team's world tags hidden behind walls. jump-ui has four new parts (stack, pins, place,
walls) and now also runs in Tower Command, Boss Battle and at 960×600 / 1280×720 (`W` / `H`, page.cjs). tower-ink and
sub-tweaks join the list.

```bash
REP=3 SLOTS=3 PAR=3 LOG=.botlab/jumpui-j3 tools/botlab/jobs/batch5/jumpui/regress.sh
```

That is: jump-ui ×3 (Turf War), and once each in Zone Control, Tower Command, Boss Battle, at 960×600, at 1280×720, and
Boss Battle at 960×600 (alert / place / stack); hud-lead (turf / zones / tower), map-reveal, input-swim, bot-specials,
tower-ink, sub-tweaks; sfx-cues alone; net-jump-ui ×3, net-jump-ui scene=tower ×3, net-practice, net-turf.

Into the results file: the script's whole output (`== name: RESULT …` lines and their FAIL / HARNESS lines), a first
line with the commit and a one-line verdict, and for a failing test the 30 lines of its log around the first FAIL
(`.botlab/jumpui-j3/<name>.log`). If any run prints `HARNESS ERROR … conversion failure`, include that whole line (it
now carries the stack) and run that one test once more, saying whether it passed the second time.
