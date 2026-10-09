// [b5-subs] Chain Bobber on screen (SPEC.md C3, C9): drawn by the kit (G.hud.xh / G.hud.el / the sub badge), as the
// Shaker draws its pips; hud.js itself is untouched.
//   the aim guide   (yours, while you hold the throw) on top of the standard arc: a team-coloured float marker where the
//                   bobber will float (1.0 m over the landing ring), a dotted drop line to the ring, dashed preview
//                   tethers to your live bobbers it would link to (≤ 3, within 5 m, a clear line) and a small "×N"
//                   label (the chain it would make). Where it would fizzle (by the enemy's spawn, a no-place disc) the
//                   marker goes grey with "✕".
//   the count       by the sub badge: your live bobbers ("×7") with a thin ring for the oldest one's time left.
//   CHAIN ×N        by the crosshair when a chain of yours goes off, with a tick per foe it caught.
//   a disarm        a quiet low "doo" (yours only) when a foe disarms one of yours.
//   the teammate cue  every player on a chain's team (the owner too): a chain GLOWS (tethers and lamps ×1.6, pulsing at
//                   3 Hz) while a foe this player can see — on screen, a clear line from the camera to their chest,
//                   checked every 0.1 s: no wall-hack — is within R(N) − 0.3 m of any of its bobbers; with a line from
//                   your eye to one of its bobbers in your weapon's reach, "Shoot to set off" sits on the nearest. The
//                   other team never sees either.
//   prompts         "Bobbers within 5 m tether up" on your first throw of a match; "Shoot your team's Chain Bobbers to set
//                   them off" the first two times the cue's hint shows for you (main.js asks SUB_KITS[k].prompt).
import * as THREE from 'three';
import { G, clamp } from '../../core/ctx.js';
import { weaponRange, subViewScale } from '../../config.js';
import { items, sizeOf, SB, predictSpot, markTethers } from './bobber.js';

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3();
export const BOBBER_HUD = { cueT: 0, glowChains: 0, hint: null, hintShown: 0, guide: null, count: 0, chainN: 0, chainTicks: 0, prompt: null, refused: 0 };

