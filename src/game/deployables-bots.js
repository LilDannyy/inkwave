// [b5-deploy] Bots and enemy deployables (src/game/deployables.js). With nothing better to shoot — no foe in sight, not
// refilling / retreating / climbing, nothing else drawing its aim (a threat, a canopy, a sprout pod) — a bot shoots down
// an enemy Hop Beacon, Twirl
// Sprinkler or Surf N' Turf buoy it can see (a wall between: it isn't seen — no wall-hacks), the nearest first (a
// beacon, then a buoy, ahead of a sprinkler a little nearer: the jump point and the rings hurt more).
// FOOTWORK: bots.js calls this BEFORE Tower Command's footwork, the wall climb and the enemy-specials awareness
// (botSpecials.js act: the escape, the danger guard, Drainbow's hold), so those have the last word on where it steps —
// it never walks into a noticed danger for a device. Free to roam (Turf War, a free bot in any mode): it walks up until
// the device is well inside its reach (a straight walk with floor all the way; a roller / brush runs right over it, drum
// or bristles down), then plants for the shots. Tied to a task, it only shoots what's in its reach from where its task
// takes it, and never walks for one: every Tower Command role (a rider from the deck only, never while it's getting on;
// escorts, perches … on their route), in Zone Control anything not on a live zone, and a bot hunting a foe it lost
// sight of (the hunt is its task: only a device in reach on the way).
// Every weapon by its own trigger: bots.js _devTrigger (a roller's flick / a brush's swipe in their window, a short
// spinner / splatling burst, a bow ring), a charger at full charge (one shot breaks either).
// GIVING UP: a device it has been on for DEV_GIVEUP s in all (summed over every time it went back to it — a foe seen,
// a refill, a climb break it off) is left alone for DEV_FORGET s. A re-pick of a device it was on before isn't a new pick.
// It took over sp-surf-bots.js surfShootAim (buoys only, steady-trigger weapons only); SURF_BOT.shots still counts the
// buoys. (A Skitter Bomb hunting a bot is a threat: deployables.js threats → bots.js _threatScan.)
// No import of deployables.js here (botSpecials.js loads this early): the live devices come from G.deploy.devices().
import { G, angleDiff } from '../core/ctx.js';
import { weaponRange } from '../config.js';
import { SURF_BOT } from './sp-surf-bots.js';
import { MAIN_KITS } from './kits/registry.js';

// picks: devices taken on (a device once); repicks: going back to one it was on before; secs: seconds in device mode
// (all bots); fired: frames with the trigger down for one; gaveUp: left alone after DEV_GIVEUP s on it
export const DEV_BOT = { picks: 0, repicks: 0, beacon: 0, sprinkler: 0, surf: 0, frames: 0, secs: 0, walkSecs: 0, blockedSecs: 0, fired: 0, gaveUp: 0 };
export const DEV_AI = { enabled: true };   // (match harnesses switch it off for an A/B: match.cjs / tower-match.cjs DEV_AI=0)
export function resetDevBot() { for (const k in DEV_BOT) DEV_BOT[k] = 0; }
const PREFER = { beacon: 0.8, surf: 0.85, sprinkler: 1 };   // (its distance × this: the pick)
const MELEE = { roller: true, brush: true };   // (bots.js MELEE; kit melee weapons say so themselves: bot.melee)
const _list = [];
// (still standing and still in the world: a clear() — a new match, a test's next scene — drops them without a death)
const live = (kind, o) => (kind === 'surf' ? !o.dead && o.phase === 'live' && !!G.specials?.world.includes(o)
  : o.state === (kind === 'sprinkler' ? 'spray' : 'beacon') && !!G.subs?.items.includes(o));

export const DEV_GIVEUP = 8, DEV_FORGET = 12;   // s on one device (in all) before giving up on it; s it's left alone after
const NOTICE = 10;                               // m: a free bot notices an enemy device in sight this near whatever its reach
const ROLL = { roller: true, brush: true };
// the device it's on, dropped (its time on it is kept: mem)
const drop = (sense) => { sense._dev = null; };

