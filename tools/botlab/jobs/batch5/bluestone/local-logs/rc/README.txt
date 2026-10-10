Bluestone round C: the builder's local logs (committed in round C fix 1; the review asked for them). Everything ran on
this Mac, one Electron at a time under the shared lock. The summaries are rc-local.sh's own greps of each log
(logsum: each file's time is in its heading); the runner-*.txt files are the runners' own stdout.

Which head each run saw (by the log's time, 2026-10-10):
  before 01:25   04fb8fd6 / 852c5ead geometry        runner-L1.txt, L1-logs.txt (tower-check), node-checks.txt n1
  01:25 – 01:41  66f6e707                             runner-proof-a.txt, L2's page tests (spawn-mid … stage-audit), node n2
  01:41 – 10:10  c13c5aca geometry (bd0fc6aa, 596ca9ba are scratch commits on top)
                                                      L2's tower-checks, Turf War ×3, ink-regions ×2, Halyard perf,
                                                      Zone Control ×2 (09:58, 10:00), tower-match (10:02), boss (10:07);
                                                      L4-logs.txt (ink-regions ×2, 09:55–09:57); runner-proof.txt,
                                                      runner-proof-b.txt, runner-proof-c.txt (pictures' REPORT lines)
  after 10:10    480d3258                             runner-proof5.txt, L5-logs.txt (boss and the page tests per era)
The fix-1 runs are in ../rcf1/.
