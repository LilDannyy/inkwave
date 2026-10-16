// The online match clock under lag (the final review 2's issue 1; src/net/netmatch.js _hostClock and src/game/match.js
// clockSlew, [b5-eras]): a follower's match clock only ever runs on — its HUD timer never shows a second again and the
// final countdown fires each second once, in order — and it still keeps the host's time.
//   CLIENTS=2 URLQ='netlag=150&netjitter=50' NET=tools/botlab/tests/net-clock.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   (the contract's lagged connection, as net-eras' lagged run; without URLQ the same checks on a clean link)
// A 1:30 Turf War on Halyard with no bots (the clock is shared code: every mode's follower timer goes through it). Each
// screen logs, per frame, its match clock with the wall clock (both clients run in this one process: one Date.now), each
// 'match:count' and each change of the HUD timer's text; the guest also logs each host clock tick it takes.
//   guest: its match clock never goes up from one frame to the next (the old rule stepped it halfway up past a 0.05 s band:
//          the review's probe saw 28 steps up in 76 s, 4 across a whole second);
//   guest: the HUD timer's second never goes up (0:36 → 0:37 → 0:36 was the symptom);
//   both:  the final countdown fires 10 … 1, each second once and in order — on the guest also after a host tick, injected
//          right after its 6, that says it is 0.3 s ahead (the old rule stepped back over the second: 7 and 6 again);
//   guest: its clock is the host's at the same wall time to within 0.15 s (median) and 0.25 s (90th percentile), from 5 s
//          in to the whistle (net-eras' thresholds for the stage clock)
module.exports = async ({ clients, R, wait, say, args }) => {
  const [A, B] = clients;
  const map = /map=(\w+)/.exec(args || '')?.[1] || 'halyard';
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const code = await A.js(`__G.net.create('Hosty')`);
  await A.js(`__G.net.setSettings({ mode: 'turf', map: ${JSON.stringify(map)}, time: 'day', duration: 90, botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await A.until(`__G.net.lobby.players.length === 2`, 20000);
  await B.js(`__G.net.setMe({ ready: true }); 1`).catch(() => 0);
  await A.until(`__G.net.canStart()`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 180000, 250);
  const RECORD = `import('./src/core/ctx.js').then((CTX) => {
    const m = __G.match, L = (window.__clk = { s: [], up: [], counts: [], hud: [], ticks: [] });
    let last = null;
    const u = m.update.bind(m);
    m.update = (dt) => {
      if (m.state === 'playing' && last !== null && m.time > last + 1e-9) L.up.push([+last.toFixed(4), +(m.time - last).toFixed(4), Date.now()]);
      u(dt);
      if (m.state === 'playing') { last = m.time; L.s.push([Date.now(), +m.time.toFixed(4)]); } else last = null;
    };
    CTX.on('match:count', ({ n }) => L.counts.push([n, +m.time.toFixed(3), Date.now()]));
    // (the guest: right after its 6, a host tick saying it is 0.3 s ahead — the review's case, made certain: the old rule
    //  stepped the clock up halfway, back over the second, and re-fired 7 and then 6)
    const N0 = __G.netm;
    if (N0 && !N0.isHost) { let done = false; CTX.on('match:count', ({ n }) => { if (n !== 6 || done) return; done = true; const b = m.time; N0._hostClock(['playing', +(m.time + 0.3 + N0._lead()).toFixed(3)]); L.inject = { before: +b.toFixed(4), after: +m.time.toFixed(4), slew: +(m.clockSlew || 0).toFixed(3) }; }); }
    const H = __G.hud;
    if (H && H._updTimer) { const ut = H._updTimer.bind(H); let tx = null; H._updTimer = (time) => { ut(time); const s = H.timerTxt && H.timerTxt.textContent; if (s && s !== tx) { tx = s; L.hud.push([s, Date.now()]); } }; }
    const N = __G.netm;
    if (N && !N.isHost) { const hc = N._hostClock.bind(N); N._hostClock = (arr) => { const b = m.time; hc(arr); L.ticks.push([+b.toFixed(4), +(m.time - b).toFixed(4), +(m.clockSlew || 0).toFixed(4), Date.now()]); }; }
    return 1; })`;
  for (const c of [A, B]) await c.js(RECORD);
  say(`playing a 1:30 Turf War on ${map} to the whistle…`);
  await B.until(`!__G.match || __G.match.state !== 'playing'`, 240000, 500);
  await A.until(`!__G.match || __G.match.state !== 'playing'`, 30000, 500);
  await wait(500);
  const g = await J(B, `window.__clk`), h = await J(A, `window.__clk`);

  // 1. the guest's clock never goes up
  R('guest: the match clock never goes up from one frame to the next (it gives time back by running slow)', g.up.length === 0 && g.s.length > 500,
    { frames: g.s.length, ups: g.up.length, upMax: g.up.length ? Math.max(...g.up.map((x) => x[1])) : 0, upSteps: g.up.slice(0, 20) });
  // 2. the HUD timer's second never goes up
  const sec = (s) => { const k = /^(\d+):(\d\d)$/.exec(s); return k ? +k[1] * 60 + +k[2] : null; };
  const hs = g.hud.map((x) => sec(x[0])).filter((v) => v !== null), back = [];
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1]) back.push([g.hud[i - 1][0], g.hud[i][0]]);
  R('guest: the HUD timer never shows a second again (each next second is lower)', back.length === 0 && hs.length > 60, { shown: hs.length, back, first: g.hud.slice(0, 3), lastShown: g.hud.slice(-12).map((x) => x[0]) });
  // 3. the final countdown: 10 … 1 once each, in order, on both screens
  const okCount = (c) => { const n = c.map((x) => x[0]); return n.length === 10 && n.every((v, i) => v === 10 - i); };
  R('both: the final countdown fires 10 … 1, each second once and in order — on the guest even after a host tick right after its 6 says it is 0.3 s ahead (its clock not stepped up)',
    okCount(g.counts) && okCount(h.counts) && !!g.inject && g.inject.after <= g.inject.before,
    { guest: g.counts.map((x) => x[0]), host: h.counts.map((x) => x[0]), inject: g.inject || null, skew: g.counts.map((x, i) => (h.counts[i] ? +((x[2] - h.counts[i][2]) / 1000).toFixed(3) : null)) });
  // 4. the guest keeps the host's time (at the same wall time; the host's series interpolated)
  const t0 = h.s.length ? h.s[0][0] + 5000 : 0, d = [];
  let k = 0;
  for (const [w, t] of g.s) {
    if (w < t0) continue;
    while (k + 1 < h.s.length && h.s[k + 1][0] < w) k++;
    const a = h.s[k], b = h.s[k + 1];
    if (!a || !b || a[0] > w || b[0] < w) continue;
    const ht = a[1] + (b[1] - a[1]) * ((w - a[0]) / Math.max(1, b[0] - a[0]));
    d.push(t - ht);   // (< 0: the guest ahead — less time left)
  }
  const ad = d.map(Math.abs).sort((x, y) => x - y), q = (p) => (ad.length ? +ad[Math.min(ad.length - 1, Math.floor(p * ad.length))].toFixed(3) : null);
  const mean = d.length ? +(d.reduce((s, v) => s + v, 0) / d.length).toFixed(3) : null;
  const ticks = g.ticks, fwd = ticks.filter((x) => x[1] < 0), slews = ticks.filter((x) => x[2] > 0), resync = ticks.filter((x) => x[1] > 0);
  // (the guest's frames over 1/24 s: the game clock advances at most 1/24 s a frame, so a stalled frame loses clock time)
  const lost = (s) => { let L = 0; for (let i = 1; i < s.length; i++) { const dw = (s[i][0] - s[i - 1][0]) / 1000; if (dw > 1 / 24) L += dw - 1 / 24; } return +L.toFixed(2); };
  R('guest: its clock is the host\'s at the same wall time (median < 0.15 s, p90 < 0.25 s)', ad.length > 500 && q(0.5) < 0.15 && q(0.9) < 0.25,
    { samples: ad.length, median: q(0.5), p90: q(0.9), max: q(1), meanSigned: mean, ticks: ticks.length, stepsForward: fwd.length, fwdMax: fwd.length ? Math.min(...fwd.map((x) => x[1])) : 0,
      slewTicks: slews.length, slewMax: slews.length ? Math.max(...slews.map((x) => x[2])) : 0, resyncs: resync.length, lostToStalls: { host: lost(h.s), guest: lost(g.s) } });
};