// ---- DOM (built on first use)
const CSS = `
.iw-bobc { position: absolute; left: calc(var(--u) * -1.2); bottom: calc(var(--u) * -1.05); display: flex; align-items: center; gap: calc(var(--u) * .25);
  padding: calc(var(--u) * .16) calc(var(--u) * .5) calc(var(--u) * .16) calc(var(--u) * .2); border-radius: 99px; background: rgba(14, 11, 22, .86);
  box-shadow: 0 0 0 calc(var(--u) * .12) rgba(255, 255, 255, .35); color: #fff; font: 800 calc(var(--u) * .95) / 1 'Rubik', sans-serif; pointer-events: none;
  opacity: 0; scale: .6; transition: opacity .15s, scale .3s cubic-bezier(.34, 1.8, .64, 1); white-space: nowrap; }
.iw-bobc.is-on { opacity: 1; scale: 1; }
.iw-bobc svg { width: calc(var(--u) * 1.45); height: calc(var(--u) * 1.45); rotate: -90deg; }
.iw-bobc svg circle { fill: none; stroke-width: 5; }
.iw-bobc svg .bg { stroke: rgba(255, 255, 255, .18); }
.iw-bobc svg .fg { stroke: var(--self-light); stroke-dasharray: 100; stroke-linecap: round; }
.iw-bobc.is-low svg .fg { stroke: #ffcf33; }
.iw-bobc.is-pop { animation: iw-bobc-pop .35s cubic-bezier(.34, 1.8, .64, 1); }
@keyframes iw-bobc-pop { 0% { scale: 1.35; } }
.iw-bobx { position: absolute; left: 34px; top: 26px; display: flex; flex-direction: column; gap: 3px; pointer-events: none; opacity: 0; white-space: nowrap; }
.iw-bobx.is-on { animation: iw-bobx 1.5s forwards; }
@keyframes iw-bobx { 0% { opacity: 0; translate: -6px 0; scale: 1.35; } 10% { opacity: 1; translate: 0 0; scale: 1; } 80% { opacity: 1; } 100% { opacity: 0; translate: 0 -6px; } }
.iw-bobx b { font: 900 17px / 1 'Titan One', 'Rubik', sans-serif; letter-spacing: .04em; color: #fff; -webkit-text-stroke: 4px #15121c; paint-order: stroke fill; }
.iw-bobx b em { font-style: normal; color: var(--self-light); }
.iw-bobx span { display: flex; gap: 3px; min-height: 8px; }
.iw-bobx span i { width: 8px; height: 8px; border-radius: 2px; rotate: 45deg; background: #fff; box-shadow: 0 0 0 2px #15121c, 0 0 6px var(--self); animation: iw-bobx-t .3s cubic-bezier(.34, 1.8, .64, 1); }
@keyframes iw-bobx-t { 0% { scale: 0; } }
.iw-bobn { position: absolute; left: 0; top: 0; pointer-events: none; display: none; translate: -50% -130%; padding: 2px 7px; border-radius: 99px;
  background: rgba(14, 11, 22, .85); color: #fff; font: 800 13px / 1 'Rubik', sans-serif; box-shadow: 0 0 0 2px var(--self); white-space: nowrap; }
.iw-bobn.is-on { display: block; }
.iw-bobn.is-no { box-shadow: 0 0 0 2px #8a8494; color: #c9c4d6; }
.iw-bobh { position: absolute; left: 0; top: 0; pointer-events: none; display: none; translate: -50% -175%; padding: 3px 9px 3px 7px; border-radius: 99px;
  background: rgba(14, 11, 22, .88); color: #fff; font: 800 12px / 1 'Rubik', sans-serif; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap;
  box-shadow: 0 0 0 2px var(--self-light), 0 0 12px rgba(var(--self-rgb), .8); animation: iw-bobh 0.34s ease-in-out infinite alternate; }
.iw-bobh.is-on { display: flex; align-items: center; gap: 5px; }
.iw-bobh::before { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2px var(--self), 0 0 8px #fff; }
.iw-bobh::after { content: ''; position: absolute; left: 50%; bottom: -7px; translate: -50% 0; border: 5px solid transparent; border-top-color: var(--self-light); }
@keyframes iw-bobh { to { box-shadow: 0 0 0 2px #fff, 0 0 18px rgba(var(--self-rgb), 1); } }
.iw-bobr { position: absolute; left: 34px; top: -46px; pointer-events: none; opacity: 0; white-space: nowrap; font: 900 12px / 1 'Rubik', sans-serif; letter-spacing: .1em;
  color: #ff8d9c; padding: 4px 10px; border-radius: 99px; background: rgba(14, 11, 22, .9); }
.iw-bobr.is-on { animation: iw-bobr 1.6s forwards; }
@keyframes iw-bobr { 0% { opacity: 0; scale: 1.2; } 10%, 75% { opacity: 1; scale: 1; } 100% { opacity: 0; } }
.iw-hud.is-mapopen .iw-bobh, .iw-hud.is-mapopen .iw-bobn { display: none; }
`;
let D = null;
function dom() {
  const H = G.hud;
  if (!H?.el || !H.xh) return null;
  if (D && D.root === H.el) return D;
  if (!document.getElementById('iw-bob-css')) { const s = document.createElement('style'); s.id = 'iw-bob-css'; s.textContent = CSS; document.head.appendChild(s); }
  const mk = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; return e; };
  D = { root: H.el };
  D.count = mk('iw-bobc', '<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="14"/><circle class="fg" cx="18" cy="18" r="14" pathLength="100"/></svg><b>×0</b>');
  D.countFg = D.count.querySelector('.fg'); D.countB = D.count.querySelector('b');
  (H.subBadge || H.el).appendChild(D.count);
  D.chain = mk('iw-bobx', '<b>CHAIN <em>×1</em></b><span></span>'); D.chainB = D.chain.querySelector('em'); D.chainT = D.chain.querySelector('span');
  D.note = mk('iw-bobr', 'TOO CLOSE TO THEIR BASE');
  H.xh.append(D.chain, D.note);
  D.n = mk('iw-bobn'); D.hint = mk('iw-bobh'); D.hint.append('Shoot to set off');
  H.el.append(D.n, D.hint);
  D.L = { count: -1, fr: -1, low: null, cOn: false, nOn: false, hOn: false, chainShown: null, ticks: 0 };
  return D;
}
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
// a world point → px in the HUD layer (null: behind the camera)
function toScreen(p, out) {
  const cam = G.rig?.gameCam || G.camera, el = G.hud?.el;
  if (!cam || !el) return null;
  _v2.copy(p).project(cam);
  if (_v2.z > 1 || Math.abs(_v2.x) > 1.2 || Math.abs(_v2.y) > 1.2) return null;
  out.x = (_v2.x * 0.5 + 0.5) * (el.clientWidth || innerWidth); out.y = (-_v2.y * 0.5 + 0.5) * (el.clientHeight || innerHeight);
  return out;
}

