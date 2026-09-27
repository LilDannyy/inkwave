// Brine Cutlass (kind 'blade') — a sword that swings like a brush, without the rolling: see kits/registry.js.
//   Tap fire   → a quick horizontal cut (alternating right → left / left → right). The blade itself is a hitbox for the
//                sweep (an arc in front, `reach` m) that deals `tapMelee`; the cut flings a wide crescent of droplets
//                forward (one droplet per victim per cut: `tapDamageNear` → `tapDamageFar`).
//   Hold fire  → after the cut, the blade rises and charges (`chargeTime`, glowing hilt → tip, a rising hum); full
//                charge holds as long as the trigger does (and through a quick dive, `chargeStore` s). Release at full
//                → an overhead cut with a short lunge: the blade splats in one hit (`heavyMelee`) and a long straight ink
//                wave flies `waveRange` m, piercing enemies (`waveDamage` → `waveDamageFar`) and painting a stripe.
//                Released early (≥ 30 %) → just a quick cut.
// Runner state lives in runner.kit (see st()); runner.charge mirrors the charge (HUD meter, pose, blade glow) but
// runner.charging stays false: that flag makes the core treat the kid as busy (no diving), and the blade may dive with
// a charge held. World objects (waves, arc trails) are module-owned (tick / clear).
import * as THREE from 'three';
import { G, emit, clamp, lerp } from '../../core/ctx.js';
import { PLAYER } from '../../config.js';
import { MAIN_KITS } from './registry.js';
import { MELEE } from '../bots.js';
import { registerWeaponModel } from '../character-weapons.js';
import { Hit } from '../physics.js';
import { WEAPON_ICONS } from '../../ui/ui-icons.js';
import { buildBlade, animateBlade } from './blade-model.js';
import { BladeFX, installBladeSounds, BLADE_ICON } from './blade-fx.js';

const DEG = Math.PI / 180;
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _n = new THREE.Vector3();
const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const _hit = new Hit(), _hit2 = new Hit();
const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------------------------------------ registration
registerWeaponModel('blade', buildBlade, animateBlade);
WEAPON_ICONS.blade = BLADE_ICON;
installBladeSounds();
MELEE.blade = true;

// ------------------------------------------------------------------------------------------ runner state
function st(R) {
  return R.kit || (R.kit = {
    held: false, holdT: 0, charge: 0, charging: false, full: false, store: 0,
    cd: 0, queued: 0, side: -1, swing: null, lunge: 0, lx: 0, lz: 0, lv: 0,
    lastT: G.time, flashT: 99, since: 99, taps: 0, heavies: 0,
  });
}
// charge hums are keyed by runner (runner.kit is nulled before reset hooks run, and a loadout swap resets through the
// NEW kind's kit — tick() sweeps any hum whose runner stopped charging a blade)
const HUMS = new Map();
function stopHum(R) { const h = HUMS.get(R); if (h) { h.stop(0.06); HUMS.delete(R); } }
function cancelCharge(R, K) {
  K.charging = false; K.charge = 0; K.full = false; K.store = 0;
  R.charge = 0;
  stopHum(R);
}
const heard = (a) => a.isLocal || a._nearCamera?.();
const sndPos = (a) => (a.isLocal ? undefined : a.pos);
function rumble(a, strong, weak, ms) { if (a && a.isLocal && !a.isBot) G.input?.rumble?.(strong, weak, ms); }
// core bot logic holding the trigger for its own ends (inking a wall to climb, a puddle to refill in): quick cuts
const coreDriven = (a) => !!(a.bot && !a.isLocal && (a.bot._climbAim || a.bot.mode === 'refill'));
// a bot brain that wants to keep holding a charge even though the core cleared its trigger this frame (aim drifted)
const botHolds = (a) => !!(a.bot && a.bot._blHold > G.time - 0.3);

