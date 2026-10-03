// [b5-deploy] Bots and enemy deployables (src/game/deployables.js). With no foe in sight, a bot shoots down an enemy
// Hop Beacon, Twirl Sprinkler or Surf N' Turf buoy in its weapon's reach and in sight — a wall between: it isn't seen
// (no wall-hacks) — the nearest first (a beacon, then a buoy, ahead of a sprinkler a little nearer: the jump point and
// the rings hurt more). Every weapon by its own trigger: bots.js _devTrigger (a roller's flick / a brush's swipe in
// their window, a short spinner / splatling burst, a bow ring), a charger at full charge (one shot breaks either).
// It takes over sp-surf-bots.js surfShootAim (buoys only, steady-trigger weapons only) in BotSpecials.act; SURF_BOT.shots
// still counts the buoys. (A Skitter Bomb hunting a bot is a threat: deployables.js threats → bots.js _threatScan.)
// No import of deployables.js here (botSpecials.js loads this early): the live devices come from G.deploy.devices().
import { G, angleDiff } from '../core/ctx.js';
import { weaponRange } from '../config.js';
import { SURF_BOT } from './sp-surf-bots.js';
import { MAIN_KITS } from './kits/registry.js';

export const DEV_BOT = { picks: 0, beacon: 0, sprinkler: 0, surf: 0, frames: 0, fired: 0 };
export function resetDevBot() { for (const k in DEV_BOT) DEV_BOT[k] = 0; }
const PREFER = { beacon: 0.8, surf: 0.85, sprinkler: 1 };   // (its distance × this: the pick)
const MELEE = { roller: true, brush: true };   // (bots.js MELEE; kit melee weapons say so themselves: bot.melee)
const _list = [];
const live = (d) => (d.kind === 'surf' ? !d.obj.dead && d.obj.phase === 'live' : d.obj.state === (d.kind === 'sprinkler' ? 'spray' : 'beacon'));

// the aim to hold ({ yaw, pitch, dist }) and the trigger, or null (BotSpecials.act: after its own escapes / throws)
export function devShootAim(sense, dt, it) {
  const b = sense.b, a = b.a, w = a.weapon, D = G.deploy;
  if (!D || b.mode === 'refill' || a.climbing || a.specialActive || a.superJumpState || a.ink < Math.max(6, w.inkPerShot || 0) || (b.target && b.seeTimer > 0)) { sense._dev = null; return null; }
  const melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
  const win = melee && b._meleeWindow ? b._meleeWindow(w, { ground: true, state: 'still' }) : [0, weaponRange(w) * 0.95];
  let d = sense._dev;
  if (d && !live(d)) d = sense._dev = null;
  if (!d) {
    if ((sense._devT = (sense._devT || 0) - dt) > 0) return null;
    sense._devT = 0.35;
    const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z;
    let bs = Infinity;
    _list.length = 0;
    for (const x of D.devices(_list)) {
      if (x.team === a.team || !PREFER[x.kind]) continue;
      const dd = Math.hypot(x.aim.x - ex, x.aim.z - ez), dy = x.aim.y - ey;
      if (dd > win[1] || dd < win[0] || Math.abs(dy) > 4) continue;
      const s = dd * PREFER[x.kind];
      if (s >= bs || !G.physics.los(sense._e || (sense._e = x.aim.clone()).set(ex, ey, ez), x.aim)) continue;
      bs = s; d = x;
    }
    _list.length = 0;
    if (!d) return null;
    sense._dev = d; DEV_BOT.picks++; DEV_BOT[d.kind]++;
    if (d.kind === 'surf') SURF_BOT.shots++;
  }
  DEV_BOT.frames++;
  // (its middle now: it may ride the tower)
  const o = d.obj, n = o.normal, hh = d.kind === 'surf' ? 0 : o.mesh.userData.hitH * 0.5;
  const px = d.kind === 'surf' ? o.pos.x : o.pos.x + (n ? n.x : 0) * hh, py = d.kind === 'surf' ? o.pos.y + 0.6 : o.pos.y + (n ? n.y : 1) * hh, pz = d.kind === 'surf' ? o.pos.z : o.pos.z + (n ? n.z : 0) * hh;
  const dx = px - a.pos.x, dy = py - (a.pos.y + 1.1), dz = pz - a.pos.z, dh = Math.hypot(dx, dz), d3 = Math.hypot(dh, dy);
  // (a roller's flick at something on the ground: aim low — it arcs down onto it, as bots.js does for a Waddle)
  const yaw = Math.atan2(dx, dz), pitch = w.kind === 'roller' ? -0.3 : Math.atan2(dy, Math.max(0.5, dh));
  it.squid = false;
  const off = Math.hypot(angleDiff(b.aimYaw, yaw), b.aimPitch - pitch);
  const tol = Math.max(0.035, Math.atan2(0.26, Math.max(0.5, d3))) * (sense._devOn ? 2.2 : 1.3);
  const wr = a.weaponRunner;
  if (w.kind === 'charger') it.fire = wr.charging ? !(off < tol && wr.charge >= 0.999) : off < tol * 4 && !(wr.cooldown > 0);   // (a full charge: one shot)
  else it.fire = b._devTrigger ? b._devTrigger(d3, off < tol, off < tol * 4, win[0], win[1]) : off < tol;
  sense._devOn = it.fire && off < tol;
  if (it.fire) DEV_BOT.fired++;
  return { yaw, pitch, dist: Math.max(1, d3) };
}
