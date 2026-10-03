// jump-ui (b5-jumpui, 2026-10-04: src/game/jumpMarks.js, src/ui/hud-jumps.js, styles/hud-jumps.css). The user asked:
// "Give an on screen alert when a teammate is jumping to you and their name, as well as a name around the super jump
// icon, and an indicator for when they're landing" and "if someone is using zipline or inkjet, add an indicator when
// they start using the special so players know where they'd super jump to, and where the player will jump back when
// it ends". Checked on the HUD the player actually sees (the DOM), from the local player's screen (you = team 0):
//   alert    a teammate super jumping to YOU: the alert with their name (and the chime); not for a teammate jumping to
//            someone else, nor for an enemy's jump. It counts down to 0 at their touchdown, then goes. A jump called off
//            (the jumper splatted mid-charge) takes its alert with it.
//   tags     the landing mark carries the jumper's name in the world view (over the spot), on the minimap (on the spot)
//            and on the TAB map (a pin on the spot). Each is placed where the mark is, to the pixel.
//   count    the landing indicator counts down: it starts at the time the jump really takes (charge + flight), never
//            goes up, and ends at touchdown. The tags go the frame they land.
//   foe      an enemy's landing mark: its ring and icon for you too, but no name or seconds
//   jetpack / zipline   the return mark: from the special's first frame (world tag, minimap tag, TAB-map pin, with the
//            user's name and the special's icon) until the user is back on it. It is still there through the special
//            and the jump home, counts down all the way, and is gone the frame they land.
//   land     a super jump to an Ink Jet / Zipline user lands at their return mark, not under them. That holds for you
//            and for a bot. The TAB map's jump arc to their pin aims at the mark too. A teammate jumping to you while
//            you're on Ink Jet: the alert still shows, and they land at your mark.
//   stack    two marks on one spot, seen by a third teammate (you): a teammate jumping to an Ink Jet user (it comes down
//            by their return mark), and two teammates jumping to one teammate; and the first again with the rest of the
//            squad standing round the spot, high on the screen. Both names show in the world view, on the minimap and on
//            the TAB map, and no two tags cover each other (their rings and labels, as drawn). In the world view each tag
//            is over its spot: on it when nothing is in the way, else straight up (or, where that would meet the top
//            middle: the top bar, the boss bar … , down) its column, resting on what it clears, no further (seat). On
//            the TAB map no label covers a pin (badge, stem, key, name) and no disc a zone / tower chip
//   pins     TAB map: a tag's label covers no pin (its badge, stem, key or name) nor a zone / tower chip, wherever the
//            jump comes down near them; a jump coming down on a chip puts its disc just beside the chip's text
//   size     on this window: the alert's lines and the minimap's names at 11 px or more (the game's floor, --fs-xs); a
//            far teammate's world tag shrinks, but its name no further than the teammates' own name tags (0.82×)
//   place    the alerts sit clear of everything at the top middle in this mode (the roster + timer, Zone Control's
//            chip, Tower Command's track, Boss Battle's health bar), of the TRACKED / POISONED badges, and of each other
//            (three at once); the streak callout, the zone callout, the one-minute banner and the last-ten count stay
//            clear of them while they're up (and go back after)
//   walls    the other team's world tag only where you could see its spot: behind a wall it is hidden (your own team's
//            still shows there)
//   MAP=testbox MODE=turf PAGE=tools/botlab/tests/jump-ui.js tools/botlab/run.sh tools/botlab/page.cjs
//   PAGE_ARGS='only=alert,tags,count,foe,jetpack,zipline,land,stack,pins,size,place,walls'   (MODE=zones / tower / boss too;
//   W=960 H=600 for a small window. Boss Battle: eight on one team and no foes, so foe / walls are skipped there)
(async () => {
  const g = window.__inkwave, m = g.match, dbg = g.debug, G = __G, THREE = await import('three');
  const { PLAYER } = await import('./src/config.js');
  const JM = await import('./src/game/jumpMarks.js');
  const { JUMP_UI } = await import('./src/ui/hud-jumps.js');
  const { on } = await import('./src/core/ctx.js');
  const out = []; const R = (name, ok, info) => out.push({ name, ok: !!ok, info: info === undefined ? undefined : JSON.parse(JSON.stringify(info)) });
  const ONLY = (/only=([\w,]+)/.exec(window.__pageArgs || '') || [])[1];
  const want = (k) => !ONLY || ONLY.split(',').includes(k);
  const r2 = (x) => Math.round(x * 100) / 100;
  dbg.freeze();
  const hud = g.hud, J = hud.jumps, boss = m.mode === 'boss';
  const me = m.local, mates = m.actors.filter((a) => a.team === me.team && a !== me), foes = m.actors.filter((a) => a.team !== me.team);
  R(`the stage (${m.mode}, ${innerWidth}×${innerHeight}): you and three teammates, four foes${boss ? ' (Boss Battle: seven teammates, the boss)' : ''}`, boss ? mates.length === 7 && foes.length === 0 && !!m.boss : mates.length === 3 && foes.length === 4, { mates: mates.length, foes: foes.length });
  // (Boss Battle: the boss stands still at the far end)
  if (boss && m.boss) { m.boss.brain.update = () => {}; m.boss.pos.set(0, 0, 40); m.boss.vel.set(0, 0, 0); }
  // brains: stand still (a._go: walk / steer that way)
  for (const a of m.actors) if (a.bot) a.bot.update = () => { const it = a.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; if (a._go) it.move.copy(a._go); };
  const keep = () => { for (const a of m.actors) { if (!a.alive) a.respawn(); a.invuln = 99; a.hp = PLAYER.hp; } };
  let pitch = -0.12;   // (the camera's: a scene may look further down)
  const aim = () => { g.rig.yaw = 0; g.rig.pitch = pitch; me.aimYaw = me.yaw = 0; me.aimPitch = pitch; };
  const frame = () => { aim(); dbg.step(1000 / 60); };
  const step = (s) => { for (let i = 0, n = Math.max(1, Math.round(s * 60)); i < n; i++) frame(); };
  const put = (a, x, z) => { a.pos.set(x, 0.02, z); a.vel.set(0, 0, 0); a.yaw = a.aimYaw = 0; a.grounded = true; a.form = 'kid'; a.netTp = (a.netTp || 0) + 1; };
  // you at the back facing +z (the camera behind you looks down the deck); teammates ahead, foes far off
  const stage = () => { put(me, 0, -26); put(mates[0], -9, -10); put(mates[1], 9, -6); put(mates[2], 0, 4); foes.forEach((f, i) => put(f, -12 + i * 8, 30)); mates.slice(3).forEach((a, i) => put(a, -24 + i * 3, -36)); };
  const reset = () => {
    keep(); for (const a of m.actors) if (a.specialActive) G.specials.end(a, 'test');
    G.specials.clear(); G.projectiles.clear(); G.subs.clear();
    for (const a of m.actors) { a.specialActive = null; a.superJumpState = null; a._go = null; a.special = 0; }
    m.controller = null; pitch = -0.12;
    stage(); step(0.6);
  };
  // what the player sees: visible DOM tags / alerts
  const vis = (el) => el && el.style.display !== 'none';
  const tagsIn = (layer) => (layer ? [...layer.querySelectorAll('.iw-jt')].filter((el) => vis(el) && !el.classList.contains('is-occl')).map((el) => ({ el, name: el.querySelector('.iw-jt__name').textContent, sec: el.querySelector('.iw-jt__sec').textContent, ko: +(el.querySelector('.f').style.strokeDashoffset || 0), cls: el.className, xy: xy(el) })) : []);
  const xy = (el) => { const q = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform || ''); return q ? [+q[1], +q[2]] : null; };
  const world = () => tagsIn(J.wLayer), mapT = () => tagsIn(J.mLayer), dioT = () => tagsIn(g.diorama?.el.querySelector('.iw-dio__jts'));
  const alerts = () => [...J.aLayer.querySelectorAll('.iw-jal__i:not(.is-out)')].map((el) => ({ name: el.querySelector('.iw-jal__name').textContent, text: el.textContent, sec: el.querySelector('.iw-jal__sec').textContent }));
  const markOf = (a, kind) => JM.landingMarks().find((r) => r.actor === a && r.kind === kind) || null;
  const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(G.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (0.5 - v.y * 0.5) * innerHeight]; };
  const near2 = (a, b, tol = 2.5) => !!(a && b) && Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
  const mapXY = (r) => { const mm = G.game.minimap, t = mm.toCanvas(r.x, r.z, { x: 0, y: 0 }); return [t.x / mm.w * parseFloat(hud.map.style.width), t.y / mm.h * parseFloat(hud.map.style.height)]; };
  // the TAB map: the player controller's map key held (the autopilot has no controller: a stand-in that only holds it)
  const openTab = () => { m.controller = { mapHeld: true, enabled: true, update() {}, computeAim() {} }; for (let i = 0; i < 60 && (g.rig.mapK || 0) < 1; i++) frame(); };
  const closeTab = () => { m.controller = null; for (let i = 0; i < 60 && (g.rig.mapK || 0) > 0; i++) frame(); };
  // sounds and landings
  const played = []; const play0 = G.audio.play.bind(G.audio); G.audio.play = (n, o) => { played.push(n); return play0(n, o); };
  const lands = []; on('superjump:land', (e) => lands.push({ a: e.actor, t: G.time, pos: e.pos.clone() }));
  const landed = (a) => lands.some((l) => l.a === a);
  const until = (fn, s = 6) => { for (let i = 0; i < s * 60; i++) { if (fn()) return true; frame(); } return !!fn(); };
  const start = (a, id, dur) => { a.specialId = id; a.special = a.specialCost(); a._startSpecial(); if (dur && a.specialActive) a.specialActive.dur = dur; return a.specialActive; };

  // ------------------------------------------------------------------------------------------------ boxes as drawn
  const rect = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const shown = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 0.5 && b.height > 0.5; };
  const hitB = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const rb = (b) => b && [Math.round(b.l), Math.round(b.t), Math.round(b.r), Math.round(b.b)];
  const union = (els) => { let o = null; for (const e of els) { if (!shown(e) || getComputedStyle(e).opacity === '0') continue; const b = rect(e); o = o ? { l: Math.min(o.l, b.l), t: Math.min(o.t, b.t), r: Math.max(o.r, b.r), b: Math.max(o.b, b.b) } : b; } return o; };
  // a tag's ring (unless hidden) and its label (when it has a name)
  const tagBoxes = (t) => { const o = [], ring = t.el.querySelector('.iw-jt__ring'), lab = t.el.querySelector('.iw-jt__tag'); if (shown(ring)) o.push({ k: 'ring', ...rect(ring) }); if (t.name && shown(lab)) o.push({ k: 'label', ...rect(lab) }); return o; };
  const clashes = (ts, extra = []) => {
    const out = [], all = ts.map((t) => [t.name || '?', tagBoxes(t)]).concat(extra);
    // (each tag against the others and the extras; extras against each other are not ours: teammates' tags overlap)
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < all.length; j++) for (const a of all[i][1]) for (const b of all[j][1]) if (hitB(a, b)) out.push(`${all[i][0]}.${a.k} × ${all[j][0]}.${b.k}`);
    return out;
  };
  // the TAB map's pins as drawn: badge, key, name
  // (the badge settled — its scale glides in as the map opens — and with its outline, a box-shadow of .36 u / .42 u yours)
  // (and its stem, from the badge down to the spot, with its 1.5 px outline)
  const pinRects = () => [...(g.diorama?.el.querySelectorAll('.iw-pin') || [])].filter(vis).flatMap((p) => ['.iw-pin__badge', '.iw-pin__key', '.iw-pin__name', '.iw-pin__stem'].map((q) => p.querySelector(q))
    .filter((e) => e && shown(e)).map((e) => {
      const badge = e.classList.contains('iw-pin__badge'), u = Math.min(innerWidth / 100, innerHeight * 1.7778 / 100), o = badge ? (p.classList.contains('iw-pin--self') ? 0.42 : 0.36) * u : e.classList.contains('iw-pin__stem') ? 1.5 : 0;
      if (badge) e.style.transition = 'none';
      const b = rect(e);
      if (badge) e.style.transition = '';
      return { k: e.className.replace('iw-pin__', '') + (e.classList.contains('iw-pin__name') ? ':' + e.textContent : ''), l: b.l - o, t: b.t - o, r: b.r + o, b: b.b + o };
    }));
  // (and Zone Control's zone chips / Tower Command's tower chip)
  const chipRects = () => [...(g.diorama?.el.querySelectorAll('.iw-dio-z') || [])].filter(vis).map((e) => e.querySelector('.iw-dio-z__tag')).filter(shown).map((e) => ({ k: 'chip:' + e.textContent, ...rect(e) }));
  // a disc over a zone / tower chip's text
  const discChip = (ts) => { const C = chipRects(), out = []; for (const t of ts) { const ring = t.el.querySelector('.iw-jt__ring'); if (!shown(ring)) continue; const b = rect(ring); for (const q of C) if (hitB(b, q)) out.push(`${t.name || 'foe'} disc × ${q.k}`); } return out; };
  // a TAB-map disc on its spot (within 2.5 px); or, where a zone / tower chip's text is there, slid just clear of the
  // chip (its ring off it, no further than two disc widths)
  const dioSpot = (t, at) => {
    if (!t || !at) return { ok: false };
    const u = Math.min(innerWidth / 100, innerHeight * 1.7778 / 100), R = 0.83 * 2.1 * u, D = 2 * R + 0.35 * u, off = Math.hypot(t.xy[0] - at[0], t.xy[1] - at[1]);
    const chip = chipRects().filter((q) => hitB(grow({ l: at[0] - R, t: at[1] - R, r: at[0] + R, b: at[1] + R }, 6), q)).map((q) => q.k);
    return { ok: off <= 2.5 || (chip.length > 0 && discChip([t]).length === 0 && off <= 2 * D), off: r2(off), chip };
  };
  const pinClash = (ts) => { const P = pinRects().concat(chipRects()), out = []; for (const t of ts) { const lab = t.el.querySelector('.iw-jt__tag'); if (!t.name || !shown(lab)) continue; const b = rect(lab); for (const q of P) if (hitB(b, q)) out.push(`${t.name} × pin ${q.k}`); } return out; };
  const allyTag = (a) => { const e = [...hud.markerLayer.querySelectorAll('.iw-mk')].find((x) => x.style.display !== 'none' && x.querySelector('.iw-mk__tag b').textContent === a.name); return e ? [[a.name + '(ally tag)', [{ k: 'tag', ...rect(e.querySelector('.iw-mk__tag')) }]]] : []; };

  // what hangs at the top middle, as drawn: the roster + timer, the mode's chip / track, the boss bar and emblem, the
  // status badges, the LEAD tags (and with topMiddle(): the alerts' pills)
  const furn = () => [['top bar', hud.top], ['zone chip', hud.zo], ['tower track', hud.tw], ['boss bar', hud.boss && hud.boss.bar], ['boss emblem', hud.boss && hud.boss.emb],
    ...[...hud.statusEl.children].map((e) => [e.textContent, e]), ...[...hud.el.querySelectorAll('.iw-lead.is-on .iw-lead__tag')].map((e) => ['LEAD', e])]
    .filter(([, e]) => e && shown(e)).map(([k, e]) => ({ k, ...rect(e) }));
  const topMiddle = () => furn().concat([...J.aLayer.querySelectorAll('.iw-jal__i')].filter(shown).map((e) => ({ k: 'alert', ...rect(e) })));
  // the teammates' name tags on screen, as drawn (with the pointer under each)
  const allyRects = () => [...hud.markerLayer.querySelectorAll('.iw-mk')].filter((e) => e.style.display !== 'none' && !e.classList.contains('is-off'))
    .map((e) => { const b = rect(e.querySelector('.iw-mk__tag')); return { k: 'tag:' + e.querySelector('.iw-mk__tag b').textContent, ...b, b: b.b + 6 }; });
  // a world tag as drawn: its ring and (when named) its label
  const tagRect = (t) => union([t.el.querySelector('.iw-jt__ring'), t.el.querySelector('.iw-jt__tag')]);
  const grow = (b, e) => ({ l: b.l - e, t: b.t - e, r: b.r + e, b: b.b + e });
  // A world tag "over its spot" (want: the spot + JUMP_UI.lift on screen). Nothing in the way there (a teammate's name
  // tag, another jump tag, the top middle): on it, within 2.5 px. Something in the way: moved straight up or down its
  // column (x within 2.5 px), covering none of them, resting just above / below one (within 9 px: the gap, the ring's
  // beat), and moved no further than the tag's own height plus those in its column between the spot and where it is.
  const seat = (t, want) => {
    const tb = t && tagRect(t);
    if (!tb || !want) return { ok: false, why: 'missing' };
    const dx = t.xy[0] - want[0], dy = t.xy[1] - want[1];
    const ub = { l: tb.l - dx, t: tb.t - dy, r: tb.r - dx, b: tb.b - dy };
    const O = allyRects().concat(world().filter((o) => o.el !== t.el).map((o) => ({ k: 'jump:' + (o.name || 'foe'), ...tagRect(o) })).filter((o) => o.l !== undefined), topMiddle());
    const hx = (o) => o.l < tb.r && tb.l < o.r;
    const near = O.filter((o) => hitB(grow(ub, 8), o)).map((o) => o.k), over = O.filter((o) => hitB(tb, o)).map((o) => o.k);
    const rests = O.filter((o) => hx(o) && (dy < 0 ? o.t - tb.b > -0.5 && o.t - tb.b < 9 : tb.t - o.b > -0.5 && tb.t - o.b < 9)).map((o) => o.k);
    const lo = Math.min(tb.t, ub.t), hi = Math.max(tb.b, ub.b);
    const bound = (tb.b - tb.t) + O.filter((o) => hx(o) && o.b > lo && o.t < hi).reduce((a, o) => a + (o.b - o.t) + 9, 0) + 2.5;
    const ok = Math.abs(dx) <= 2.5 && over.length === 0 && (Math.abs(dy) <= 2.5 || (near.length > 0 && rests.length > 0 && Math.abs(dy) <= bound));
    return { ok, dx: r2(dx), dy: r2(dy), near, over, rests, bound: r2(bound) };
  };

  // ------------------------------------------------------------------------------------------------ alert
  if (want('alert')) {
    reset(); played.length = 0; lands.length = 0;
    R('no alert while nobody is jumping', alerts().length === 0, alerts());
    const A = mates[0];
    const okJ = A.superJump(me);
    frame();
    let al = alerts();
    R('a teammate super jumps to you: the alert with their name, "is jumping to you!"', okJ && al.length === 1 && al[0].name === A.name && /is jumping to you/i.test(al[0].text), al);
    R('…its landing by you: no world tag (the alert says it), but the minimap\'s', !world().some((t) => t.name === A.name) && mapT().some((t) => t.name === A.name), { world: world().map((t) => t.name), map: mapT().map((t) => t.name) });
    R('…with its chime (sj_incoming), once', played.filter((n) => n === 'sj_incoming').length === 1, played.filter((n) => n.startsWith('sj') || n === 'super_jump'));
    // a teammate jumping to another teammate, and an enemy jumping: no alert on your screen
    mates[1].superJump(mates[2]); if (foes.length) foes[0].superJump(foes[1]);
    frame();
    al = alerts();
    R('a teammate jumping to another teammate, or an enemy jumping, gives you no alert', al.length === 1 && al[0].name === A.name, al);
    // it counts down to touchdown and goes when they land
    const secs = [];
    let landSec = null;
    for (let i = 0; i < 4 * 60 && !landed(A); i++) { const a = alerts().find((x) => x.name === A.name); if (a) secs.push(+a.sec); frame(); }
    landSec = secs[secs.length - 1];
    const mono = secs.every((s, i) => i === 0 || s <= secs[i - 1] + 1e-9);
    R('the alert counts down (seconds never go up) to ~0 at their touchdown', landed(A) && mono && secs.length > 20 && landSec <= 0.1, { first: secs[0], last: landSec, n: secs.length, landed: landed(A) });
    step(0.45);
    R('…and is gone once they have landed', alerts().length === 0 && J.aLayer.querySelectorAll('.iw-jal__i').length === 0, alerts());
    // a jump called off: the jumper splatted mid-charge
    reset();
    mates[0].invuln = 0; mates[0].superJump(me); frame();
    const had = alerts().length === 1;
    mates[0].splat(null, 'test'); step(0.45);
    R('a jump called off (the jumper splatted mid-charge): its alert goes', had && alerts().length === 0, { had, now: alerts() });
    keep();
  }

  // ------------------------------------------------------------------------------------------------ named tags
  if (want('tags')) {
    reset();
    const A = mates[1], T = mates[2];
    A.superJump(T); step(0.25);
    const r = markOf(A, 'jump');
    const w = world().find((t) => t.name === A.name), mp = mapT().find((t) => t.name === A.name);
    const wAt = r && proj(r.x, r.y + JUMP_UI.lift, r.z);
    // (it lands 1.1 m from T, so the tag stacks above T's own name tag: straight up from the spot, never over it)
    const mkT = [...hud.markerLayer.querySelectorAll('.iw-mk')].find((e) => e.style.display !== 'none' && e.querySelector('.iw-mk__tag b').textContent === T.name);
    const tagBox = w && w.el.querySelector('.iw-jt__tag').getBoundingClientRect(), discBox = w && w.el.querySelector('.iw-jt__disc').getBoundingClientRect(), tBox = mkT && mkT.querySelector('.iw-mk__tag').getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const st0 = seat(w, wAt);
    R('world view: the landing mark carries the jumper\'s name, over the spot (on it, or resting on what it clears)', !!r && !!w && st0.ok, { mark: r && [r2(r.x), r2(r.y), r2(r.z)], tag: w && w.xy, want: wAt && wAt.map(r2), seat: st0 });
    R('…stacked clear of the name tag of the teammate it lands by', !!w && !!tBox && !hit(tagBox, tBox) && !hit(discBox, tBox), { tag: tagBox && [r2(tagBox.top), r2(tagBox.bottom)], disc: discBox && [r2(discBox.top), r2(discBox.bottom)], ally: tBox && [r2(tBox.top), r2(tBox.bottom)] });
    R('…with the super-jump glyph and the countdown ring', !!w && !!w.el.querySelector('.iw-jt__icon svg') && w.ko >= 0 && w.ko < 100 && /\d/.test(w.sec), w && { sec: w.sec, ko: w.ko });
    R('minimap: the jumper\'s name on the landing spot', !!r && !!mp && near2(mp.xy, mapXY(r), 1.5), { tag: mp && mp.xy, want: r && mapXY(r).map(r2) });
    step(4);
    // the TAB map: open it, then a jump
    reset(); openTab();
    R('the TAB map opens (the diorama)', (g.rig.mapK || 0) >= 1, { mapK: g.rig.mapK });
    A.superJump(T); for (let i = 0; i < 15; i++) frame();
    const r3 = markOf(A, 'jump'), d = dioT().find((t) => t.name === A.name);
    const ds = dioSpot(d, r3 && proj(r3.x, r3.y + 0.08, r3.z));
    R('TAB map: the jumper\'s name on the landing spot (or just clear of a zone / tower chip there)', !!r3 && !!d && ds.ok, { tag: d && d.xy, want: r3 && proj(r3.x, r3.y + 0.08, r3.z).map(r2), ...ds });
    J.wLayer.style.transition = 'none';   // (its CSS fade runs on composited frames, which the stepped sim holds back)
    const wOp = getComputedStyle(J.wLayer).opacity;
    J.wLayer.style.transition = '';
    R('…the world tags step aside while the map is up (it has its own pins)', document.body.classList.contains('iw-dio-on') && wOp === '0', { opacity: wOp });
    closeTab(); step(3);
  }

  // ------------------------------------------------------------------------------------------------ countdown
  if (want('count')) {
    reset(); lands.length = 0;
    const A = mates[0], T = mates[2];
    const t0 = G.time;
    A.superJump(T); frame();
    const first = markOf(A, 'jump'), firstLeft = first ? first.left + 1 / 60 : null;
    const S = [];
    for (let i = 0; i < 4 * 60 && !landed(A); i++) {
      const w = world().find((t) => t.name === A.name), mp = mapT().find((t) => t.name === A.name);
      S.push({ w: w ? +w.sec : null, ko: w ? w.ko : null, map: !!mp });
      frame();
    }
    const took = landed(A) ? lands.find((l) => l.a === A).t - t0 : null;
    const ws = S.filter((s) => s.w != null).map((s) => s.w), kos = S.filter((s) => s.ko != null).map((s) => s.ko);
    R('the indicator starts at the time the jump really takes (charge + flight, within 0.1 s)', took != null && Math.abs(firstLeft - took) < 0.1, { predicted: firstLeft && r2(firstLeft), took: took && r2(took) });
    R('it counts down every frame (never up), the ring draining toward empty', ws.every((s, i) => !i || s <= ws[i - 1] + 1e-9) && kos.every((k, i) => !i || k >= kos[i - 1] - 0.05) && kos[0] < 3 && kos[kos.length - 1] > 90, { secs: [ws[0], ws[ws.length - 1]], ring: [kos[0], kos[kos.length - 1]], n: ws.length });
    R('…shown on the world tag and the minimap the whole way', S.length > 20 && S.every((s) => s.w != null && s.map), { frames: S.length, missing: S.filter((s) => s.w == null || !s.map).length });
    R('…reaching ~0 at touchdown', ws.length && ws[ws.length - 1] <= 0.1, { last: ws[ws.length - 1] });
    R('the tags go the frame they land', landed(A) && !world().some((t) => t.name === A.name) && !mapT().some((t) => t.name === A.name), { world: world().map((t) => t.name), map: mapT().map((t) => t.name) });
  }

  // ------------------------------------------------------------------------------------------------ enemy marks
  if (want('foe') && foes.length) {
    reset();
    const F = foes[0];
    put(F, 4, 14); F.superJump(foes[1]);
    // (foes[1] somewhere you can see: on the deck ahead)
    put(foes[1], -4, 10);
    step(0.3);
    const r = markOf(F, 'jump');
    const w = world().find((t) => /is-foe/.test(t.cls)), mp = mapT().find((t) => /is-foe/.test(t.cls));
    // over its spot: on it, or moved only to clear a teammate's name tag it would cover (on a small window a teammate a
    // few metres nearer on that line has its name tag there: hud-jumps.js stacks the tag above it, as in 'tags')
    const fWant = r && proj(r.x, r.y + JUMP_UI.lift, r.z), fs = seat(w, fWant);
    R('an enemy\'s landing mark: ring + icon in the world (over its spot, on no teammate\'s name tag) and on the minimap', !!r && !!w && !!mp && fs.ok,
      { w: w && w.xy, want: fWant && fWant.map(r2), seat: fs, mp: !!mp });
    R('…but no name or seconds for you (the jumper\'s own team only)', !!w && !w.name && getComputedStyle(w.el.querySelector('.iw-jt__tag')).display === 'none' && !!mp && !mp.name, { w: w && w.name, mp: mp && mp.name });
    step(3);
  }

  // ------------------------------------------------------------------------------------------------ Ink Jet / Zipline return marks
  const returnScene = (id, label) => {
    reset(); lands.length = 0;
    const U = mates[2];
    const t0 = G.time, origin = U.pos.clone();
    const s = start(U, id, 3.2);   // (a shorter special: the same rules, a quicker test)
    frame();
    const mk = G.specials.world.find((w) => w.kind === 'return' && w.owner === U);
    const w0 = world().find((t) => t.name === U.name && /is-return/.test(t.cls)), m0 = mapT().find((t) => t.name === U.name && /is-return/.test(t.cls));
    R(`${label}: the return mark is up from the special's first frame (at the take-off spot)`, !!s && !!mk && mk.pos.distanceTo(origin) < 0.3, { mk: !!mk });
    // (the user still stands on it at first: the world tag stacks straight up above their own name tag)
    const wAt0 = mk && proj(mk.pos.x, mk.pos.y + JUMP_UI.lift, mk.pos.z), mAt0 = mk && mapXY(mk.pos);
    const s0 = seat(w0, wAt0);
    R(`${label}: …in the world (the user's name, the special's icon) and on the minimap`, !!w0 && !!m0 && s0.ok && near2(m0.xy, mAt0, 1.5) && !!w0.el.querySelector('.iw-jt__icon svg'), { w: w0 && w0.xy, wWant: wAt0 && wAt0.map(r2), seat: s0, m: m0 && m0.xy, mWant: mAt0 && mAt0.map(r2) });
    R(`${label}: …the tag stands in for the beacon's own icon badge (hidden; its ring and pillar stay)`, !!mk && mk.badge.visible === false && mk.ring.visible !== false && mk.pillar.visible !== false, { badge: mk && mk.badge.visible });
    // the user moves off (Ink Jet: hovers out; Zipline: walks), the special runs out, they jump home
    U._go = new THREE.Vector3(1, 0, 0.35).normalize();
    const S = [];
    let gone = null;
    for (let i = 0; i < 8 * 60; i++) {
      if (G.time - t0 > 1.6) U._go = null;
      const w = world().find((t) => t.name === U.name && /is-return/.test(t.cls)), mp = mapT().find((t) => t.name === U.name && /is-return/.test(t.cls));
      S.push({ w: w ? +w.sec : null, ko: w ? w.ko : null, mp: !!mp, sj: U.superJumpState ? U.superJumpState.phase : '', home: /is-home/.test(w ? w.cls : '') });
      if (landed(U)) { gone = !w && !mp; break; }
      frame();
    }
    const L = lands.find((l) => l.a === U);
    const shown = S.slice(0, -1);
    const ws = shown.filter((x) => x.w != null).map((x) => x.w);
    R(`${label}: the mark stays up through the special and the jump home (every frame, world + minimap)`, !!L && shown.length > 60 && shown.every((x) => x.w != null && x.mp) && shown.some((x) => x.sj === 'flight' && x.home), { frames: shown.length, missing: shown.filter((x) => x.w == null || !x.mp).length, flew: shown.some((x) => x.sj === 'flight') });
    R(`${label}: its countdown runs down through the special and the flight home, to ~0`, ws.length > 60 && ws.every((v, i) => !i || v <= ws[i - 1] + 1e-9) && ws[ws.length - 1] <= 0.15, { first: ws[0], last: ws[ws.length - 1] });
    R(`${label}: the user lands on it, and the mark is gone that frame`, !!L && Math.hypot(L.pos.x - origin.x, L.pos.z - origin.z) < 1.2 && gone === true, { land: L && [r2(L.pos.x), r2(L.pos.z)], origin: [r2(origin.x), r2(origin.z)], gone });
    void s;
  };
  if (want('jetpack')) returnScene('jetpack', 'Ink Jet');
  if (want('zipline')) returnScene('zipcaster', 'Zipline');
  // the TAB map shows the return mark as a pin with the name
  if (want('jetpack') || want('zipline')) {
    reset(); openTab();
    const U = mates[1];
    start(U, 'zipcaster');
    for (let i = 0; i < 10; i++) frame();
    const mk = G.specials.world.find((w) => w.kind === 'return' && w.owner === U), d = dioT().find((t) => t.name === U.name && /is-return/.test(t.cls));
    const ds = dioSpot(d, mk && proj(mk.pos.x, mk.pos.y + 0.08, mk.pos.z));
    R('TAB map: the return mark with the user\'s name, on the spot (or just clear of a zone / tower chip there)', !!mk && !!d && ds.ok, { tag: d && d.xy, want: mk && proj(mk.pos.x, mk.pos.y + 0.08, mk.pos.z).map(r2), ...ds });
    closeTab();
  }

  // ------------------------------------------------------------------------------------------------ jumping to an Ink Jet / Zipline user
  if (want('land')) {
    for (const [id, label] of [['jetpack', 'Ink Jet'], ['zipcaster', 'Zipline']]) {
      reset(); lands.length = 0;
      const U = mates[2], origin = U.pos.clone();
      start(U, id, 12);   // (long enough for both jumps to it)
      U._go = new THREE.Vector3(1, 0, 0); step(1.4); U._go = null; step(0.2);
      const mk = G.specials.world.find((w) => w.kind === 'return' && w.owner === U);
      const away = Math.hypot(U.pos.x - origin.x, U.pos.z - origin.z);
      // you jump to them (the TAB map's arc first: hovering their pin aims at the mark)
      openTab();
      const dio = g.diorama, pins = dio.pins, k = m.actors.filter((o) => o.team === me.team && o !== me).indexOf(U), pin = pins[k];
      let arcEnd = null;
      if (pin && pin.vis) {
        dio.hasCursor = true;
        for (let i = 0; i < 4; i++) { dio.cx = pin.x / innerWidth; dio.cy = (pin.y - 34) / innerHeight; frame(); }
        const dd = dio.arc.firstChild.getAttribute('d') || '', q = /Q[-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+)/.exec(dd);
        arcEnd = q ? [+q[1], +q[2]] : null;
      }
      const markScr = mk && proj(mk.pos.x, mk.pos.y + 0.1, mk.pos.z);
      R(`${label}: the TAB map's jump arc to their pin aims at their return mark (not at them, ${r2(away)} m off)`, away > 4 && near2(arcEnd, markScr, 3) && !near2(arcEnd, [pin.x, pin.y], 20), { arcEnd, mark: markScr && markScr.map(r2), pin: pin && [r2(pin.x), r2(pin.y)] });
      closeTab();
      const okMe = me.superJump(U);
      until(() => landed(me), 5);
      const Lm = lands.find((l) => l.a === me);
      R(`${label}: you super jump to the user and land at their return mark`, okMe && !!Lm && !!mk && Math.hypot(Lm.pos.x - mk.pos.x, Lm.pos.z - mk.pos.z) < 1.6 && Math.hypot(Lm.pos.x - U.pos.x, Lm.pos.z - U.pos.z) > 2.5, { land: Lm && [r2(Lm.pos.x), r2(Lm.pos.z)], mark: mk && [r2(mk.pos.x), r2(mk.pos.z)], user: [r2(U.pos.x), r2(U.pos.z)] });
      // and a bot
      const B = mates[0];
      const okB = B.superJump(U);
      until(() => landed(B), 5);
      const Lb = lands.find((l) => l.a === B);
      R(`${label}: a bot jumping to them lands at the mark too`, okB && !!Lb && !!mk && Math.hypot(Lb.pos.x - mk.pos.x, Lb.pos.z - mk.pos.z) < 1.6, { land: Lb && [r2(Lb.pos.x), r2(Lb.pos.z)], mark: mk && [r2(mk.pos.x), r2(mk.pos.z)] });
    }
    // a teammate jumping to YOU while you're on Ink Jet: the alert, and they land at your mark
    reset(); lands.length = 0;
    const origin = me.pos.clone();
    start(me, 'jetpack');
    me._go = null;
    if (me.bot) me.bot.update = () => { const it = me.intent; it.move.set(0.8, 0, 0.6); it.fire = it.squid = it.sub = it.special = it.jump = false; };
    step(1.2);
    if (me.bot) me.bot.update = () => { const it = me.intent; it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.special = it.jump = false; };
    const mk = G.specials.world.find((w) => w.kind === 'return' && w.owner === me);
    const B = mates[1];
    B.superJump(me); frame();
    const al = alerts();
    until(() => landed(B), 5);
    const Lb = lands.find((l) => l.a === B);
    R('you on Ink Jet: a teammate jumping to you still alerts you, and lands at your return mark', al.length === 1 && al[0].name === B.name && !!Lb && !!mk && Math.hypot(Lb.pos.x - mk.pos.x, Lb.pos.z - mk.pos.z) < 1.6 && mk.pos.distanceTo(origin) < 0.3, { al, land: Lb && [r2(Lb.pos.x), r2(Lb.pos.z)], mark: mk && [r2(mk.pos.x), r2(mk.pos.z)] });
    if (me.specialActive) G.specials.end(me, 'test');
  }

  // ------------------------------------------------------------------------------------------------ two marks on one spot
  if (want('stack')) {
    const scenes = [
      ['a teammate jumping to an Ink Jet user', () => {
        const U = mates[2], A = mates[0];
        start(U, 'jetpack', 12); U._go = new THREE.Vector3(1, 0, 0); step(1.2); U._go = null; step(0.2);
        A.superJump(U); step(0.3);
        return { who: [[U, 'return'], [A, 'jump']], near: [] };
      }],
      ['two teammates jumping to one teammate', () => {
        const T = mates[2];
        mates[0].superJump(T); mates[1].superJump(T); step(1.0);
        return { who: [[mates[0], 'jump'], [mates[1], 'jump']], near: [T] };
      }],
      ['two teammates jumping to an Ink Jet user (three marks on one spot)', () => {
        const U = mates[2];
        start(U, 'jetpack', 12); U._go = new THREE.Vector3(1, 0, 0); step(1.2); U._go = null; step(0.2);
        mates[0].superJump(U); mates[1].superJump(U); step(0.3);
        return { who: [[U, 'return'], [mates[0], 'jump'], [mates[1], 'jump']], near: [] };
      }],
      // the rest of the squad (Boss Battle: five) standing round an Ink Jet user's take-off spot far up the screen, the
      // camera looking down until the spot's tag is 3.5 u under the lowest thing hanging at the top middle: stacked up
      // over the crowd's name tags the tags would end under the top bar / boss bar, so they go down instead
      ['a teammate jumping to an Ink Jet user in a crowd, high on the screen', () => {
        const U = mates[2], A = mates[0], crowd = mates.filter((a) => a !== U && a !== A), sx = 0, sz = 18;
        const offs = [[-1.1, 0.7], [1.0, 1.4], [-0.4, 2.4], [1.5, -0.5], [0.2, 3.4], [-1.7, -0.8]];
        put(U, sx, sz); crowd.forEach((a, i) => put(a, sx + offs[i % 6][0], sz + offs[i % 6][1]));
        const F = J._furn(0), u = Math.min(innerWidth / 100, innerHeight * 1.7778 / 100);
        let fb = 0; for (let i = 0; i < F.boxes.n; i++) fb = Math.max(fb, F.boxes.a[i].b);
        for (pitch = -0.12; pitch > -0.7; pitch -= 0.02) { step(0.1); if (proj(sx, JUMP_UI.lift, sz)[1] <= fb + 3.5 * u) break; }
        start(U, 'jetpack', 12); U._go = new THREE.Vector3(1, 0, 0); step(1.2); U._go = null; step(0.2);
        A.superJump(U); step(0.3);
        return { who: [[U, 'return'], [A, 'jump']], near: crowd, top: { pitch: r2(pitch), furnBottom: r2(fb), spotY: r2(proj(sx, JUMP_UI.lift, sz)[1]) } };
      }],
    ];
    for (const tab of [false, true]) for (const [label, set] of scenes) {
      reset(); if (tab) openTab();
      const { who, near, top } = set(), names = who.map(([a]) => a.name);
      if (!tab) {
        const w = world().filter((t) => names.includes(t.name)), mp = mapT().filter((t) => names.includes(t.name));
        const wc = clashes(w, near.flatMap(allyTag));
        // each over its own spot: on it, or straight up / down its column resting on what it clears (seat)
        const seats = who.map(([a, kind]) => { const r = markOf(a, kind), t = w.find((x) => x.name === a.name); return { who: a.name, ...seat(t, r && proj(r.x, r.y + JUMP_UI.lift, r.z)) }; });
        const tm = topMiddle(), overTop = w.flatMap((t) => { const b = tagRect(t); return b ? tm.filter((o) => hitB(b, o)).map((o) => `${t.name} × ${o.k}`) : []; });
        // (the crowd scene: the column over the spot meets the top middle, so at least one tag went down)
        const down = !top || seats.some((x) => x.dy > 2.5);
        R(`${label}: world view — every name, no tag over another (nor a teammate's name tag, nor the top middle), each over its spot (on it, or resting on what it clears)`,
          w.length === who.length && wc.length === 0 && overTop.length === 0 && seats.every((x) => x.ok) && down, { names: w.map((t) => t.name), clash: wc, overTop, seats, ...(top ? { top, down } : {}) });
        const frame = rect(hud.mapFrame), labs = mp.map((t) => rect(t.el.querySelector('.iw-jt__tag')));
        const mc = [];
        for (let i = 0; i < mp.length; i++) for (let j = 0; j < mp.length; j++) {
          if (i === j) continue;
          if (i < j && hitB(labs[i], labs[j])) mc.push(`${mp[i].name} name × ${mp[j].name} name`);
          const rg = mp[j].el.querySelector('.iw-jt__ring');
          if (shown(rg) && hitB(labs[i], rect(rg))) mc.push(`${mp[i].name} name × ${mp[j].name} ring`);
        }
        const inFrame = labs.every((b) => b.l >= frame.l - 0.5 && b.r <= frame.r + 0.5 && b.t >= frame.t - 0.5 && b.b <= frame.b + 0.5);
        const rings = mp.filter((t) => shown(t.el.querySelector('.iw-jt__ring'))).length;
        R(`${label}: minimap — every name (inside the map), one ring on the shared spot, no name over another`, mp.length === who.length && mc.length === 0 && inFrame && rings === 1, { names: mp.map((t) => t.name), clash: mc, inFrame, rings, labels: labs.map(rb) });
      } else {
        const d = dioT().filter((t) => names.includes(t.name)), dc = clashes(d), pc = pinClash(d), zc = discChip(d);
        // (a disc moved off its spot — beside an older one, off a chip — lands clear of the pins' badges, keys and names,
        // drawn over it; a thin stem may cross it)
        const P = pinRects().filter((q) => q.k !== 'stem'), moved = who.flatMap(([a, kind]) => { const r = markOf(a, kind), t = d.find((x) => x.name === a.name); if (!r || !t || near2(t.xy, proj(r.x, r.y + 0.08, r.z))) return []; const ring = rect(t.el.querySelector('.iw-jt__ring')); return P.filter((q) => hitB(ring, q)).map((q) => `${a.name} disc (moved) × pin ${q.k}`); });
        R(`${label}: TAB map — every name, no tag over another, no label over a pin (badge, stem, key, name), no disc over a chip, a moved disc under no pin`, d.length === who.length && dc.length === 0 && pc.length === 0 && zc.length === 0 && moved.length === 0, { names: d.map((t) => t.name), clash: dc, pins: pc, chips: zc, moved, at: d.map((t) => t.xy) });
        closeTab();
      }
      step(2.5);
    }
  }

  // ------------------------------------------------------------------------------------------------ TAB map: labels clear of the pins
  if (want('pins')) {
    const bad = [];
    let n = 0;
    // a teammate T a few metres from you every way round, another jumping to T: the jump comes down by your pin and T's
    for (const [dx, dz] of [[0, 2.5], [0, 3.5], [0, 5], [0, -2.5], [2.5, 0], [-2.5, 0], [1.8, 2.5], [-1.8, 2.5]]) {
      reset(); openTab();
      const T = mates[2], A = mates[0];
      put(T, me.pos.x + dx, me.pos.z + dz); step(0.1);
      A.superJump(T); step(1.0);
      const d = dioT().filter((t) => t.name === A.name), pc = pinClash(d);
      n += d.length;
      if (!d.length || pc.length) bad.push({ at: [dx, dz], tag: d.length, pins: pc });
      closeTab(); step(2);
    }
    R('TAB map: a jump coming down by your pin and a teammate\'s, from every side — its label covers no pin (badge, stem, key, name)', bad.length === 0 && n === 8, { bad });
    // a jump coming down on a zone's chip / onto the tower's spot (Zone Control / Tower Command)
    const spots = m.zones ? m.zones.zones.map((z) => [z.center[0], z.center[2]]) : m.tower ? [[m.tower.pos.x + 2.5, m.tower.pos.z]] : [];
    if (spots.length) {
      const bad2 = [];
      for (const [x, z] of spots) {
        reset(); openTab();
        put(mates[2], x, z); step(0.1);
        mates[0].superJump(mates[2]); step(1.0);
        const d = dioT().filter((t) => t.name === mates[0].name), pc = pinClash(d), zc = discChip(d), ch = chipRects().length;
        // (its disc moved off a chip's text goes no further than two disc widths: clear of the chip — 3 to 4 discs wide —
        // and of the pins there, the teammate it lands by standing on the spot)
        const r = markOf(mates[0], 'jump'), at = r && proj(r.x, r.y + 0.08, r.z), u = Math.min(innerWidth / 100, innerHeight * 1.7778 / 100), D = (2 * 0.83 * 2.1 + 0.35) * u;
        const off = d[0] && at ? Math.hypot(d[0].xy[0] - at[0], d[0].xy[1] - at[1]) : null;
        if (!d.length || pc.length || zc.length || !ch || !(off <= 2 * D)) bad2.push({ at: [r2(x), r2(z)], tag: d.length, chips: ch, hits: pc.concat(zc), off: off && r2(off), D: r2(D) });
        closeTab(); step(2.5);
      }
      R(`TAB map: a jump coming down on ${m.zones ? 'each zone' : 'the tower'} — its label clear of the ${m.zones ? 'zone' : 'tower'} chip and the pins, its disc off the chip's text (just beside its spot)`, bad2.length === 0, { spots: spots.length, bad: bad2 });
    }
  }

  // ------------------------------------------------------------------------------------------------ sizes on this window
  if (want('size')) {
    reset();
    const u = Math.min(innerWidth / 100, innerHeight * 1.7778 / 100), fsxs = Math.max(11, 0.8 * u);
    const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
    // as drawn: the computed size times the scale it is drawn at (its box as drawn over its box as laid out)
    const drawnPx = (el) => { if (!el || !el.offsetHeight) return 0; return px(el) * el.getBoundingClientRect().height / el.offsetHeight; };
    // a teammate jumping to you (the alert); another jumping to a teammate far up the deck (~56 m from the camera: its
    // world tag at its smallest) — and its name on the minimap
    mates[0].superJump(me);
    put(mates[2], 0, 30); step(0.1);
    mates[1].superJump(mates[2]); step(0.3);
    const al = J.aLayer.querySelector('.iw-jal__i:not(.is-out)');
    const A = al && { name: px(al.querySelector('.iw-jal__name')), sub: px(al.querySelector('.iw-jal__txt small')), sec: px(al.querySelector('.iw-jal__sec')) };
    R(`the alert at ${innerWidth}×${innerHeight}: its name, "is jumping to you!" and the seconds at 11 px or more (the game's floor, --fs-xs)`, !!A && A.name >= 11 && A.sub >= 11 && A.sec >= 11, A);
    const w = world().find((t) => t.name === mates[1].name), mp = mapT().find((t) => t.name === mates[1].name);
    const sc = w ? +((/scale\(([\d.]+)\)/.exec(w.el.style.transform) || [])[1] || 1) : null;
    const wn = w && drawnPx(w.el.querySelector('.iw-jt__name')), ws = w && drawnPx(w.el.querySelector('.iw-jt__sec'));
    R(`a far teammate's world tag (shrunk to ${sc}): its name drawn no smaller than the teammates' own name tags at their smallest (0.82 × ${r2(fsxs)} px)`, !!w && sc < 0.8 && wn >= 0.82 * fsxs - 0.05, { sc, name: wn && r2(wn), sec: ws && r2(ws), want: r2(0.82 * fsxs) });
    const mn = mp && px(mp.el.querySelector('.iw-jt__name'));
    R('…and on the minimap: its name at 11 px or more', !!mp && mn >= 11, { name: mn });
    // a long online name (16 characters, the most a room takes) on the minimap: inside the map's frame at 11 px, ending
    // in an ellipsis where the map is narrower than it (not clipped at both ends by the frame)
    const L = mates[1], nm0 = L.name;
    L.name = 'Bartholomew Long'; step(0.1);
    const ml = mapT().find((t) => t.name === L.name), fr = rect(hud.mapFrame), lb = ml && rect(ml.el.querySelector('.iw-jt__tag')), ne = ml && ml.el.querySelector('.iw-jt__name');
    const inside = !!lb && lb.l >= fr.l - 0.5 && lb.r <= fr.r + 0.5, cut = !!ne && ne.scrollWidth > ne.clientWidth + 1;
    R('…a 16-character name there: inside the map at 11 px, with an ellipsis where the map is narrower', !!ml && inside && px(ne) >= 11 && (!cut || getComputedStyle(ne).textOverflow === 'ellipsis'),
      { label: lb && rb(lb), frame: rb(fr), cut, font: ne && px(ne) });
    L.name = nm0;
    step(3);
  }

  // ------------------------------------------------------------------------------------------------ the alerts' place
  if (want('place')) {
    reset();
    const calm = (els) => { for (const e of els) { if (!e) continue; e.style.animation = 'none'; e.style.transition = 'none'; for (const c of e.querySelectorAll('*')) c.style.animation = 'none'; } };
    calm([J.aLayer, hud.callouts, hud.zcalls, hud.countLayer]);   // (their glides: the resting place is what's checked)
    const alertEls = () => [...J.aLayer.querySelectorAll('.iw-jal__i:not(.is-out)')];
    const aBoxes = () => { const els = alertEls(); calm(els); return els.map((e) => ({ k: e.querySelector('.iw-jal__name').textContent, ...rect(e) })); };
    const against = (A, B) => { const out = []; for (const a of A) for (const b of B) if (hitB(a, b)) out.push(`${a.k} × ${b.k}`); return out; };
    mates[0].superJump(me); step(0.2);
    let A = aBoxes(), F = furn();
    R(`one alert: clear of the top middle (${F.map((f) => f.k).join(', ')})`, A.length === 1 && against(A, F).length === 0 && (!boss || F.some((f) => f.k === 'boss bar')), { alert: A.map(rb), hits: against(A, F), furn: F.map((f) => [f.k, ...rb(f)]) });
    // the mode's biggest states under the timer: Zone Control's overtime + zone shift, Tower Command's overtime + status
    if (m.mode === 'zones' || m.mode === 'tower') {
      const el = m.mode === 'zones' ? hud.zo : hud.tw, cls = m.mode === 'zones' ? ['is-ot', 'is-shift'] : ['is-ot', 'has-status'];
      const had = cls.map((c) => el.classList.contains(c)), txt = hud.twStatus.textContent;
      el.classList.add(...cls); if (m.mode === 'tower') hud.twStatus.textContent = 'CONTESTED';
      J._placeAlerts(J._furn(0));
      A = aBoxes(); F = furn();
      R(`…and with ${m.mode === 'zones' ? 'OVERTIME + ZONE SHIFT' : 'OVERTIME + a status'} under the timer`, A.length === 1 && against(A, F).length === 0, { alert: A.map(rb), hits: against(A, F), furn: F.map((f) => [f.k, ...rb(f)]) });
      cls.forEach((c, i) => el.classList.toggle(c, had[i])); hud.twStatus.textContent = txt;
    }
    // the status badges (at a fixed 118 px: on a small window they reach the row)
    me.status.track = 30; me.status.poison = 30; step(0.1);
    A = aBoxes(); F = furn();
    R('…with TRACKED and POISONED up: clear of the badges too', A.length === 1 && F.some((f) => f.k === 'TRACKED') && F.some((f) => f.k === 'POISONED') && against(A, F).length === 0, { alert: A.map(rb), hits: against(A, F), furn: F.map((f) => [f.k, ...rb(f)]) });
    me.status.track = 0; me.status.poison = 0;
    // three at once, and the announcements that share their band
    mates[1].superJump(me); mates[2].superJump(me); step(0.15);
    A = aBoxes(); F = furn();
    const own = against(A.slice(0, 1), A.slice(1)).concat(against(A.slice(1, 2), A.slice(2)));
    R('three alerts at once: all shown, none over another or the top middle', A.length === 3 && own.length === 0 && against(A, F).length === 0, { alerts: A.map((a) => [a.k, ...rb(a)]), hits: own.concat(against(A, F)) });
    const ann = [
      ['streak callout', () => hud._callout('FIRST SPLAT!', null, false), () => hud.callouts.querySelector('.iw-call'), 0.27],
      ['big callout', () => hud._callout('WIPEOUT!', 'TEAM WIPE', true), () => hud.callouts.querySelector('.iw-call'), 0.27],
      ['one-minute banner', () => hud.banner('one_minute'), () => hud.bannerLayer.querySelector('.iw-bn--minute'), 0.22],
      ['last-ten count', () => hud.countdown(3), () => { const e = hud.countLayer.querySelector('.iw-count:not(.is-old)'); return e && e.querySelector('.iw-display'); }, 0.3, true],
      ...(m.mode === 'zones' || m.mode === 'tower' ? [['zone callout', () => hud._zCall('CONTESTED!', { small: false }), () => hud.zcalls.querySelector('.iw-zcall'), 0.33]] : []),
    ];
    const H = innerHeight;
    // a big digit's ink (its inline box has the font's whole ascent and descent round it)
    const ink = (e) => { const b = rect(e), cs = getComputedStyle(e), cx = (ink.c || (ink.c = document.createElement('canvas').getContext('2d'))); cx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const q = cx.measureText(e.textContent); return { l: b.l, r: b.r, t: b.t + q.fontBoundingBoxAscent - q.actualBoundingBoxAscent, b: b.t + q.fontBoundingBoxAscent + q.actualBoundingBoxDescent }; };
    for (const [k, fire, get, , glyph] of ann) {
      fire();
      const el = get();
      calm([el && (glyph ? el.parentNode : el)]);
      const b = el && (glyph ? ink(el) : union([el, ...el.children]));
      const hits = b ? against([{ k, ...b }], A) : ['missing'];
      R(`…the ${k} stays clear of them`, !!b && hits.length === 0 && A.length === 3, { box: rb(b), hits, alerts: A.map(rb) });
      if (el) el.remove();
    }
    // they go back once the alerts are gone
    until(() => alerts().length === 0 && !J.alerts.length, 6); frame();
    const ct = parseFloat(getComputedStyle(hud.callouts).top), mt = (() => { hud.banner('one_minute'); const e = hud.bannerLayer.querySelector('.iw-bn--minute'); calm([e]); const v = parseFloat(getComputedStyle(e).top); e.remove(); return v; })();
    R('…and back in their usual place once the alerts are gone', !hud.el.classList.contains('has-jal') && Math.abs(ct - 0.27 * H) < 1.5 && Math.abs(mt - 0.22 * H) < 1.5, { hasJal: hud.el.classList.contains('has-jal'), callout: r2(ct), want: r2(0.27 * H), minute: r2(mt) });
    for (const e of [J.aLayer, hud.callouts, hud.zcalls, hud.countLayer]) { e.style.animation = ''; e.style.transition = ''; }
  }

  // ------------------------------------------------------------------------------------------------ the other team's tags and walls
  if (want('walls') && foes.length) {
    // testbox's wall: x 14…15, z −8…8, 4 m tall. You at (0, −26) looking up the deck; a jump landing at (22, 5) is behind it
    reset();
    const F = foes[0], T = foes[1];
    put(T, 22, 5); F.superJump(T); step(0.3);
    const r = markOf(F, 'jump'), cam = G.camera.position;
    const blocked = !!r && !G.physics.los(cam, new THREE.Vector3(r.x, r.y + 0.3, r.z)) && !G.physics.los(cam, new THREE.Vector3(r.x, r.y + JUMP_UI.lift, r.z));
    const p = r && proj(r.x, r.y + JUMP_UI.lift, r.z), onScr = !!p && p[0] > 0 && p[0] < innerWidth && p[1] > 0 && p[1] < innerHeight;
    const hidden = [...J.wLayer.querySelectorAll('.iw-jt.is-foe')].filter(vis);
    const op = hidden[0] ? (hidden[0].style.transition = 'none', getComputedStyle(hidden[0]).opacity) : null;
    if (hidden[0]) hidden[0].style.transition = '';
    R('an enemy landing behind a wall (on screen, out of sight): no tag through the wall', blocked && onScr && world().filter((t) => /is-foe/.test(t.cls)).length === 0 && hidden.length === 1 && hidden[0].classList.contains('is-occl') && op === '0', { blocked, onScr, shown: world().filter((t) => /is-foe/.test(t.cls)).length, opacity: op });
    R('…its ring + icon stay on the minimap (the map shows both teams\' landings)', mapT().some((t) => /is-foe/.test(t.cls)), { map: mapT().map((t) => t.cls) });
    step(3);
    // in the open: its tag
    reset();
    put(T, -4, 10); F.superJump(T); step(0.3);
    R('…the same in the open: its tag', world().filter((t) => /is-foe/.test(t.cls)).length === 1, { shown: world().map((t) => t.cls) });
    step(3);
    // your own team's behind that wall: still shown, with the name
    reset();
    put(mates[2], 22, 5); mates[0].superJump(mates[2]); step(0.3);
    R('your teammate landing behind the wall: shown through it, with the name', world().some((t) => t.name === mates[0].name), { shown: world().map((t) => t.name) });
    step(3);
  }

  G.audio.play = play0;
  m.controller = null;
  keep();
  return out;
})()