// ---- the aim guide's 3D pieces (one set, lazily)
let GD = null;
function guideObjs() {
  if (GD && GD.group.parent === G.scene) return GD;
  if (!GD) {
    const group = new THREE.Group(); group.name = 'bobber-guide';
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide });
    const ghost = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), ghostMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2), ringMat);
    const lineMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.85, depthWrite: false });
    const drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3(0, -1, 0)]), lineMat);
    const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * 2 * 3), 3));
    const tMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.22, gapSize: 0.14, transparent: true, opacity: 0.95, depthWrite: false });
    const teth = new THREE.LineSegments(tGeo, tMat);
    for (const o of [ghost, ring, drop, teth]) { o.renderOrder = 4; o.frustumCulled = false; o.onBeforeRender = (r, scene, c, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : (o === teth ? o.userData.n || 0 : Infinity); }; }
    group.add(ghost, ring, drop, teth);
    GD = { group, ghost, ring, drop, teth, ghostMat, ringMat, lineMat, tMat };
  }
  G.scene?.add(GD.group);
  return GD;
}
export function guideOff() { if (GD) GD.group.visible = false; if (D) { D.n.classList.remove('is-on'); D.L.nOn = false; } BOBBER_HUD.guide = null; }
const _pt = { x: 0, y: 0 };
function guide(a) {
  const sub = a.sub, aiming = !!(a.alive && a.weaponRunner?.aimingSub && sub?.kind === 'bobber' && a.specialActive?.kind !== 'barrage' && G.match?.state === 'playing');
  if (!aiming) { if (BOBBER_HUD.guide || GD?.group.visible) guideOff(); return; }
  const s = predictSpot(a);
  if (!s) { guideOff(); return; }
  const g = guideObjs(), col = G.teamColors[a.team] || new THREE.Color(1, 1, 1), no = s.refused, c = no ? new THREE.Color(0.55, 0.53, 0.6) : col;
  g.group.visible = true;
  const r = 0.12 * subViewScale('bobber') * 1.2;
  g.ghost.position.set(s.x, s.y, s.z); g.ghost.scale.setScalar(r); g.ghostMat.color.copy(c);
  g.ring.position.set(s.x, s.y - r * 0.15, s.z); g.ring.scale.setScalar(r * 1.9 * (1 + 0.06 * Math.sin(G.time * 8))); g.ringMat.color.copy(c).multiplyScalar(1.3);
  // the drop line to where it touches
  const dp = g.drop.geometry.attributes.position; dp.setXYZ(0, s.x, s.y - r, s.z); dp.setXYZ(1, s.hx, s.hy, s.hz); dp.needsUpdate = true; g.drop.computeLineDistances(); g.lineMat.color.copy(c).multiplyScalar(1.4);
  // the preview tethers (and the chain it would make)
  const S = SB(), cand = [];
  if (!no) for (const it of items) {
    if (it.owner !== a || it.ghost || it.state !== 'live' || it.ten.length >= S.maxTethers) continue;
    const d = Math.hypot(it.spot.x - s.x, it.spot.y - s.y, it.spot.z - s.z);
    if (d <= S.linkRange) cand.push({ it, d });
  }
  cand.sort((x, y) => x.d - y.d);
  const tp = g.teth.geometry.attributes.position; let n = 0;
  const chains = new Set();
  for (const c2 of cand) {
    if (n >= S.maxTethers) break;
    if (!G.physics.los(_v.set(s.x, s.y, s.z), c2.it.spot)) continue;
    tp.setXYZ(n * 2, s.x, s.y, s.z); tp.setXYZ(n * 2 + 1, c2.it.spot.x, c2.it.spot.y, c2.it.spot.z);
    if (c2.it.chain) chains.add(c2.it.chain);
    n++;
  }
  tp.needsUpdate = true; g.teth.userData.n = n * 2; g.teth.computeLineDistances(); g.tMat.color.copy(col).multiplyScalar(1.5);
  let N = 1; for (const ch of chains) N += ch.n;
  BOBBER_HUD.guide = { x: s.x, y: s.y, z: s.z, kind: s.kind, refused: no, links: n, n: N };
  // the ×N label over the marker
  const Dm = dom();
  if (Dm) {
    const p = toScreen(_v.set(s.x, s.y + r * 1.3, s.z), _pt);
    const on = !!p;
    if (on) { Dm.n.style.left = p.x.toFixed(1) + 'px'; Dm.n.style.top = p.y.toFixed(1) + 'px'; const t = no ? '✕' : `×${N}`; if (Dm.n.textContent !== t) Dm.n.textContent = t; Dm.n.classList.toggle('is-no', no); }
    if (on !== Dm.L.nOn) { Dm.L.nOn = on; Dm.n.classList.toggle('is-on', on); }
  }
}