// ------------------------------------------------------------------------------------------ the cuts
// Heading of a cut: toward the crosshair's world point (the camera sits over the shoulder, so its ray and the kid's
// facing differ by a few degrees at mid range), else the aim yaw.
function cutYaw(a) {
  const p = a.aimPoint, dx = p.x - a.pos.x, dz = p.z - a.pos.z;
  if (dx * dx + dz * dz < 4) return a.aimYaw;
  const y = Math.atan2(dx, dz);
  let d = y - a.aimYaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d) < 0.35 ? y : a.aimYaw;
}
function tap(R, K, w) {
  const a = R.a;
  if (a.ink < w.tapInk) { R._empty(); K.cd = 0.18; return false; }
  a.ink -= w.tapInk; a.lastFire = 0;
  K.side = -K.side;
  K.cd = w.tapInterval; K.since = 0; K.taps++;
  K.swing = { heavy: false, t: 0, side: K.side, yaw: cutYaw(a), pitch: a.aimPitch, hits: new Set(), fired: false, dev: false, sp: !!a.specialActive };
  R.firingT = 0.4; a.fireFacing = 0.45;
  a.character.trigger('blade_slash', K.side);
  BladeFX.slash(a, K.side, false, 0.1, K.swing.yaw);
  if (heard(a)) G.audio?.play('blade_swish', { pos: sndPos(a), volume: a.isLocal ? 0.55 : 0.42, pitch: K.side > 0 ? 1 : 1.09 });
  if (a.isLocal) emit('recoil', { amount: 0.004 });
  rumble(a, 0.05, 0.12, 45);
  return true;
}
function heavy(R, K, w) {
  const a = R.a;
  a.ink = Math.max(0, a.ink - w.heavyInk); a.lastFire = 0;
  K.cd = w.heavyInterval; K.since = 0; K.flashT = 0; K.heavies++;
  K.swing = { heavy: true, t: 0, side: 1, yaw: cutYaw(a), pitch: a.aimPitch, hits: new Set(), fired: false, dev: false, stroke: false, sp: !!a.specialActive };
  R.firingT = 0.5; a.fireFacing = 0.6;
  // short forward lunge with the cut (grounded; never off into the sea)
  const fx = Math.sin(K.swing.yaw), fz = Math.cos(K.swing.yaw);
  K.lunge = 0;
  if (a.grounded && lungeSafe(a, fx, fz, w.lungeDist)) { K.lunge = w.lungeTime; K.lx = fx; K.lz = fz; K.lv = w.lungeDist / (w.lungeTime * 0.75); }
  a.character.trigger('blade_heavy');
  BladeFX.slash(a, 1, true, 0.12, K.swing.yaw);
  if (heard(a)) G.audio?.play('blade_heavy', { pos: sndPos(a), volume: a.isLocal ? 0.7 : 0.55 });
  if (a.isLocal) { emit('recoil', { amount: 0.012 }); emit('shake', { amount: 0.1 }); }
  rumble(a, 0.25, 0.3, 120);
}
function lungeSafe(a, fx, fz, d) {
  const L = G.level; if (!L) return false;
  for (const k of [0.5, 1, 1.4]) {
    const gy = L.groundHeight(a.pos.x + fx * d * k, a.pos.z + fz * d * k, a.pos.y + 0.6);
    if (!(gy > PLAYER.waterY + 0.25)) return false;             // sea / void ahead
    if (a.bot && !a.isLocal && gy < a.pos.y - 1.6) return false;  // bots don't lunge off ledges
  }
  return true;
}

// the swing in progress: ink leaves the blade, the blade itself hits, the lunge carries the kid forward
function runSwing(R, K, dt, w) {
  const S = K.swing, a = R.a;
  S.t += dt;
  if (!S.fired && S.t >= (S.heavy ? 0.05 : 0.028)) { S.fired = true; if (S.heavy) spawnWave(a, w, S); else fireDrops(a, w, S); }
  if (S.heavy && !S.stroke && S.t >= 0.075) { S.stroke = true; groundStroke(a, w, S); }
  const t0 = 0.01, t1 = S.heavy ? 0.16 : 0.12;
  if (S.t >= t0 && S.t - dt <= t1) melee(a, w, S);
  if (K.lunge > 0) {
    K.lunge -= dt;
    const k = K.lunge > 0 ? 1 : 0;
    if (k && a.alive) { const v = K.lv * (0.55 + 0.45 * Math.min(1, K.lunge / (w.lungeTime * 0.5))); a.vel.x = K.lx * v; a.vel.z = K.lz * v; }
  }
  if (S.t > 0.4) K.swing = null;
}

