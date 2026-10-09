// [b5-subscaf] Batch 5's four new subs (Glide Bomb, Scrap Sentry, Chain Bobber, Dash Pellet) registered end to end
// before their builders start (tools/botlab/jobs/batch5/subs/SPEC.md), so no builder has to touch the shared points:
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-scaffold.js tools/botlab/run.sh tools/botlab/page.cjs
// Checks:
//  - SUB_ORDER only grew at its end (online records index into it): the old 15 in place, then glide, sentry, bobber, dash;
//  - the web of ids: every SUB_ORDER id has a SUBS entry (id, kind, name, blurb, ink cost), its own 64×64 icon, its own
//    model (getSubDef doesn't fall back to the Splat Bomb), a view scale, and a kit (or is one of the built-in kinds
//    subs.js / weapons.js run); nothing registered outside SUB_ORDER;
//  - the four carry the spec's names, blurbs, ink costs and view scales;
//  - each stub, equipped on the local kid: holding the button raises its placeholder model in the hand and the HUD badge
//    shows its icon; the release is refused through the runner's "Can't use" path (one 'sub:cantuse', the HUD callout
//    with its icon, no ink paid, nothing made, no 'sub:use', a console.warn '[<id>] not built yet'); a direct use()
//    refunds and refuses the same way; nothing throws;
//  - bots: their hooks never throw it, and 20 s of a live 4 v 4 on testbox with every bot on a stub makes no throw,
//    no refusal and no warning (no bot path presses a stub), and no exception.
// (Fails without the scaffold: the order, the web and the stubs' checks.)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug;
  const { SUBS, SUB_ORDER, SUB_VIEW_SCALE } = await import('./src/config.js');
  const { SUB_KITS } = await import('./src/game/kits/registry.js');
  const { SUB_ICONS } = await import('./src/ui/ui-icons.js');
  const { getSubDef, SUB_KINDS } = await import('./src/game/character-weapons.js');
  const { on } = await import('./src/core/ctx.js');
  const G = window.__G, P = G.projectiles, H = g.hud;
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const step = (n = 1) => { for (let i = 0; i < n; i++) dbg.step(1000 / 60); };
  const OLD = ['bomb', 'sticky', 'burst', 'shaker', 'seeker', 'waddle', 'torpedo', 'tracer', 'boomerang', 'scan', 'curtain', 'sprinkler', 'mine', 'beacon', 'mist'];
  const NEW = ['glide', 'sentry', 'bobber', 'dash'];
  // the kinds with no kit module: the Splat Bomb (weapons.js / projectiles) and subs.js's own
  const BUILTIN = new Set(['bomb', 'sticky', 'burst', 'seeker', 'scan', 'curtain', 'sprinkler', 'mine', 'beacon', 'mist']);
  const SPEC = {
    glide: { name: 'Glide Bomb', ink: 65, scale: 1.6, blurb: 'Slides straight along the floor, inking a lane and bouncing off walls, then blows when its fuse runs out. Hold to cook it: a shorter slide and a bigger blast.' },
    sentry: { name: 'Scrap Sentry', ink: 65, scale: 1.5, blurb: 'A turret built from junk. Set it down and for 15 s it shoots foes it can see with a little ink gun, until it\'s shot down. One at a time.' },
    bobber: { name: 'Chain Bobber', ink: 40, scale: 1.5, blurb: 'A floating bomb that tethers to your others close by. Your team\'s shots set the chain off; foes\' shots disarm it. The longer the chain, the bigger every blast. Throw as many as you like.' },
    dash: { name: 'Dash Pellet', ink: 55, scale: 2, blurb: 'Pops under your feet and blasts you a few metres the way you\'re steering, on the ground or in the air. Its blast hits anyone you leave behind.' },
  };
  // console.warn, recorded (and passed on)
  const warns = [], warn0 = console.warn;
  console.warn = function (...a) { warns.push(a.map(String).join(' ')); return warn0.apply(this, a); };
  const evs = [];
  const offs = ['sub:cantuse', 'sub:use', 'bomb:throw'].map((n) => on(n, (e) => evs.push({ n, kind: e.kind || null, nid: e.actor ? e.actor.nid : null, local: e.actor === m.local })));
  const me = m.local;
  const bots = m.actors.filter((a) => a.bot), freeBrains = () => { for (const a of bots) delete a.bot.update; };   // (back to the brain's own update)
  const subs0 = new Map(m.actors.map((a) => [a, a.subId]));
  dbg.freeze();
  try {
    // ---- 1. the order
    R('SUB_ORDER grew only at its end: the old 15 in place, then glide, sentry, bobber, dash (no repeats)',
      SUB_ORDER.slice(0, OLD.length).join() === OLD.join() && SUB_ORDER.slice(OLD.length).join() === NEW.join() && new Set(SUB_ORDER).size === SUB_ORDER.length, SUB_ORDER);

    // ---- 2. the web of ids
    const tmpl = document.createElement('template');
    const norm = (s) => { tmpl.innerHTML = String(s || '').trim(); return tmpl.innerHTML; };
    const rows = [], icons = new Map();
    for (const id of SUB_ORDER) {
      const s = SUBS[id], bad = [];
      if (!s || s.id !== id || s.kind !== id || !(typeof s.name === 'string' && s.name) || !(typeof s.blurb === 'string' && s.blurb.length > 20) || !(s.inkCost > 0 && s.inkCost <= 100)) bad.push('SUBS');
      const ic = SUB_ICONS[id];
      if (!(typeof ic === 'string' && /^<svg[^>]*viewBox="0 0 64 64"/.test(ic.trim()))) bad.push('icon');
      else { if (icons.has(norm(ic))) bad.push('icon shared with ' + icons.get(norm(ic))); icons.set(norm(ic), id); }
      let d = null; try { d = getSubDef(id); } catch (e) { bad.push('model threw ' + e.message); }
      if (d && !(SUB_KINDS.includes(id) && d.kind === id && d.body?.attributes?.position?.count > 0 && d.ink?.attributes?.position?.count > 0 && d.grip && d.handL && d.inHandL)) bad.push('model' + (d ? ` (kind ${d.kind})` : ''));
      if (!(SUB_VIEW_SCALE[id] > 0)) bad.push('view scale');
      if (BUILTIN.has(id) ? !!SUB_KITS[id] : typeof SUB_KITS[id]?.use !== 'function') bad.push('kit');
      rows.push(bad.length ? `${id}: ${bad.join(', ')}` : id);
    }
    const missing = rows.filter((r) => r.includes(':'));
    R(`every SUB_ORDER id (${SUB_ORDER.length}) has a SUBS entry, its own icon, its own model, a view scale and a kit (or is a built-in kind)`, missing.length === 0, { missing, ok: rows.filter((r) => !r.includes(':')).length });
    const strays = [...Object.keys(SUBS).filter((k) => !SUB_ORDER.includes(k)).map((k) => 'SUBS.' + k), ...Object.keys(SUB_KITS).filter((k) => !SUBS[k]).map((k) => 'SUB_KITS.' + k),
      ...Object.keys(SUB_VIEW_SCALE).filter((k) => !SUBS[k]).map((k) => 'SUB_VIEW_SCALE.' + k)];
    R('nothing registered outside SUB_ORDER (SUBS, SUB_KITS, SUB_VIEW_SCALE)', strays.length === 0, strays);

    // ---- 3. the spec's words and numbers
    const specBad = NEW.filter((id) => { const s = SUBS[id], w = SPEC[id]; return !s || s.name !== w.name || s.inkCost !== w.ink || s.blurb !== w.blurb || SUB_VIEW_SCALE[id] !== w.scale; });
    R('the four carry the spec\'s names, blurbs, ink costs (65 / 65 / 40 / 55 %) and view scales (1.6 / 1.5 / 1.5 / 2)', specBad.length === 0,
      { bad: specBad, have: NEW.map((id) => [id, SUBS[id]?.name, SUBS[id]?.inkCost, SUB_VIEW_SCALE[id]]) });
    R('the four kits are stubs (SUB_KITS[id].stub) whose bot hooks never throw them',
      NEW.every((id) => SUB_KITS[id]?.stub === true && SUB_KITS[id].bot?.fight?.(me.bot || {}, 8) === false && SUB_KITS[id].bot?.paint?.(me.bot || {}) === false), NEW.map((id) => [id, !!SUB_KITS[id]?.stub]));

    // ---- 4. each stub in the local kid's hands
    // every brain still (the local kid's too: page.cjs runs it on ?autopilot); the local kid's intent is ours
    let hold = false;
    for (const a of bots) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.jump = it.special = false; it.sub = a === me && hold; };
    const sameIcon = (el, id) => !!el && norm(el.innerHTML) === norm(SUB_ICONS[id]);
    for (const id of NEW) {
      me.setSub(id); me.ink = 90; hold = false;
      step(8);
      const n0 = { items: G.subs.items.length, bombs: P.bombs.length }, e0 = evs.length, w0 = warns.length;
      let err = null, mid = null, after = null;
      try {
        hold = true; step(14);
        mid = { aiming: !!me.weaponRunner.aimingSub, propKind: me.character.bomb?.kind || null, propOn: !!me.character.bomb?.group.visible, badge: H?.subBadge?.dataset.kind || null, badgeIcon: sameIcon(H?.sbIcon, id) };
        const inkBefore = me.ink;
        if (H) H._denyT = -1e9;   // (the callout ignores a second refusal within 140 ms of wall clock: the last stub's use() just now)
        hold = false; step(2);
        after = { inkBefore: +inkBefore.toFixed(2), ink: +me.ink.toFixed(2), deny: H?.denyIcon?._k || null, denyOn: !!H?.denyEl?.classList.contains('is-on'), denyIcon: sameIcon(H?.denyIcon, id) };
        step(10);
      } catch (e) { err = String(e && e.stack || e).slice(0, 300); }
      const ev = evs.slice(e0).filter((x) => x.local), ws = warns.slice(w0);
      const made = G.subs.items.length - n0.items + P.bombs.length - n0.bombs;
      R(`${id}: holding the button raises its placeholder model in the kid's hand; the HUD badge shows its icon`,
        !err && mid && mid.aiming && mid.propKind === id && mid.propOn && mid.badge === id && mid.badgeIcon, { err, mid });
      R(`${id}: the release is refused — one 'sub:cantuse' (the HUD callout with its icon), no ink paid, nothing made, no 'sub:use', a console.warn "[${id}] not built yet"`,
        !err && after && ev.filter((x) => x.n === 'sub:cantuse' && x.kind === id).length === 1 && !ev.some((x) => x.n !== 'sub:cantuse') && after.ink >= after.inkBefore - 0.01
        && after.deny === id && after.denyOn && after.denyIcon && made === 0 && ws.some((w) => w === `[${id}] not built yet`),
        { err, after, events: ev, made, warns: ws });
      // a caller that skips blocked(): use() refunds the ink it was paid and refuses the same way
      const e1 = evs.length; let err2 = null;
      me.ink = 90 - SUBS[id].inkCost;
      let ink2 = null;
      try { G.subs.use(me, SUBS[id]); ink2 = me.ink; step(2); } catch (e) { err2 = String(e && e.stack || e).slice(0, 300); }
      const ev2 = evs.slice(e1).filter((x) => x.local);
      R(`${id}: a direct use() refunds the ink and refuses ('sub:cantuse'), making nothing`,
        !err2 && Math.abs(ink2 - 90) < 1e-6 && ev2.length === 1 && ev2[0].n === 'sub:cantuse' && ev2[0].kind === id && G.subs.items.length === n0.items && P.bombs.length === n0.bombs,
        { err: err2, ink: ink2, events: ev2 });
    }

    // ---- 5. bots with stubs: a live fight
    m.actors.forEach((a, i) => a.setSub(NEW[i % NEW.length]));
    freeBrains();
    me.ink = 100;
    const e0 = evs.length, w0 = warns.length, n0 = { items: G.subs.items.length, bombs: P.bombs.length };
    let err = null, frames = 0;
    try { for (; frames < 1200; frames++) step(1); } catch (e) { err = String(e && e.stack || e).slice(0, 300); }
    const ev = evs.slice(e0).filter((x) => NEW.includes(x.kind)), ws = warns.slice(w0).filter((w) => /not built yet/.test(w));
    const splats = m.actors.reduce((s, a) => s + (a.stats?.splats || 0), 0);
    R('bots on stubs: 20 s of a live 4 v 4 — no stub thrown, refused or warned about (no bot path presses one), no exception',
      !err && frames === 1200 && ev.length === 0 && ws.length === 0, { err, frames, events: ev.slice(0, 6), warns: ws.slice(0, 3), subs: m.actors.map((a) => a.subId), splats, made: G.subs.items.length - n0.items + P.bombs.length - n0.bombs });
  } catch (e) {
    R('HARNESS', false, { error: String(e && e.stack || e).slice(0, 400) });
  } finally {
    console.warn = warn0;
    offs.forEach((f) => f());
    freeBrains();
    for (const [a, s] of subs0) a.setSub(s);
  }
  return out;
})();
