// A remote player's special whose start record comes late, or never (batch 5 [b5-int1]): two real clients on the local
// relay (netpage.cjs), an online Practice with no bots. The other screen learns a special runs from two places: the
// owner's tick flag and the owner's start record. When the flag gets there first (or the record is lost), net/netmatch.js
// gives the remote player a stand-in special state until the record starts its ghost (specials.js _startGhost); the cue
// director (src/audio/cues.js) read that stand-in's numbers (s.def.moveSpeed …) and threw every frame: "Cannot read
// properties of undefined (reading 'moveSpeed')", seen by the Mac mini in four packages' online runs.
// Here the guest's screen holds the host's start records back: 'delay' (1.2 s, then lets them through) and 'drop'
// (never), for the Mega Stamp, the Kraken and the Bubble Blower. On the guest's screen: the stand-in shows up, its frames
// run on with no page error, a late record still starts the ghost, the stand-in goes with the flag, the console is clean.
//   CLIENTS=2 NET=tools/botlab/tests/net-late-special.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
//   (NET_ARGS='only=stamp,kraken' picks specials)
module.exports = async (ctx) => {
  const { clients, R, wait, say, args } = ctx;
  const [A, B] = clients;
  const J = async (c, code) => JSON.parse(await c.js(`JSON.stringify(${code})`));
  const only = (/only=([^;&]+)/.exec(args || '') || [])[1];
  const IDS = (only ? only.split(',') : ['stamp', 'kraken', 'blower']);
  for (const c of [A, B]) await c.js(`(() => { window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String((e.error && e.error.stack) || e.message).slice(0, 500))); return 1; })()`);
  const code = await A.js(`__G.net.create('Hosty')`);
  say('room', code);
  await A.js(`__G.net.setSettings({ mode: 'practice', map: 'saltpan', time: 'day', botCount: 0 }); 1`);
  await B.js(`__G.net.join(${JSON.stringify(code)}, 'Guesty').then(() => 1)`);
  await B.until(`__G.net.lobby.players.length === 2 && __G.net.lobby.mode === 'practice'`, 15000);
  await A.js(`__G.net.start()`);
  for (const c of [A, B]) await c.until(`__G.net.state === 'match' && __G.match && !__G.match.attract && __G.match.state === 'playing'`, 90000, 250);
  // the guest's ears on (the cue director runs only with an audio context: muted by the harness, still running)
  await B.js(`(() => { __G.audio?.init?.(); return 1; })()`);
  const ears = await B.until(`!!(__G.audio && __G.audio.ctx)`, 8000).catch(() => false);
  R('the guest\'s cue director is running (an audio context)', !!ears);
  // the guest's screen: hold back the host's special start records ([0, index] through the 'sp' kit record)
  await B.js(`(() => { const S = __G.specials, orig = S.netGhost;
    window.__hold = null; window.__held = []; window.__heldN = 0;
    S.netGhost = function (a, d) {
      if (window.__hold && a && !a.isLocal && Array.isArray(d) && d[0] === 0) { window.__heldN++; if (window.__hold === 'delay') window.__held.push([a, d]); return; }
      return orig.call(this, a, d);
    };
    window.__release = () => { const h = window.__held.splice(0); window.__hold = null; for (const [a, d] of h) orig.call(S, a, d); return h.length; };
    return 1; })()`);
  const him = `__G.match.actors.find((x) => x !== __G.match.local && !x.isBot)`;
  const hostIdle = () => A.js(`(() => { const me = __G.match.local; me.hp = 100; me.invuln = 9; return 1; })()`);
  for (const id of IDS) {
    for (const mode of ['delay', 'drop']) {
      await hostIdle();
      const errs0 = await B.js(`window.__errs.length`), log0 = B.log.length, t0 = await B.js(`__G.time`);
      await B.js(`(() => { window.__hold = ${JSON.stringify(mode)}; window.__held = []; window.__heldN = 0; return 1; })()`);
      // the host starts it for real (its own screen runs it, records its start, sets its tick flag)
      const ok = await A.js(`(() => { const me = __G.match.local; me.specialId = ${JSON.stringify(id)}; me.special = me.specialCost(); me._startSpecial(); return !!(me.specialActive && me.specialActive.id === ${JSON.stringify(id)}); })()`);
      // the guest's screen: the flag, no record → the stand-in
      await B.until(`(() => { const h = ${him}; return !!(h && h.specialActive && h.specialActive.id === ${JSON.stringify(id)}); })()`, 6000, 50).catch(() => null);
      const st = await J(B, `(() => { const h = ${him}, s = h && h.specialActive; return s ? { id: s.id, net: !!s.net, ghost: !!s.ghost, def: !!s.def, held: window.__heldN } : null; })()`);
      // ~1.2 s of frames with the stand-in (its cues gathered every frame), the host moving about in it
      await A.js(`(() => { const me = __G.match.local; me.vel.set(3, 0, 1); return 1; })()`);
      await wait(1200);
      let ghost = null;
      if (mode === 'delay') {
        const n = await B.js(`window.__release()`);
        await B.until(`(() => { const h = ${him}; return !!(h && h.specialActive && h.specialActive.ghost); })()`, 4000, 50).catch(() => null);
        ghost = await J(B, `(() => { const h = ${him}, s = h && h.specialActive; return { released: ${n}, ghost: !!(s && s.ghost), id: s && s.id }; })()`);
        await wait(600);
      } else await B.js(`(() => { window.__hold = null; return 1; })()`);
      // the host's special ends: the guest's stand-in / ghost goes with the flag (or its end record)
      await A.js(`(() => { const me = __G.match.local; if (me.specialActive) __G.specials.end(me, 'time'); return 1; })()`);
      await B.until(`(() => { const h = ${him}; return !!h && !h.specialActive; })()`, 6000, 100).catch(() => null);
      const after = await J(B, `(() => { const h = ${him}; return { gone: !!h && !h.specialActive, t: __G.time, errs: window.__errs.slice(${errs0}) }; })()`);
      const newLog = B.log.slice(log0).filter((l) => /TypeError|Cannot read|is not a function|undefined \(reading/.test(l));
      R(`${id} (${mode}): the host's special started on its own screen`, ok);
      R(`${id} (${mode}): the guest sees it from the tick flag alone — a stand-in, with its special's numbers`, !!st && st.net && !st.ghost && st.def && st.held >= 1, st);
      R(`${id} (${mode}): the guest's frames ran on through it with no page error`, after.errs.length === 0 && newLog.length === 0 && after.t - t0 > 1.0, { ran: +(after.t - t0).toFixed(2), errs: after.errs.slice(0, 2), log: newLog.slice(0, 2) });
      if (mode === 'delay') R(`${id} (delay): the late start record still starts the ghost over the stand-in`, !!ghost && ghost.ghost && ghost.id === id && ghost.released >= 1, ghost);
      R(`${id} (${mode}): the guest's copy goes when the host's special ends`, after.gone, { gone: after.gone });
      await wait(400);
    }
  }
  const bad = [...new Set(B.log)].filter((l) => /TypeError|Cannot read|undefined \(reading/.test(l));
  R('the guest\'s console: no TypeError / "Cannot read properties of undefined" all through', bad.length === 0, bad.slice(0, 3));
};