// Quick cut: a crescent of droplets flung across the front along the sweep (the centre ones fastest, so the sheet
// bows forward), leaving from the blade's path in sweep order. Aiming steeply down throws them at your feet.
function fireDrops(a, w, S) {
  const P = G.projectiles; if (!P) return;
  const yaw = S.yaw, side = S.side;
  const pitch = a.aimPitch;
  const steep = pitch < -0.55;
  const up = steep ? pitch * 0.85 : clamp(pitch, -0.4, 0.45) * 0.75 + 0.06;
  const vol = { hit: new Set() };
  const N = w.tapDrops, A = w.tapSpreadDeg * DEG;
  const col = G.teamColors[a.team] || a.color;
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0.5;
    const off = side * (t - 0.5) * A;                         // side +1 sweeps the kid's right → left
    const ang = yaw + off, ox = Math.sin(ang), oz = Math.cos(ang);
    const mid = 1 - Math.abs(t - 0.5) * 2;
    const sp = w.tapSpeed * (0.8 + 0.24 * mid) * (0.95 + Math.random() * 0.1) * (steep ? 0.45 : 1);
    const p = P._new();
    Object.assign(p, {
      type: 'drop', owner: a, team: a.team, age: 0, life: 1.2, straight: steep ? 0 : w.tapStraight,
      radius: w.tapDropRadius * (0.85 + Math.random() * 0.3), damage: w.tapDamageNear, dmgFar: w.tapDamageFar,
      size: 0.13, trail: -0.2, trailEvery: 1.25, trailRadius: 0.3, grav: 24, drag: 0.5, seed: Math.random(), volley: vol, weaponId: 'blade',
      delay: t * 0.018, sp: S.sp,
      vis: 0.044 + 0.03 * mid + Math.random() * 0.01, tail0: 0.8, tailK: 1.7, wob: 0.07, wobF: 22, nose: 0.15, sats: 1,
    });
    // leaves from the blade's path: a diagonal cut (high at the start, low at the end) — never from inside a wall the
    // kid is hugging (then it leaves from the body and splats on the wall)
    const r = steep ? 0.55 : 0.8;
    p.pos.set(a.pos.x + ox * r, a.pos.y + (steep ? 0.7 : 0.98) + (0.5 - t) * 0.12, a.pos.z + oz * r);
    _v3.set(a.pos.x, p.pos.y, a.pos.z);
    if (!G.physics.los(_v3, p.pos)) p.pos.copy(_v3).addScaledVector(_v.set(ox, 0, oz), 0.12);
    p.prev.copy(p.pos); p.start.copy(p.pos);
    const cu = Math.cos(up + (Math.random() - 0.5) * 0.05);
    // outward, with a little of the sweep's own motion
    const tx = -oz * side, tz = ox * side;
    const hx = ox + tx * 0.12, hz = oz + tz * 0.12, hl = Math.hypot(hx, hz);
    p.vel.set((hx / hl) * cu * sp, Math.sin(up) * sp, (hz / hl) * cu * sp);
    P.list.push(p);
  }
  // a fine spray off the edge (FX only)
  if (G.fx && heard(a)) {
    for (let i = 0; i < 6; i++) {
      const off = side * (Math.random() - 0.5) * A * 1.1, ang = yaw + off;
      _v.set(a.pos.x + Math.sin(ang) * 0.9, a.pos.y + 0.98, a.pos.z + Math.cos(ang) * 0.9);
      _v2.set(Math.sin(ang) * (4 + Math.random() * 4), 1 + Math.random() * 2, Math.cos(ang) * (4 + Math.random() * 4));
      G.fx.drop(_v, _v2, col, { size: 0.035 + Math.random() * 0.03, life: 0.6 });
    }
  }
  emit('weapon:fire', { actor: a, weapon: w.id, cut: 'quick', muzzle: new THREE.Vector3(a.pos.x + Math.sin(yaw) * 0.8, a.pos.y + 0.98, a.pos.z + Math.cos(yaw) * 0.8), dir: new THREE.Vector3(Math.sin(yaw), Math.sin(up), Math.cos(yaw)).normalize() });
}