// ---- the teammate cue (every 0.1 s) and its hint
let cueT = 0, hintIt = null, hintWas = false, prompt = null, promptT = 0, hintPrompts = 0, firstThrow = false;
const _was = new Set();
function cue(dt) {
  if ((cueT -= dt) > 0) return;
  cueT = 0.1;
  BOBBER_HUD.cueT++;
  _was.clear();
  for (const it of items) if (it.glow) { _was.add(it); it.glow = false; }
  hintIt = null;
  glowScan();
  // (a bobber's glow flipped: its tethers' glow is a per-tether attribute — have the kit re-upload them; the pulse itself
  // runs in the shader)
  let flip = false;
  for (const it of items) if (it.glow !== _was.has(it)) { flip = true; break; }
  if (flip) { markTethers(); BOBBER_HUD.glowFlips = (BOBBER_HUD.glowFlips || 0) + 1; }
}
function glowScan() {
  const vt = G.subs?.viewTeam ? G.subs.viewTeam() : G.local ? G.local.team : -1;
  const m = G.match;
  if (vt < 0 || !m || m.attract || m.state !== 'playing') return;
  const cam = G.rig?.gameCam || G.camera; if (!cam) return;
  // foes this player can see: on screen and a clear line from the camera to their chest
  const vis = [];
  for (const e of G.actors) {
    if (e.team === vt || !e.alive || e.superJumpState) continue;
    _v.set(e.pos.x, e.pos.y + (e.form === 'squid' ? 0.3 : 0.7), e.pos.z);
    _v2.copy(_v).project(cam);
    if (_v2.z > 1 || Math.abs(_v2.x) > 1 || Math.abs(_v2.y) > 1) continue;
    if (!G.physics.los(cam.position, _v)) continue;
    vis.push(_v.clone());
  }
  if (!vis.length) { BOBBER_HUD.glowChains = 0; return; }
  const seen = new Set(), glowing = [];
  for (const it of items) {
    if (it.team !== vt || it.state !== 'live' || !it.chain || seen.has(it.chain)) continue;
    seen.add(it.chain);
    const R = sizeOf(it.chain.n).R - 0.3;
    let hot = false;
    for (const o of it.chain.items) { if (o.state !== 'live') continue; for (const p of vis) if (o.spot.distanceTo(p) < R) { hot = true; break; } if (hot) break; }
    if (!hot) continue;
    glowing.push(it.chain);
    for (const o of it.chain.items) o.glow = true;
  }
  BOBBER_HUD.glowChains = glowing.length;
  // the hint: the nearest bobber of a glowing chain with a line from the local player's eye, in their weapon's reach
  const a = G.local;
  if (!glowing.length || !a || !a.alive || a.team !== vt) return;
  const eye = _v.set(a.pos.x, a.pos.y + 1.3, a.pos.z), reach = weaponRange(a.weapon || {}) * 0.95;
  let best = null, bd = Infinity;
  for (const ch of glowing) for (const o of ch.items) {
    if (o.state !== 'live') continue;
    const d = o.spot.distanceTo(eye);
    if (d > reach || d >= bd) continue;
    if (!G.physics.los(eye, o.spot)) continue;
    bd = d; best = o;
  }
  hintIt = best;
}

