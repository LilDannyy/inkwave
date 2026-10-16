// Bluestone fix round 3 (scratch): where do the bots choose to go, and do they get there? An all-bot Turf War (180 s,
// stepped as match.cjs); every paint goal a bot picks is logged by region, then whether the bot reached it before it
// picked again, and the bot-seconds spent in each region. Read-only: the bots' code is wrapped, never changed.
//   PAGEQ=era=3 MAP=bluestone MODE=turf PAGE=…/goal-diag.js tools/botlab/run.sh tools/botlab/page.cjs
(async () => {
  const g = window.__inkwave, m = g.match, out = [];
  const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const LY = await import('./src/world/stages/bluestone/layout.js'), G = await import('./src/world/stages/bluestone/ground.js');
  const S65 = Math.sin(65 * Math.PI / 180), C65 = Math.cos(65 * Math.PI / 180), HS = LY.HOTEL_STAIR, TS = LY.TS;
  const inTS = (x, z) => { const [t, s] = LY.alFrame(x, z); return t > TS.t0 - 0.6 && t < TS.t1 && s > TS.s0 && s < TS.s1; };
  const region = (x, y, z) => {
    if (z > 0) { x = -x; z = -z; }
    const al = x * S65 + z * C65, off = -x * C65 + z * S65, r = Math.hypot(x, z);
    if (x > HS.x0 - 0.2 && x < HS.x1 + 0.2 && z > HS.zFoot - 0.8 && z < HS.zLand + 0.2 && y > 2.3) return 'halo';
    if (y > 4.5 && r < 16) return 'halo';
    if (y > 0.5 && G.inPoly(LY.YARD, x, z)) return 'garden';
    if (inTS(x, z) && y > 0.02) return 'garden';
    if (G.inPoly(LY.ALLEY.floor || LY.ALLEY.quad, x, z)) return 'alley';
    if (!G.inPoly(LY.OUTLINE, x, z) && (x > 20 || z > -8)) return 'river-works';
    if (r <= 20) return 'circus';
    if (Math.abs(off) <= 15 && al <= -20) return al < -40 ? 'arm-tip' : 'arm';
    if (z <= -50) return 'base';
    if (Math.abs(x) <= 7) return 'swimston';
    return x < 0 ? 'west' : 'east';
  };
  const bots = m.actors.filter((a) => a.bot), proto = Object.getPrototypeOf(bots[0].bot), orig = proto._pickPaintGoal;
  const picks = {}, reached = {}, open = new Map();
  proto._pickPaintGoal = function () {
    const prev = open.get(this);
    if (prev) { const a = this.a, n = G && __G.nav.nodes[prev.id]; const d = Math.hypot(a.pos.x - n.x, a.pos.z - n.z); if (d < 2.5) reached[prev.rg] = (reached[prev.rg] || 0) + 1; }
    const r = orig.apply(this, arguments);
    if (this.goal >= 0) { const n = __G.nav.nodes[this.goal], rg = region(n.x, n.y, n.z); picks[rg] = (picks[rg] || 0) + 1; open.set(this, { id: this.goal, rg }); }
    return r;
  };
  g.debug.freeze();
  const DT = 1 / 60; let t = 0; const time = {};
  while (m.state === 'playing' && t < 180) {
    for (let k = 0; k < 15; k++) { g._skipRender = true; try { g._frame(DT); } catch (e) { /* */ } } g._skipRender = false; t += 0.25;
    for (const a of bots) { if (a.dead) continue; const rg = region(a.pos.x, a.pos.y, a.pos.z); time[rg] = (time[rg] || 0) + 0.25; }
  }
  proto._pickPaintGoal = orig;
  const sort = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  R('paint goals picked by region (all 8 bots, 180 s)', true, sort(picks));
  R('goals reached before the next pick (within 2.5 m)', true, sort(reached));
  R('bot-seconds by region', true, sort(time));
  R('turf', true, { era: new URLSearchParams(location.search).get('era'), coverage: __G.paint.coverage ? __G.paint.coverage() : null });
  return out;
})();