// the blade meets the ground in front at the bottom of the overhead cut: a stroke of ink (cuts through enemy ink)
function groundStroke(a, w, S) {
  const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw);
  _n.set(fx, 0, fz);
  let area = 0;
  for (const d of [0.75, 1.35]) {
    _v.set(a.pos.x + fx * d, a.pos.y + 0.8, a.pos.z + fz * d);
    const g = G.physics.raycast(_v, DOWN, 2.2, _hit2, true);
    if (!g.hit) continue;
    _v2.copy(g.point).addScaledVector(g.normal, 0.08);
    area += G.paint.splat(_v2, w.strokeRadius, a.team, { seed: Math.random(), stretch: _n, stretchAmt: 0.9 });
    if (d > 1 && heard(a)) G.fx?.burst(g.point, g.normal, G.teamColors[a.team] || a.color, { count: 10, speed: 3.5, size: 0.08 });
  }
  credit(a, area, S.sp);
}
function credit(a, area, sp) { if (area > 0) { if (sp) a.addTurfNoSpecial(area); else a.addTurf(area); } }

// The blade as a hitbox: every enemy inside the arc in front (reach + their body radius, the swing's vertical window,
// nothing through walls) takes the cut's melee damage once per swing. Shields / curtains in between take it instead.
function melee(a, w, S) {
  const reach = w.reach, half = (S.heavy ? w.heavyArcDeg : w.meleeArcDeg) * DEG * 0.5;
  const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw);
  const dmg = S.heavy ? w.heavyMelee : w.tapMelee;
  _v3.set(a.pos.x, a.pos.y + 1.0, a.pos.z);
  for (const e of G.actors) {
    if (e === a || e.team === a.team || !e.alive || S.hits.has(e)) continue;
    const hr = e.hitR || PLAYER.radius, h = e.hitH || (e.form === 'squid' ? PLAYER.squidHeight : PLAYER.height);
    const dx = e.pos.x - a.pos.x, dz = e.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d > reach + hr) continue;
    const ey = e.pos.y + (e.smoothY || 0) - a.pos.y;
    if (ey > (S.heavy ? 1.9 : 1.55) || ey + h < (S.heavy ? -0.9 : -0.35)) continue;
    const fwd = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx);
    const ang = Math.atan2(lat, fwd);
    if (ang > half && !(d < hr + 0.4 && fwd > -0.15)) continue;
    _v.set(e.pos.x, e.pos.y + (e.smoothY || 0) + Math.min(h * 0.6, 0.85), e.pos.z);
    if (!G.physics.los(_v3, _v)) continue;
    S.hits.add(e);
    if (G.subs?.blockShot(_v3, _v, a.team, dmg)) { if (heard(a)) G.audio?.play('blade_hit', { pos: _v, volume: 0.4, pitch: 1.4 }); continue; }
    G.projectiles.applyHit(a, e, dmg, 'blade');
    // contact: where the edge meets the body
    _v2.copy(_v).sub(_v3); const l = _v2.length() || 1; _v2.multiplyScalar(1 / l);
    _v.copy(_v3).addScaledVector(_v2, Math.max(0.2, l - hr));
    if (heard(a) || e.isLocal) {
      const col = G.teamColors[a.team] || a.color;
      G.fx?.burst(_v, _v2.negate(), col, { count: S.heavy ? 18 : 10, speed: S.heavy ? 6 : 4, size: 0.09, mist: true });
      G.audio?.play('blade_hit', { pos: a.isLocal ? undefined : _v, volume: a.isLocal ? 0.6 : 0.5, pitch: S.heavy ? 0.78 : 1 });
    }
    if (a.isLocal) emit('shake', { amount: S.heavy ? 0.22 : 0.06 });
    rumble(a, S.heavy ? 0.4 : 0.15, S.heavy ? 0.45 : 0.2, S.heavy ? 140 : 60);
    emit('blade:hit', { actor: a, victim: e, damage: dmg, heavy: S.heavy });
  }
  // devices in reach (sprinklers, beacons, curtains) and bubbles: the blade cuts them too — once per swing
  if (!S.dev) {
    S.dev = true;
    _v.set(a.pos.x + fx * reach * 0.6, a.pos.y + 0.8, a.pos.z + fz * reach * 0.6);
    G.subs?.damageArea?.(_v, reach * 0.75, dmg * 0.6, a.team);
  }
}