// the aim to hold ({ yaw, pitch, dist }), the trigger and the footwork (move: the bot's move command, world x / z), or
// null. tp: Tower Command's team plan (bots.js towerPlan(), else null), onT: on the tower now; zp: Zone Control's
export function devShootAim(sense, dt, it, move, tp = null, onT = false, zp = null) {
  const b = sense.b, a = b.a, w = a.weapon, D = G.deploy;
  // (hunting a foe it lost sight of: that's its task — a device in reach on the way gets shot, none walked to)
  const hunting = b.mode === 'fight' && !!b.target;
  if (!D || !DEV_AI.enabled || (b.mode !== 'paint' && !hunting) || (b.target && b.seeTimer > 0) || a.climbing || b._clE || a.specialActive || a.superJumpState
    || a.ink < Math.max(6, w.inkPerShot || 0)) { drop(sense); return null; }
  // Tower Command: every role keeps its task (a rider shoots from the deck only — none while it's getting on)
  const tower = !!tp;
  if (tower && b.tRole === 'ride' && !onT) { drop(sense); return null; }
  const melee = !!(MELEE[w.kind] || MAIN_KITS[w.kind]?.bot?.melee);
  const win = melee && b._meleeWindow ? b._meleeWindow(w, { ground: true, state: 'still' }) : [0, weaponRange(w) * 0.95];
  const mem = sense._devMem || (sense._devMem = new Map());   // device → { kind, busy: s on it in all, skip: left alone till }
  let d = sense._dev, rec = d ? mem.get(d.obj) : null;
  if (d && !live(d.kind, d.obj)) { mem.delete(d.obj); d = sense._dev = null; }
  else if (d && !rec) mem.set(d.obj, rec = { kind: d.kind, busy: 0, skip: 0 });
  const free = (x) => !tower && !hunting && (!zp || zp.onActive(x.pos.x, x.pos.y, x.pos.z));   // (may it walk for this one?)
  if (!d) {
    if ((sense._devT = (sense._devT || 0) - dt) > 0) return null;
    sense._devT = 0.35;
    for (const [o, r] of mem) if (!live(r.kind, o)) mem.delete(o);
    // (noticed out to a little past its reach — at least NOTICE m — when it may walk up to the rest; tied to a task, only
    // what it can shoot from here)
    const ex = a.pos.x, ey = a.pos.y + 1.1, ez = a.pos.z, reach = Math.max(win[1] * 1.25, weaponRange(w) * 0.95 * 1.25, NOTICE);
    let bs = Infinity;
    _list.length = 0;
    for (const x of D.devices(_list)) {
      if (x.team === a.team || !PREFER[x.kind] || (mem.get(x.obj)?.skip ?? 0) > G.time) continue;
      const dd = Math.hypot(x.aim.x - ex, x.aim.z - ez), dy = x.aim.y - ey;
      if (dd > (free(x) ? reach : win[1]) || Math.abs(dy) > 4) continue;
      const s = dd * PREFER[x.kind];
      if (s >= bs || !G.physics.los(sense._e || (sense._e = x.aim.clone()).set(ex, ey, ez), x.aim)) continue;
      bs = s; d = x;
    }
    _list.length = 0;
    if (!d) return null;
    sense._dev = d;
    rec = mem.get(d.obj);
    if (rec) DEV_BOT.repicks++;
    else {
      mem.set(d.obj, rec = { kind: d.kind, busy: 0, skip: 0 });
      DEV_BOT.picks++; DEV_BOT[d.kind]++;
      if (d.kind === 'surf') SURF_BOT.shots++;
    }
  }
  // (its time on it, summed over every time it came back to it)
  if ((rec.busy += dt) > DEV_GIVEUP) { rec.skip = G.time + DEV_FORGET; rec.busy = 0; drop(sense); DEV_BOT.gaveUp++; return null; }
  // (its middle now: it may ride the tower)
  const o = d.obj, n = o.normal, hh = d.kind === 'surf' ? 0 : o.mesh.userData.hitH * 0.5;
  const px = d.kind === 'surf' ? o.pos.x : o.pos.x + (n ? n.x : 0) * hh, py = d.kind === 'surf' ? o.pos.y + 0.6 : o.pos.y + (n ? n.y : 1) * hh, pz = d.kind === 'surf' ? o.pos.z : o.pos.z + (n ? n.z : 0) * hh;
  const dx = px - a.pos.x, dy = py - (a.pos.y + 1.1), dz = pz - a.pos.z, dh = Math.hypot(dx, dz), d3 = Math.hypot(dh, dy);
  const roam = free(d);
  if (!roam && dh > win[1]) { drop(sense); return null; }   // (tied to a task, and it's out of reach from here: leave it)
  DEV_BOT.frames++; DEV_BOT.secs += dt;
  // footwork (free to roam only): up to well inside its reach (a roller / brush: right over it), then plant for the shots
  const over = ROLL[w.kind] && d.kind !== 'surf';   // (a buoy is too big to roll over: flick / swipe at it)
  const near = over ? 0.6 : melee ? win[1] * 0.85 : w.kind === 'charger' ? win[1] * 0.85 : Math.min(win[1] * 0.7, 9);
  let walking = false;
  if (roam && move) {
    if (dh > near + 0.3 && dh > 0.3) {
      const ux = dx / dh, uz = dz / dh;
      // (a noticed danger on the straight way there — a vortex, a cloud, a wail's line …: no walk into it. It keeps to its
      // own route, which goes round noticed dangers, shooting from where that takes it; the danger guard after this has
      // the last word on every step as well)
      let blocked = false;
      for (let k = 0.5; k <= Math.min(dh, 4) && !blocked; k += 0.5) blocked = sense._inAny(a.pos.x + ux * k, a.pos.y, a.pos.z + uz * k, k / 6, null);
      if (blocked) DEV_BOT.blockedSecs += dt;
      else if (!b._dryLine || b._dryLine(a.pos.x, a.pos.y, a.pos.z, a.pos.x + ux * Math.min(dh, 2.5), a.pos.z + uz * Math.min(dh, 2.5))) { move.set(ux, 0, uz); walking = true; DEV_BOT.walkSecs += dt; }
      else move.multiplyScalar(0.2);
      if (!blocked) { b.noProg = 0; b.bestD = Infinity; }   // (off its route on purpose: not "stuck")
    } else { move.multiplyScalar(0.2); b.noProg = 0; b.bestD = Infinity; }
  }
  a.fireFacing = Math.max(a.fireFacing || 0, 0.25);   // square up to it (a flick / swipe / roll leaves along the body)
  // (a roller's flick at something on the ground: aim low — it arcs down onto it, as bots.js does for a Waddle)
  const yaw = Math.atan2(dx, dz), pitch = w.kind === 'roller' ? -0.3 : Math.atan2(dy, Math.max(0.5, dh));
  it.squid = false;
  const off = Math.hypot(angleDiff(b.aimYaw, yaw), b.aimPitch - pitch);
  const tol = Math.max(0.035, Math.atan2(0.26, Math.max(0.5, d3))) * (sense._devOn ? 2.2 : 1.3);
  const wr = a.weaponRunner;
  if (over && roam && dh < 3) it.fire = true;   // drum / bristles down, running into it
  else if (w.kind === 'charger') it.fire = wr.charging ? !(off < tol && wr.charge >= 0.999) : off < tol * 4 && !(wr.cooldown > 0) && !walking;   // (a full charge: one shot)
  else it.fire = b._devTrigger ? b._devTrigger(d3, off < tol, off < tol * 4, win[0], win[1]) : off < tol;
  sense._devOn = it.fire && off < tol;
  if (it.fire) DEV_BOT.fired++;
  return { yaw, pitch, dist: Math.max(1, d3) };
}
