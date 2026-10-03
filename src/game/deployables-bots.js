// [b5-deploy] Bots and enemy deployables (src/game/deployables.js). With no foe in sight, a bot shoots down an enemy
// Hop Beacon, Twirl Sprinkler or Surf N' Turf buoy in its weapon's reach and in sight — a wall between: it isn't seen
// (no wall-hacks) — the nearest first (a beacon, then a buoy, ahead of a sprinkler a little nearer: the jump point and
// the rings hurt more). Footwork: it walks up until the device is well inside its reach (a straight walk with floor
// all the way; a roller / brush runs right over it, drum or bristles down; a tower rider stays on the deck), then plants
// for the shots. Every weapon by its own trigger: bots.js _devTrigger (a roller's flick / a brush's swipe in their
// window, a short spinner / splatling burst, a bow ring), a charger at full charge (one shot breaks either). A device it
// can't break in DEV_GIVEUP s is
// left alone for a while. It takes over sp-surf-bots.js surfShootAim (buoys only, steady-trigger weapons only) in
// BotSpecials.act; SURF_BOT.shots still counts the buoys. (A Skitter Bomb hunting a bot is a threat: deployables.js
// threats → bots.js _threatScan.)
// No import of deployables.js here (botSpecials.js loads this early): the live devices come from G.deploy.devices().
import { G, angleDiff } from '../core/ctx.js';
import { weaponRange } from '../config.js';
import { SURF_BOT } from './sp-surf-bots.js';
import { MAIN_KITS } from './kits/registry.js';

export const DEV_BOT = { picks: 0, beacon: 0, sprinkler: 0, surf: 0, frames: 0, fired: 0, gaveUp: 0 };
export function resetDevBot() { for (const k in DEV_BOT) DEV_BOT[k] = 0; }
const PREFER = { beacon: 0.8, surf: 0.85, sprinkler: 1 };   // (its distance × this: the pick)
const MELEE = { roller: true, brush: true };   // (bots.js MELEE; kit melee weapons say so themselves: bot.melee)
const _list = [];
const live = (d) => (d.kind === 'surf' ? !d.obj.dead && d.obj.phase === 'live' : d.obj.state === (d.kind === 'sprinkler' ? 'spray' : 'beacon'));