// ------------------------------------------------------------------------------------------ the ink wave
const WAVES = [];
function spawnWave(a, w, S) {
  const pitch = Math.abs(S.pitch) < 0.3 ? S.pitch * 0.4 : clamp(S.pitch, -0.45, 0.35);
  const cp = Math.cos(pitch);
  const dir = new THREE.Vector3(Math.sin(S.yaw) * cp, Math.sin(pitch), Math.cos(S.yaw) * cp);
  const pos = new THREE.Vector3(a.pos.x + Math.sin(S.yaw) * 0.55, a.pos.y + w.waveHeight * 0.52, a.pos.z + Math.cos(S.yaw) * 0.55);
  // starting inside a wall (hugging cover): the wave is born where the wall is and bursts there
  _v.set(a.pos.x, pos.y, a.pos.z);
  const col = (G.teamColors[a.team] || a.color).clone();
  const W = { owner: a, team: a.team, pos, prev: pos.clone(), dir, dist: 0, t: 0, hits: new Set(), paintAcc: 0.3, dying: -1, sp: S.sp, col, fx: BladeFX.waveMesh(col), w };
  if (!G.physics.los(_v, pos)) { W.pos.copy(_v); W.prev.copy(_v); }
  WAVES.push(W);
  emit('weapon:fire', { actor: a, weapon: w.id, cut: 'charged', muzzle: pos.clone(), dir: dir.clone() });
}
function endWave(W, at, normal) {
  W.dying = 0.14;
  const col = W.col;
  if (at) {
    const area = G.paint.splat(_v.copy(at).addScaledVector(normal, 0.1), W.w.waveEndRadius, W.team, { seed: Math.random() });
    credit(W.owner, area, W.sp);
    emit('weapon:impact', { pos: at.clone(), normal: normal.clone(), team: W.team, kind: 'drop', radius: W.w.waveEndRadius });
    if (G.camera && G.camera.position.distanceToSquared(at) < 30 * 30) {
      G.fx?.burst(at, normal, col, { count: 16, speed: 5, size: 0.1, mist: true });
      G.audio?.play('splat_big', { pos: at, volume: 0.5 });
    }
  } else {
    // spent: the wave slumps into a spatter of drops that paint where they land
    const g = G.physics.raycast(W.pos, DOWN, 3, _hit2, true);
    if (g.hit) credit(W.owner, G.paint.splat(_v.copy(g.point).addScaledVector(g.normal, 0.1), W.w.waveEndRadius * 0.85, W.team, { seed: Math.random(), stretch: _n.set(W.dir.x, 0, W.dir.z).normalize(), stretchAmt: 0.6 }), W.sp);
    if (G.fx && G.camera && G.camera.position.distanceToSquared(W.pos) < 30 * 30) {
      for (let i = 0; i < 8; i++) {
        _v.copy(W.pos); _v.y += (Math.random() - 0.5) * 1.2;
        _v2.copy(W.dir).multiplyScalar(3 + Math.random() * 3); _v2.y = Math.random() * 1.5;
        G.fx.drop(_v, _v2, col, { size: 0.05 + Math.random() * 0.04, life: 0.8, paint: false });
      }
    }
  }
}
function updateWaves(dt) {
  for (let i = WAVES.length - 1; i >= 0; i--) {
    const W = WAVES[i], w = W.w;
    W.t += dt;
    if (W.dying >= 0) {
      W.dying -= dt;
      if (W.fx) W.fx.mesh.material.uniforms.uFade.value = Math.max(0, W.dying / 0.14);
      if (W.dying <= 0) { BladeFX.freeWave(W.fx); WAVES.splice(i, 1); }
      else placeWave(W);
      continue;
    }
    const step = w.waveSpeed * dt;
    W.prev.copy(W.pos);
    W.pos.addScaledVector(W.dir, step);
    W.dist += step;
    // enemies inside the crescent's sweep (a tall, narrow slab moving along dir); each is hit once
    const hx = W.dir.x, hz = W.dir.z, hl = Math.hypot(hx, hz) || 1, ux = hx / hl, uz = hz / hl;
    const dmg = lerp(w.waveDamage, w.waveDamageFar, clamp(W.dist / w.waveRange, 0, 1));
    for (const e of G.actors) {
      if (e.team === W.team || !e.alive || W.hits.has(e)) continue;
      const hr = e.hitR || PLAYER.radius, h = e.hitH || (e.form === 'squid' ? PLAYER.squidHeight : PLAYER.height);
      const ex = e.pos.x - W.prev.x, ez = e.pos.z - W.prev.z;
      const along = ex * ux + ez * uz;
      if (along < -hr || along > step * hl + hr) continue;
      if (Math.abs(ex * uz - ez * ux) > w.waveWidth * 0.5 + hr) continue;
      const cy = W.prev.y + (W.pos.y - W.prev.y) * clamp(along / Math.max(1e-4, step * hl), 0, 1);
      const y0 = e.pos.y + (e.smoothY || 0);
      if (y0 + h < cy - w.waveHeight * 0.55 || y0 > cy + w.waveHeight * 0.45) continue;
      W.hits.add(e);
      G.projectiles.applyHit(W.owner, e, dmg, 'blade');
      if (G.camera && G.camera.position.distanceToSquared(e.pos) < 30 * 30) {
        _v.set(e.pos.x, y0 + Math.min(h * 0.6, 0.9), e.pos.z);
        G.fx?.burst(_v, _v2.copy(W.dir).negate(), W.col, { count: 12, speed: 4.5, size: 0.09 });
      }
    }
    // shields, curtains, devices and bubbles catch it; walls break it
    let stop = false;
    if (G.subs?.blockShot(W.prev, W.pos, W.team, dmg) || G.specials?.shotHit(W.prev, W.pos, W.team, dmg, W.owner)) { endWave(W, W.pos.clone(), _n.copy(W.dir).negate()); stop = true; }
    if (!stop) {
      const hit = G.physics.segment(W.prev, W.pos, _hit, true);
      if (hit.hit) { W.pos.copy(hit.point); endWave(W, hit.point, hit.normal); stop = true; }
    }
    // a straight stripe of ink along its path
    W.paintAcc += step;
    if (!stop && W.paintAcc >= w.wavePaintEvery) {
      W.paintAcc = 0;
      const g = G.physics.raycast(W.pos, DOWN, w.waveHeight * 0.52 + 1.4, _hit2, true);
      if (g.hit) {
        _n.set(ux, 0, uz);
        const area = G.paint.splat(_v.copy(g.point).addScaledVector(g.normal, 0.08), w.wavePaintRadius * (0.9 + Math.random() * 0.2), W.team, { seed: Math.random(), stretch: _n, stretchAmt: 0.85 });
        credit(W.owner, area, W.sp);
      }
    }
    if (!stop && W.dist >= w.waveRange) { endWave(W, null, null); stop = true; }
    // spray off the crescent (FX)
    if (!stop && G.fx && Math.random() < 0.6 && G.camera && G.camera.position.distanceToSquared(W.pos) < 28 * 28) {
      _v.copy(W.pos); _v.y += (Math.random() - 0.5) * w.waveHeight * 0.8;
      _v2.set(W.dir.x * w.waveSpeed * 0.25 + (Math.random() - 0.5) * 2, 0.5 + Math.random(), W.dir.z * w.waveSpeed * 0.25 + (Math.random() - 0.5) * 2);
      G.fx.drop(_v, _v2, W.col, { size: 0.035 + Math.random() * 0.03, life: 0.5 });
    }
    placeWave(W);
  }
}
function placeWave(W) {
  if (!W.fx) return;
  const m = W.fx.mesh, w = W.w;
  _z.copy(W.dir).normalize();
  _x.crossVectors(UP, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize();
  _y.crossVectors(_z, _x).normalize();
  _m.makeBasis(_x, _y, _z);
  m.quaternion.setFromRotationMatrix(_m);
  m.position.copy(W.pos);
  const grow = Math.min(1, 0.55 + W.t * 6);
  m.scale.set(w.waveWidth * 1.45 * grow, w.waveHeight * 0.5 * grow, 1.0 + Math.min(1, W.dist / 4) * 0.9);
  m.material.uniforms.uT.value = W.t;
}

// ------------------------------------------------------------------------------------------ the kit
MAIN_KITS.blade = {
  update(R, dt, inp, w) {
    const a = R.a, K = st(R);
    if (G.time - K.lastT > 0.3) { cancelCharge(R, K); K.held = false; K.swing = null; K.lunge = 0; K.queued = 0; }   // resumed after a special took the trigger
    K.lastT = G.time;
    K.cd -= dt; K.since += dt; K.flashT += dt; K.queued = Math.max(0, K.queued - dt);
    if (K.swing) runSwing(R, K, dt, w);
    const raw = !!a.intent.fire;
    const canAct = a.form !== 'squid' && (a.kidT ?? 99) >= PLAYER.emergeDelay && a.alive;
    if (!canAct) {
      // squid / emerging: a charge keeps while the trigger stays held (briefly), and is lost once it's let go
      if (K.charging) { K.store += dt; a.lastFire = 0; if (!raw || K.store > w.chargeStore) cancelCharge(R, K); }
      K.held = K.held && raw;
      R.charge = K.charge;
      return;
    }
    K.store = 0;
    const auto = coreDriven(a);
    let fire = inp.fire;
    if (!fire && K.charging && botHolds(a)) fire = true;
    // press: a quick cut right away (mashing faster than the swing buffers the next one)
    if (inp.firePressed || (auto && fire && K.cd <= 0)) {
      if (K.cd <= 0) tap(R, K, w); else K.queued = 0.16;
      K.held = true; K.holdT = 0;
    } else if (K.queued > 0 && K.cd <= 0 && !K.charging) { K.queued = 0; tap(R, K, w); }
    if (fire && K.held) {
      K.holdT += dt;
      // held past the cut: the blade rises and charges
      if (!auto && !K.charging && K.holdT >= w.chargeDelay && !(K.swing && K.swing.heavy)) {
        K.charging = true; K.charge = 0; K.full = false;
        if (heard(a)) { stopHum(R); HUMS.set(R, G.audio?.loop('blade_charge', { pos: sndPos(a), volume: a.isLocal ? 0.5 : 0.32, pitch: 1 })); }
      }
      if (K.charging) {
        const cap = a.ink >= w.heavyInk ? 1 : 0.94;              // not enough ink for the heavy cut: it never completes
        K.charge = Math.min(cap, K.charge + dt / w.chargeTime);
        if (K.charge >= 1 && !K.full) {
          K.full = true;
          if (heard(a)) G.audio?.play('blade_ready', { pos: sndPos(a), volume: a.isLocal ? 0.6 : 0.4 });
          rumble(a, 0.06, 0.3, 60);
        }
        if (cap < 1 && K.charge >= cap && !K.lowWarned && a.isLocal) { K.lowWarned = true; R._empty(); }
        HUMS.get(R)?.set({ pitch: 1 + 0.6 * K.charge + (K.full ? 0.02 * Math.sin(G.time * 40) : 0), pos: sndPos(a) });
        a.fireFacing = Math.max(a.fireFacing, 0.35); R.firingT = Math.max(R.firingT, 0.3); a.lastFire = 0;   // no idle refill mid-charge
      }
    } else if (K.held && !fire) {
      // release
      K.held = false; K.lowWarned = false;
      if (K.charging) {
        const c = K.charge;
        cancelCharge(R, K);
        if (c >= 1) heavy(R, K, w);
        else if (c >= 0.3) { if (K.cd <= 0.04) { K.cd = 0; tap(R, K, w); } else K.queued = 0.16; }
      }
    }
    R.charge = K.charge;
  },
  reset(R) { stopHum(R); },
  // (a charge doesn't make the runner busy: you can dive with it held — see chargeStore — and swim on)
  busy(R) { const K = R.kit; return !!K && !!K.swing; },
  firingPose(R) { const K = R.kit; return !!K && (K.charging || (!!K.swing && K.swing.t < 0.3)); },
  moveSpeed(R, w) {
    const K = R.kit; if (!K) return 0;
    if (K.swing && K.swing.heavy && K.swing.t < 0.3) return w.moveSpeedFiring * 0.55;   // planted after the lunge
    if (K.charging) return w.moveSpeedCharging;
    if (R.firingT > 0) return w.moveSpeedFiring;
    return 0;
  },
  tick(dt) {
    BladeFX.tick(dt);
    updateWaves(dt);
    for (const [R] of HUMS) { const K = R.kit; if (!K || !K.charging || R.a.weapon?.kind !== 'blade' || !R.a.alive) stopHum(R); }
  },
  clear() {
    for (const W of WAVES) BladeFX.freeWave(W.fx);
    WAVES.length = 0;
    BladeFX.clear();
    for (const [R] of HUMS) stopHum(R);
  },

  // ---------------------------------------------------------------------------------------- bots
  // Aggressive: close in, cut at mid range, charge on the way in and release when the enemy is in blade reach (or send
  // the wave when they keep their distance). MELEE (bots.js) already walks them straight at a target within 7 m.
  bot: {
    paintPitch: -0.2,
    fight(brain, ctx) {
      const { a, w, dist, dt } = ctx;
      const K = a.weaponRunner.kit || {};
      const B = brain._bl || (brain._bl = { plan: 'tap', t: 0, press: false, hold: 0, patience: 0.5 });
      B.t -= dt;
      if (K.charging) {
        B.hold += dt;
        const cut = K.full && dist <= w.reach + 0.9;                                  // in blade reach (+ the lunge): splat
        const wave = K.full && dist > 3 && dist < w.waveRange * 0.9 && B.hold > B.patience;   // they kept their distance
        const late = B.hold > 2.6 || (!K.full && dist < 1.6);                        // never got in / they rushed us
        if (cut || wave || late) { brain._blHold = -1; return false; }
        brain._blHold = G.time;
        return true;
      }
      brain._blHold = -1; B.hold = 0;
      if (B.t <= 0) {
        B.t = 0.6 + Math.random() * 1.0;
        const r = Math.random();
        // beyond the cuts' reach: poke with the wave (else close in); mid range: mostly quick cuts, sometimes a charge on
        // the way in; up close: quick cuts (two splat)
        if (dist > w.range * 0.95 && dist < w.waveRange * 0.9) { B.plan = r < 0.55 ? 'charge' : 'tap'; B.patience = 0; }
        else if (dist > 2.6 && dist <= w.range * 0.95) { B.plan = r < 0.18 && a.hp > 50 ? 'charge' : 'tap'; B.patience = 0.8 + Math.random() * 0.7; }
        else B.plan = 'tap';
      }
      if (B.plan === 'charge' && dist < w.waveRange && a.ink > w.heavyInk + 6) { brain._blHold = G.time; return true; }
      // quick cuts: pulse the trigger (the runner's swing interval paces them)
      if (dist < w.range * 1.05) { B.press = !B.press; return B.press; }
      return false;
    },
    paint(brain, ctx) {
      const { a, w, needPaint, inkFrac, wantMove, dt } = ctx;
      const K = a.weaponRunner.kit || {};
      const B = brain._bl || (brain._bl = { plan: 'tap', t: 0, press: false, hold: 0, patience: 0.5, waveT: 3 });
      B.waveT = (B.waveT ?? 3) - dt;
      if (K.charging) {
        if (K.full) { brain._blHold = -1; B.waveT = 3.5 + Math.random() * 3; return false; }   // loose a paint wave down the lane
        brain._blHold = G.time; return true;
      }
      brain._blHold = -1;
      // now and then, with a long way to go and ink to spare: charge a wave to paint a long stripe ahead
      if (B.waveT <= 0 && wantMove && inkFrac > 0.35 && needPaint && (brain._pathRemaining?.() ?? 0) > 9) { brain._blHold = G.time; return true; }
      if (needPaint && inkFrac > 0.1 && wantMove) { B.press = !B.press; return B.press; }
      return false;
    },
  },
};
