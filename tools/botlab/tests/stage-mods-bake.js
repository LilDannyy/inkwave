// The AO bake's page code (tools/botlab/bake.cjs PAGE_BAKE, the same as build/bake-ao.cjs) with stage modules, on the
// test-only arena, at a tiny ray count:
//   MAP=testbox PAGE=tools/botlab/tests/stage-mods-bake.js PAGE_ARGS='old=.botlab/bake-old.cjs' tools/botlab/run.sh tools/botlab/page.cjs
// 1) No module: one pass, one channel; with old=<a copy of an older bake.cjs, served from the repo root> the bytes and the
//    hash equal that script's (git show 9f2cdef:tools/botlab/bake.cjs > .botlab/bake-old.cjs).
// 2) The dummy module (tests/stage-mods-dummy.js: W.bakePasses gives two world states): bakeMode on, each pass, one
//    channel each of an RGB image (the dummy's passes change nothing: R = G; the unused B stays 255), bakeMode off.
(async () => {
  const g = window.__inkwave, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const { MAP_LAYOUTS } = await import('./src/world/maps.js');
  const { DRESSING } = await import('./src/world/dressing.js');
  const dress = DRESSING.testbox || (DRESSING.testbox = []);
  const D = await import('./tools/botlab/tests/stage-mods-dummy.js');
  const dbg = g.debug;
  const waitPlaying = async () => { for (let i = 0; i < 240; i++) { if (g.match?.state === 'playing') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
  const restart = async () => { dbg.unfreeze?.(); g.worldKey = null; await g.api.startMatch({ mapId: 'testbox', duration: 180, mode: 'turf' }); const ok = await waitPlaying(); dbg.freeze(); return ok; };
  const bakeOf = async (url) => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const m = (await res.text()).match(/const PAGE_BAKE = \(o\) => (`[\s\S]*?`);\n/);
    return m ? (0, eval)('(o) => ' + m[1]) : null;
  };
  const O = { ppm: 4, size: 1024, rays: 12, dist: 3.5, floor: 0.65, strength: 0.9, gamma: 1.1 };
  const bytes = (b64) => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  const NEW = await bakeOf('./tools/botlab/bake.cjs');
  const oldPath = (/old=([^\s&]+)/.exec(window.__pageArgs || '') || [])[1];
  const OLD = oldPath ? await bakeOf('./' + oldPath) : null;
  R('the bake script\'s page code is found (and the old one, when asked)', NEW && (!oldPath || OLD), { oldPath, old: !!OLD });
  if (!NEW) return out;

  // ---- 1) no module: one pass, gray; identical to the old script's
  dbg.freeze();
  const a = await (0, eval)(NEW(O));
  const ab = bytes(a.png);
  R('no stage module: one trace, one channel (S × S bytes)', !__G.stageWorld && a.ch === 1 && ab.length === O.size * O.size, { ch: a.ch, n: ab.length });
  if (OLD) {
    const b = await (0, eval)(OLD(O));
    R('…byte for byte the old bake\'s (same hash, same pixels)', a.hash === b.hash && a.png === b.png, { hash: [a.hash, b.hash], same: a.png === b.png });
  }

  // ---- 2) the dummy: two world states → RGB, R = G, B unused (255); bakeMode round the passes
  D.installDummy(MAP_LAYOUTS.testbox, dress);
  const started = await restart();
  const W = __G.dummyWorld;
  if (!started || !W) { R('the dummy module is built for the bake', false, { started, W: !!W }); return out; }
  const n0 = W.calls.length;
  const c = await (0, eval)(NEW(O));
  const cb = bytes(c.png), N = O.size * O.size;
  let rg = 0, b255 = 0, lit = 0;
  for (let i = 0; i < N; i++) { if (cb[i * 3] === cb[i * 3 + 1]) rg++; if (cb[i * 3 + 2] === 255) b255++; if (cb[i * 3] < 255) lit++; }
  const seq = W.calls.slice(n0).join(' ');
  R('with a module\'s two world states: an RGB image (S × S × 3), one trace per state (R = G here), the unused channel 255, some texels occluded',
    c.ch === 3 && cb.length === N * 3 && rg === N && b255 === N && lit > 0, { ch: c.ch, n: cb.length, rg, b255, lit });
  R('…bakeMode on, then pass 1, pass 2, then bakeMode off', seq === 'bakeMode:true pass:1 pass:2 bakeMode:false', { seq });
  D.removeDummy(MAP_LAYOUTS.testbox, dress);
  await restart();
  R('the arena is back without the module', !__G.stageWorld && !g.match.stage);
  return out;
})();
