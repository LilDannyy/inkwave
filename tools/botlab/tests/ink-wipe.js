// The clear-all-ink wave (paint.startWipe) and its sync rule, deterministically, on one paint system:
//  · the wave clears every cell it passes (the grid empty at the end, the atlas too);
//  · three "screens" of one online session — the painter, one whose wave runs behind (splats arrive before its front
//    gets there: they wait), one whose wave runs ahead (splats arrive after: the ring the front already passed for the
//    painter is masked off), plus splats from before the wave and after it, and a splat arriving before that screen's
//    wave has even started — all end with the identical grid;
//  · exportGrid / importGrid round-trip exactly (a late joiner's copy of the turf);
//  · offline Practice: K's wave (api.practiceClearInk) clears the stage, one at a time.
//   MAP=halyard PAGE=tools/botlab/tests/ink-wipe.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const THREE = await import('three');
  const { WIPE_DONE } = await import('./src/world/paint.js');
  g.debug.freeze();
  const P = __G.paint, B = __G.level.bounds;
  const cx = +((B.minX + B.maxX) / 2).toFixed(2), cz = +((B.minZ + B.maxZ) / 2 + 6).toFixed(2);
  const v = new THREE.Vector3();
  const inked = () => P.grid.reduce((s, x) => s + (x ? 1 : 0), 0);
  const step = () => P.flush(1 / 60);
  // a fixed spray of splats (seeded): positions over the whole stage, both teams
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const spray = (n) => Array.from({ length: n }, () => ({ x: B.minX + 4 + rnd() * (B.maxX - B.minX - 8), z: B.minZ + 4 + rnd() * (B.maxZ - B.minZ - 8), r: 0.7 + rnd() * 1.4, team: rnd() < 0.5 ? 0 : 1, seed: rnd() }));
  const paint = (s, o = {}) => P.splat(v.set(s.x, 0.4, s.z), s.r, s.team, { seed: s.seed, ...o });

  // ---- 1. the wave clears everything
  P.clear();
  for (const s of spray(500)) paint(s);
  for (let i = 0; i < 30; i++) step();
  const before = inked();
  const W = P.startWipe({ k: 1, cx, cz, dur: 1.5 });
  let frames = 0;
  while (P.wiping && frames < 400) { step(); frames++; }
  R('the wave clears every cell (grid + counts)', before > 1000 && inked() === 0 && P.counts[0] === 0 && P.counts[1] === 0, { before, after: inked(), frames, reach: W && +W.reach.toFixed(1) });

  // ---- 2. the sync rule: the same splats, arriving at three screens at different points of their own waves
  const pre = spray(300), during = spray(160), postW = spray(60);
  const REACH = +W.reach.toFixed(2), DUR = 1.5;
  // the painter: paints `during` while its own wave runs (one every frame or so) — its tags are recorded
  P.clear();
  for (const s of pre) paint(s);
  for (let i = 0; i < 20; i++) step();
  P.startWipe({ k: 1, cx, cz, dur: DUR, reach: REACH });
  const tagged = [];
  let di = 0;
  while (P.wiping) {
    for (let k = 0; k < 2 && di < during.length; k++, di++) { const t = P.wipeTag(); paint(during[di]); tagged.push({ s: during[di], wk: t[0], wr: t[1] }); }
    step();
  }
  for (const s of postW) { const t = P.wipeTag(); paint(s); tagged.push({ s, wk: t[0], wr: t[1] }); }
  for (let i = 0; i < 300; i++) step();
  const painter = P.exportGrid().d, painterInked = inked();
  // another screen: its wave runs `lag` metres behind (lag < 0: ahead) of the painter's at the moment each splat lands;
  // `early` splats of the painter's arrive before this screen's wave has started at all
  const screen = (lag, early) => {
    P.clear();
    for (const s of pre) paint(s);
    for (let i = 0; i < 20; i++) step();
    const q = tagged.map((e) => ({ ...e, at: e.wr >= WIPE_DONE ? WIPE_DONE : e.wr - lag }));
    // (arriving before the wave started here: the first `early` ones)
    for (const e of q.slice(0, early)) paint(e.s, { replay: 1, wk: e.wk, wr: e.wr });
    const rest = q.slice(early);
    // the pre-wave splats a laggy screen hears late: re-sent (untagged) after its wave started — they must be cleared too
    P.startWipe({ k: 1, cx, cz, dur: DUR, reach: REACH });
    let late = pre.slice(0, 40);
    while (P.wiping || rest.length) {
      const f = P.wipeFront(1);
      while (rest.length && rest[0].at <= f) { const e = rest.shift(); paint(e.s, { replay: 1, wk: e.wk, wr: e.wr }); }
      if (late.length && f > 5) { for (const s of late) paint(s, { replay: 1 }); late = []; }
      step();
      if (!P.wiping && rest.length && f >= WIPE_DONE) { for (const e of rest.splice(0)) paint(e.s, { replay: 1, wk: e.wk, wr: e.wr }); }
    }
    for (let i = 0; i < 300; i++) step();
    return { d: P.exportGrid().d, inked: inked(), held: P._held.length };
  };
  const behind = screen(7, 6), ahead = screen(-9, 0), wayAhead = screen(-30, 0);
  R('a screen whose wave runs behind (splats wait for its front) ends with the painter\'s exact turf', behind.d === painter && !behind.held, { painter: painterInked, it: behind.inked });
  R('a screen whose wave runs ahead (the passed ring masked off) ends with the painter\'s exact turf', ahead.d === painter && !ahead.held, { painter: painterInked, it: ahead.inked });
  R('…and one far ahead too', wayAhead.d === painter && !wayAhead.held, { painter: painterInked, it: wayAhead.inked });
  R('(the scenario keeps ink behind the front and after the wave)', painterInked > 500, { painterInked });

  // ---- 3. exportGrid / importGrid round-trip
  const x = P.exportGrid(), counts = [...P.counts];
  P.clear();
  const ok = P.importGrid(x);
  R('importGrid(exportGrid()) restores the grid and the counts exactly', ok && P.exportGrid().d === x.d && P.counts[0] === counts[0] && P.counts[1] === counts[1], { bytes: x.d.length, counts });
  R('importGrid refuses another stage\'s grid', P.importGrid({ ...x, n: x.n + 1 }) === false);

  // ---- 4. offline Practice: the K wave
  g.debug.unfreeze();
  await g.api.startPractice({ mapId: 'halyard' });
  for (let i = 0; i < 80 && !(g.match && g.match.practice && g.match.state === 'playing'); i++) await new Promise((r) => setTimeout(r, 250));
  // (?autopilot: the practising kid would paint on behind the front — it stands still for this)
  for (const a of g.match.actors) if (a.bot) a.bot.update = () => { a.intent.move.set(0, 0, 0); a.intent.fire = a.intent.sub = a.intent.special = a.intent.squid = false; };
  __G.projectiles.clear(); __G.subs.clear(); __G.specials.clear();
  g.debug.paintRandom(400);
  await new Promise((r) => setTimeout(r, 400));
  const had = inked();
  const first = g.api.practiceClearInk(), second = g.api.practiceClearInk();
  for (let i = 0; i < 60 && __G.paint.wiping; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 300));
  R('offline Practice: the wave clears the stage; a second one waits its turn', first === true && second === false && had > 500 && inked() === 0 && g.inkWipe.stats.waves >= 1, { had, after: inked(), first, second });
  return out;
})()
