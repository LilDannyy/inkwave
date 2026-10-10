Bluestone round C fix 2: the local logs (this Mac, one Electron at a time under the shared SLOTS=3 lock; the Mac mini
is down). w*-logs.txt are rc-local.sh's own greps of each run's logs (each file's time in its heading, made with
logsum.sh); runner-*.txt are the runners' own stdout. Heads (by time, 2026-10-10):
  v1               13:09        b9fef3ce (the flight, the punt): the first era-1 change pictures (superseded by w2's)
  run1 / w1        13:10–13:37  ink-regions era 1 ×4 and era 3 ×4 and the f/z change pictures at 7de724a2 (source as
                                b9fef3ce: the north leg's two mooring posts 0.15 / 0.25 m from where they ended up);
                                from 13:19 (5aa4b5f7, the final source) the standard picture sets, the ink after 20 s,
                                the page tests per era (spawn-mid, size-budget, climb-audit, cover-map, stage-audit turf
                                and tower), tower-check per era with both rides, Zone Control eras 1 and 3, the boss
  run2 / w2        13:38–13:45  5aa4b5f7 (the final source; the head read 9ef9e620, a scratch commit): the f-set change
                                pictures again, ink-regions era 1 ×4 and era 3 ×4, Turf War era 1 ×2
node-checks.txt          every Node check at 5aa4b5f7 (rcf2-node.sh): check-maps ×15, rc-check, rc-cover, rc-sight,
                         appear-check ×4 builds, the strip test, rc-routes, rc-halo-entries, nav-measure, rc-spawnmid,
                         rc-weir, rcf1-paths, rc-karp-ring, rcf1-dock-sight, rcf2-punt-wet, props.js
node-checks-7de724a2.txt the same at 7de724a2 (before the posts moved: the strip test read one 26 m strip there)
ink-regions-summary.txt  rcf2-regsum.py over w1 and w2: per era, per region, every run and the mean
halo-ways3.txt           rcf2-halo-ways.mjs: era 3, the bots' paths from the attackers' entry points to the Halo's sides
overlap.txt              rcf2-overlap.py: best outline overlap (IoU over flips and shifts) of Crossroads, Bluestone era 1
                         at fix 2 and at fix 1 (e88f37a3), and Halyard, walkable and footprint