const DEV_GIVEUP = 8, DEV_FORGET = 12;   // s on one device before giving up on it; s it's left alone after
const NOTICE = 10;                        // m: an enemy device in sight this near is noticed whatever the weapon's reach
const ROLL = { roller: true, brush: true };
// the aim to hold ({ yaw, pitch, dist }), the trigger and the footwork (move: the bot's move command, world x / z), or
// null (BotSpecials.act: after its own escapes / throws)
export function devShootAim(sense, dt, it, move) {
  const b = sense.b, a = b.a, w = a.weapon, D = G.deploy;
  if (!D || b.mode === 'refill' || a.climbing || a.specialActive || a.superJumpState || a.ink < Math.max(6, w.inkPerShot || 0) || (b.target && b.seeTimer > 0)) { sense._dev = null; return null; }
  const melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
  const win = melee && b._meleeWindow ? b._meleeWindow(w, { ground: true, state: 'still' }) : [0, weaponRange(w) * 0.95];
  const skip = sense._devSkip || (sense._devSkip = new Map());
  let d = sense._dev;
  if (d && !live(d)) d = sense._dev = null;
  if (d && G.time - sense._devT0 > DEV_GIVEUP) { skip.set(d.obj, G.time + DEV_FORGET); d = sense._dev = null; DEV_BOT.gaveUp++; }
  if (!d) {
    if ((sense._devT = (sense._devT || 0) - dt) > 0) return null;
    sense._devT = 0.35;
    // (noticed out to a little past its reach — at least NOTICE m: it walks up to the rest)
    const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z, reach = Math.max(win[1] * 1.25, weaponRange(w) * 0.95 * 1.25, NOTICE);
    let bs = Infinity;
    _list.length = 0;
    for (const x of D.devices(_list)) {
      if (x.team === a.team || !PREFER[x.kind] || (skip.get(x.obj) ?? 0) > G.time) continue;
      const dd = Math.hypot(x.aim.x - ex, x.aim.z - ez), dy = x.aim.y - ey;
      if (dd > reach || Math.abs(dy) > 4) continue;
      const s = dd * PREFER[x.kind];
      if (s >= bs || !G.physics.los(sense._e || (sense._e = x.aim.clone()).set(ex, ey, ez), x.aim)) continue;
      bs = s; d = x;
    }
    _list.length = 0;
    if (!d) return null;
    sense._dev = d; sense._devT0 = G.time; DEV_BOT.picks++; DEV_BOT[d.kind]++;
    if (d.kind === 'surf') SURF_BOT.shots++;
  }
  DEV_BOT.frames++;
  // (its middle now: it may ride the tower)
  const o = d.obj, n = o.normal, hh = d.kind === 'surf' ? 0 : o.mesh.userData.hitH * 0.5;
  const px = d.kind === 'surf' ? o.pos.x : o.pos.x + (n ? n.x : 0) * hh, py = d.kind === 'surf' ? o.pos.y + 0.6 : o.pos.y + (n ? n.y : 1) * hh, pz = d.kind === 'surf' ? o.pos.z : o.pos.z + (n ? n.z : 0) * hh;
  const dx = px - a.pos.x, dy = py - (a.pos.y + 1.1), dz = pz - a.pos.z, dh = Math.hypot(dx, dz), d3 = Math.hypot(dh, dy);
  // footwork: up to well inside its reach (a roller / brush: right over it), then plant for the shots
  const over = ROLL[w.kind] && d.kind !== 'surf';   // (a buoy is too big to roll over: flick / swipe at it)
  const near = over ? 0.6 : melee ? win[1] * 0.85 : w.kind === 'charger' ? win[1] * 0.85 : Math.min(win[1] * 0.7, 9);
  // (a tower rider keeps riding: it only shoots from where it stands — Tower Command's own footwork moves it)
  const T = G.match?.tower, rooted = b.tRole === 'ride' || !!(T && T.riderList?.includes(a));
  let walking = false;
  if (rooted) { /* */ } else if (move && dh > near + 0.3 && dh > 0.3) {
    const ux = dx / dh, uz = dz / dh;
    if (!b._dryLine || b._dryLine(a.pos.x, a.pos.y, a.pos.z, a.pos.x + ux * Math.min(dh, 2.5), a.pos.z + uz * Math.min(dh, 2.5))) { move.set(ux, 0, uz); walking = true; }
    else move.multiplyScalar(0.2);
  } else if (move) move.multiplyScalar(0.2);
  if (rooted && dh > win[1]) { sense._dev = null; return null; }   // (out of reach from the deck: leave it)
  a.fireFacing = Math.max(a.fireFacing || 0, 0.25);   // square up to it (a flick / swipe / roll leaves along the body)
  b.noProg = 0; b.bestD = Infinity;                    // (off its route on purpose: not "stuck")
  // (a roller's flick at something on the ground: aim low — it arcs down onto it, as bots.js does for a Waddle)
  const yaw = Math.atan2(dx, dz), pitch = w.kind === 'roller' ? -0.3 : Math.atan2(dy, Math.max(0.5, dh));
  it.squid = false;
  const off = Math.hypot(angleDiff(b.aimYaw, yaw), b.aimPitch - pitch);
  const tol = Math.max(0.035, Math.atan2(0.26, Math.max(0.5, d3))) * (sense._devOn ? 2.2 : 1.3);
  const wr = a.weaponRunner;
  if (over && dh < 3) it.fire = true;   // drum / bristles down, running into it
  else if (w.kind === 'charger') it.fire = wr.charging ? !(off < tol && wr.charge >= 0.999) : off < tol * 4 && !(wr.cooldown > 0) && !walking;   // (a full charge: one shot)
  else it.fire = b._devTrigger ? b._devTrigger(d3, off < tol, off < tol * 4, win[0], win[1]) : off < tol;
  sense._devOn = it.fire && off < tol;
  if (it.fire) DEV_BOT.fired++;
  return { yaw, pitch, dist: Math.max(1, d3) };
}
