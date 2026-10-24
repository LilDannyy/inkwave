// (fix round 8, review 8 issue 4: boss-check stood 13 s at (3.6, −25), the causeway's south end; JOB-10's longest idle, 8 s,
// at (−0.01, −25.2) with its goal 3.8 m off at (−3.25, −27.25)). The boss put down round the causeway's south end — 8 headings — its walk's state cleared (as a move's end leaves it), the squad held at its pad, then
// 15 s of the match: the longest it stands idle (boss-check's rule: < 0.15 m in a second, no move running), and the same
// from JOB-10's recorded state (its goal forced). Each state over 6 s idle is listed with the walk's state at its worst.
//   MODE=boss PAGE=tools/botlab/jobs/batch5/caldera/boss-foot.js tools/botlab/run.sh tools/botlab/page.cjs
// (x −3 / 0 / 3.6, z −25.2 / −24: the spots boss-check idled at)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const boss = __G.boss;
  R('boss match running on the stage', m.mode === 'boss' && !!boss, { mode: m.mode });
  if (!boss || !boss.brain) return out;
  dbg.freeze();
  const nav = boss.nav, Bn = boss.brain, r2 = (v) => +(+v).toFixed(2);
  const step = (s) => { const n = Math.max(1, Math.round(s * 60)); for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  // the squad held at its pad (no targets in reach: the boss walks its own goals)
  for (const a of m.actors) if (a.bot) { a.bot.update = () => {}; a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.squid = a.intent.jump = false; }
  step(8);   // (past the intro)
  const clearWalk = () => { Bn.path = null; Bn.goal = null; Bn.goalT = 0; Bn.pi = 0; Bn.stuckT = 0; Bn.speed = 0; Bn._tl = null; Bn._tw = 0; Bn._detour = null; Bn._wedge = null; Bn._cross = null; Bn.plan = null; Bn.cool = 1.5; Bn._reloc = null; Bn._anchor = null; Bn._camps = 0; Bn._half = null; if (Bn._bad) Bn._bad.length = 0; boss.anim = 0; boss.invuln = false; boss.stunned = false; m.time = Math.max(m.time, 90); };   // (the round's clock kept running: it ends after a few minutes and the boss stops)
  const run = (x, z, yaw, goal) => {
    clearWalk(); boss.pos.x = x; boss.pos.z = z; boss.yaw = yaw; boss.move = null;
    if (goal) { Bn.goal = goal; Bn.path = nav.path(x, z, goal[0], goal[1]); Bn.pi = nav.isGoal(x, z) ? 1 : 0; Bn.goalT = 5; }
    let still = 0, maxStill = 0, worst = null, prev = { x, z }, dist = 0;
    for (let t = 0; t < 15; t++) {
      step(1);
      const p = boss.pos, d = Math.hypot(p.x - prev.x, p.z - prev.z); dist += d;
      if (d < 0.15 && !boss.move) { still++; if (still > maxStill) { maxStill = still; worst = { t, pos: [r2(p.x), r2(p.z)], yaw: r2(boss.yaw), goal: Bn.goal ? Bn.goal.map(r2) : null, path: Bn.path ? Bn.path.length : null, pi: Bn.pi, wp: Bn.path && Bn.pi < Bn.path.length ? Bn.path[Bn.pi].map(r2) : null, tl: Bn._tl ? { dir: Bn._tl.dir, free: Bn._tl.free } : null, detour: !!Bn._detour, wedge: Bn._wedge ? r2(Bn._wedge.tryT) : null, stuckT: r2(Bn.stuckT), poseOk: nav.poseOk(p.x, p.z, boss.yaw), turnOk: nav.turnOk(p.x, p.z, boss.yaw), turns: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (nav.turnOk(p.x, p.z, (k * Math.PI) / 4) ? 1 : 0)).join(''), bad: Bn._bad ? Bn._bad.length : 0 }; } }
      else still = 0;
      prev = { x: p.x, z: p.z };
    }
    return { maxStill, worst, dist: r2(dist), state: m.state };
  };
  const rows = []; let n = 0, over6 = 0, over10 = 0, worstAll = 0;
  R('(information) the match state when the probe starts', true, { state: m.state, visible: boss.visible, anim: boss.anim, bt: +boss.bt.toFixed(1) });
  for (const x of [-3, 0, 3.6]) for (const z of [-25.2, -24]) for (let k = 0; k < 8; k++) {
    const yaw = (k * Math.PI) / 4;
    const q = run(x, z, yaw, null); n++;
    worstAll = Math.max(worstAll, q.maxStill);
    if (q.maxStill >= 6) { over6++; if (q.maxStill >= 10) over10++; if (rows.length < 24) rows.push({ from: [x, z, Math.round((yaw * 180) / Math.PI)], ...q }); }
  }
  // JOB-10's recorded idle state, its goal forced; and the reviewer's spot with every heading and that goal
  const job10 = run(-0.01, -25.2, -4.73, [-3.25, -27.25]);
  const rev = []; for (let k = 0; k < 8; k++) { const q = run(3.6, -25, (k * Math.PI) / 4, [-3.25, -27.25]); rev.push([Math.round(k * 45), q.maxStill, q.dist]); worstAll = Math.max(worstAll, q.maxStill); if (q.maxStill >= 6) { over6++; if (q.maxStill >= 10) over10++; if (rows.length < 30) rows.push({ from: [3.6, -25, k * 45], goal: [-3.25, -27.25], ...q }); } }
  worstAll = Math.max(worstAll, job10.maxStill);
  R('boss-foot: put down anywhere round the causeway\'s south end (every heading), it never stands idle 10 s', over10 === 0 && job10.maxStill < 10, { states: n + 9, over6, over10, worstS: worstAll, job10, reviewerSpot: rev, rows });
  return out;
})();
