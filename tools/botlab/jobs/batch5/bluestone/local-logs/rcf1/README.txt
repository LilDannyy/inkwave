Bluestone round C fix 1: the local logs (this Mac, one Electron at a time under the shared lock; the Mac mini is down).
*-logs.txt are rc-local.sh's own greps of each run's logs (each file's time in its heading); runner-*.txt are the runners'
stdout. Heads (by time, 2026-10-10):
  run1 / w1   11:18–11:28  d831e8ea (side zone, dock with a crane's plinth, knee flight): the change pictures, Zone
                           Control eras 1 and 3, ink-regions era 1 ×2 and era 3 ×4 (era-3 runs 3–4 saw the dock's low
                           cover, then uncommitted)
  run2 / w2   11:28–11:57  96cda317 (the dock's cover low) for the pictures, Zone Control eras 1 and 3, ink-regions
                           era 1 ×2 and era 3 ×4 and era 1–2 page tests; the gangway (472a0ead) was in the working tree
                           from about 11:47, so the era-3 page tests, the tower-checks (11:49–11:53) and the boss check
                           ran on the gangway geometry; Turf War era 3 ×2 and the tower-match at e88f37a3
  run3 / w3   11:57–12:16  e88f37a3 (the final head): pictures, ink-regions era 1 ×4 and era 3 ×4, Zone Control eras
                           1 and 3, the page tests per era
  run4        12:15–12:20  w4nogang: era-1 ink-regions ×4 at 96cda317 (no gangway; a scratch worktree), the comparison
                           for the river's ink; w4boss1/2: the boss check ×2 at e88f37a3
  run5        12:20–12:23  w5old: era-1 ink-regions ×4 at round C's head 01034566 (a scratch worktree), the comparison;
                           the era-3 zones pictures at e88f37a3
node-checks.txt: every Node check at e88f37a3.