// ---- per frame (the kit's tick)
let chainEl = null;
export function hudTick(dt) {
  if (promptT > 0) { promptT -= dt; if (promptT <= 0) prompt = null; }
  const a = G.local;
  cue(dt);
  if (a) guide(a); else guideOff();
  const Dm = dom();
  if (!Dm) return;
  const L = Dm.L, m = G.match, playing = !!(m && !m.attract && m.state === 'playing');
  // the count by the sub badge
  let n = 0, oldest = null;
  if (a && a.sub?.kind === 'bobber') for (const it of items) if (it.owner === a && !it.ghost && it.state === 'live') { n++; if (!oldest || it.born < oldest.born) oldest = it; }
  const on = playing && n > 0;
  BOBBER_HUD.count = n;
  if (on !== L.cOn) { L.cOn = on; Dm.count.classList.toggle('is-on', on); }
  if (on) {
    if (n !== L.count) { if (L.count >= 0 && n > L.count) restart(Dm.count, 'is-pop'); L.count = n; Dm.countB.textContent = '×' + n; }
    const fr = clamp(1 - (G.time - oldest.born) / SB().life, 0, 1);
    if (Math.abs(fr - L.fr) > 0.004) { L.fr = fr; Dm.countFg.style.strokeDashoffset = (100 * (1 - fr)).toFixed(1); }
    const low = fr < 0.1;
    if (low !== L.low) { L.low = low; Dm.count.classList.toggle('is-low', low); }
  } else L.count = -1;
  // CHAIN ×N's ticks: one per foe caught (they arrive over the chain's hops, and from the victims' screens)
  if (chainEl && G.time - chainEl.t < 1.5) {
    const k = chainEl.g.caught.size;
    while (L.ticks < Math.min(k, 8)) { Dm.chainT.appendChild(document.createElement('i')); L.ticks++; }
    BOBBER_HUD.chainTicks = L.ticks;
  }
  // the hint over the bobber to shoot
  const hp = hintIt && playing ? toScreen(_v.set(hintIt.spot.x, hintIt.spot.y + 0.3, hintIt.spot.z), _pt) : null;
  const hOn = !!hp;
  if (hOn) { Dm.hint.style.left = hp.x.toFixed(1) + 'px'; Dm.hint.style.top = hp.y.toFixed(1) + 'px'; }
  if (hOn !== L.hOn) { L.hOn = hOn; Dm.hint.classList.toggle('is-on', hOn); }
  BOBBER_HUD.hint = hOn ? hintIt.gid : null;
  if (hOn && !hintWas) { BOBBER_HUD.hintShown++; if (hintPrompts < 2) { hintPrompts++; setPrompt("Shoot your team's Chain Bobbers to set them off", 2.6); } }
  hintWas = hOn;
}
function setPrompt(text, t) { prompt = text; promptT = t; BOBBER_HUD.prompt = text; }
export function kitPrompt(a) { return a && a.isLocal && prompt && promptT > 0 ? prompt : null; }
export function onThrowHud(a) { if (!firstThrow && a.isLocal) { firstThrow = true; setPrompt('Bobbers within 5 m tether up', 3); } }
export function onChainHud(g) {
  const Dm = dom();
  BOBBER_HUD.chainN = g.n;
  if (!Dm) return;
  chainEl = { g, t: G.time };
  Dm.chainB.textContent = '×' + g.n;
  Dm.chainT.textContent = ''; Dm.L.ticks = 0;
  restart(Dm.chain, 'is-on');
}
export function onDisarmHud(it) {
  // (a foe disarmed one of yours: a quiet low "doo", yours only — 2D)
  if (it.owner?.isLocal && G.match && !G.match.attract) G.audio?.play('bobber_doo', { volume: 0.6 });
}
export function onRefusedHud(it, why) {
  BOBBER_HUD.refused++;
  // (the reason: by their base — no spawn traps — or no room to float: inside a wall, a stage's no-place disc)
  const t = why === 'pad' ? 'TOO CLOSE TO THEIR BASE' : 'NO ROOM TO FLOAT THERE';
  BOBBER_HUD.note = t;
  const Dm = dom(); if (Dm) { if (Dm.note.textContent !== t) Dm.note.textContent = t; restart(Dm.note, 'is-on'); }
}
export function hudClear() {
  hintIt = null; hintWas = false; prompt = null; promptT = 0; hintPrompts = 0; firstThrow = false; chainEl = null;
  BOBBER_HUD.prompt = null; BOBBER_HUD.hint = null; BOBBER_HUD.guide = null;
  if (D) { D.count.classList.remove('is-on'); D.hint.classList.remove('is-on'); D.n.classList.remove('is-on'); D.chain.classList.remove('is-on'); D.L.cOn = D.L.hOn = D.L.nOn = false; D.L.count = -1; }
}
