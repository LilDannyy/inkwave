// Super-jump landings and Ink Jet / Zipline return points as one list that every view reads: the world tags, the
// corner minimap, the TAB map and the "jumping to you" alert (src/ui/hud-jumps.js). Added for b5-jumpui on 2026-10-04.
// The user asked:
//   "Give an on screen alert when a teammate is jumping to you and their name, as well as a name around the super jump
//    icon, and an indicator for when they're landing."
//   "like the super jump minimap indicator, if someone is using zipline or inkjet, add an indicator when they start
//    using the special so players know where they'd super jump to, and where the player will jump back when it ends"
//
// landingMarks() lists the marks live on this screen, once per frame (cached on G.time). Each mark is a pooled record:
//   kind     'jump': a super jump in progress (charge or flight) to a teammate, a Hop Beacon or the base. A jump home
//            from Ink Jet / Zipline has no 'jump' mark; its 'return' mark stands for it.
//            'return': an Ink Jet / Zipline take-off point (specials.js ReturnMarker), from the moment the special
//            starts until its owner is back on it.
//   actor    the jumper, or the Ink Jet / Zipline user
//   x, y, z  the landing spot. A charging jump uses the target's jumpAnchor() (a teammate's feet, or their take-off
//            point while they're up on Ink Jet / Zipline). In flight it is the jump's own `to`. A return mark uses the
//            take-off point.
//   left     seconds until touchdown. For a 'jump': the charge still to run plus the flight (sjFlightDur, the flight
//            time Actor._updateSuperJump uses), then the flight's own clock. For a 'return': the special's time left
//            plus the flight home, then that flight's clock.
//   total    left as it was when the mark first showed (a 'return' mark keeps it through the flight home), so
//            left / total drains the countdown ring from full to empty at touchdown
//   target   (jumps) the teammate being jumped to, or null (a beacon, the base)
//   icon     'sj' for a super jump, or the special's id ('jetpack' / 'zipcaster') for a return mark
//   phase    'charge' | 'flight' (jumps); 'out' (the special running) | 'home' (flying back) (returns)
// incomingJumps(me) lists the teammates' jumps whose target is `me`: the alert.
//
// Online: a remote player's super jump is drawn from its owner's records. The actor tick only says charge or flight
// (net/netmatch.js F.sjCharge / F.sjFlight). The owner's 'superjump' events now also carry the target, whether it's a
// jump home, an instant launch, and the flight's from / to / duration (actor.js). sjNetEvent / sjNetFill put those on
// the remote player's superJumpState with its own clock, so every screen reads the same jump. That covers these marks
// and also the parts that were already there: the travel lines on the minimap and the TAB map (superJumpInfo), the world
// reticle (fxHooks), a jump to that player while they're in the air (jumpAnchor) and a ghost return marker's
// colour-to-grey wipe. A jump onto a teammate riding Tower Command's tower lands on the moving deck: as on the owner's
// screen, the landing spot rides this screen's tower through the flight.
import { G } from '../core/ctx.js';

export const SJ_CHARGE = 0.75;   // s crouching before the launch (Actor._updateSuperJump)
// flight time of a super jump between two points (Actor._updateSuperJump uses this; the countdown predicts with it)
export function sjFlightDur(from, to) {
  if (!from || !to) return 1.15;
  return 1.15 + Math.min(0.6, Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) / 80);
}

const pool = new Map();          // key (the jumper / the ReturnMarker) → record
const list = [];
let listT = -1, listM = null;
function rec(key, kind, a) {
  let r = pool.get(key);
  if (!r || r.kind !== kind || r.actor !== a) {
    r = { key, kind, actor: a, team: a.team, x: 0, y: 0, z: 0, left: 0, total: 0, target: null, icon: 'sj', phase: '', seen: 0, born: G.time };
    pool.set(key, r);
  }
  r.team = a.team;
  return r;
}

/** Every landing mark live on this screen (see the top). Recomputed once per frame; the array and records are reused. */
export function landingMarks() {
  const m = G.match;
  if (listT === G.time && listM === m) return list;
  listT = G.time; listM = m;
  list.length = 0;
  if (!m || m.attract) { pool.clear(); return list; }
  const stamp = (listT * 1000) | 0;
  // super jumps in progress
  for (const a of m.actors) {
    const s = a.alive ? a.superJumpState : null;
    if (!s || s.home) continue;
    const tg = s.target;
    const r = rec(a, 'jump', a);
    if (s.phase === 'flight') {
      if (!s.to) continue;
      r.x = s.to.x; r.y = s.to.y; r.z = s.to.z;
      r.left = Math.max(0, (s.dur || sjFlightDur(s.from, s.to)) - (s.t || 0));
    } else {
      const p = tg && tg.pos && tg.pos.isVector3 ? (tg.jumpAnchor ? tg.jumpAnchor() : tg.pos) : tg && tg.isVector3 ? tg : null;
      if (!p || !Number.isFinite(p.x + p.z)) continue;   // (a remote jump whose target hasn't arrived yet)
      r.x = p.x; r.y = p.y; r.z = p.z;
      r.left = Math.max(0, SJ_CHARGE - (s.t || 0)) + sjFlightDur(a.pos, p);
    }
    r.target = tg && tg.pos && tg.pos.isVector3 ? tg : null;
    r.icon = 'sj'; r.phase = s.phase;
    if (!(r.total >= r.left)) r.total = r.left;
    r.seen = stamp;
    list.push(r);
  }
  // Ink Jet / Zipline take-off points (specials.js ReturnMarker: kind 'return')
  for (const w of G.specials?.world || []) {
    if (w.kind !== 'return' || w.done || !w.owner) continue;
    const a = w.owner, s = a.specialActive;
    const r = rec(w, 'return', a);
    r.x = w.pos.x; r.y = w.pos.y; r.z = w.pos.z;
    r.icon = w.icon || 'jetpack'; r.target = null;
    if (s && s.marker === w && !s.ended) {
      r.phase = 'out';
      r.left = Math.max(0, (s.dur || 0) - (s.t || 0)) + sjFlightDur(a.pos, w.pos);
    } else {
      const j = a.alive ? a.superJumpState : null;
      if (!w.back || !a.alive) continue;
      r.phase = 'home';
      // (no jump showing yet: a ghost's owner's launch is a frame or two behind the end record)
      r.left = j && j.phase === 'flight' && j.to ? Math.max(0, (j.dur || sjFlightDur(j.from, j.to)) - (j.t || 0)) : sjFlightDur(a.pos, w.pos);
    }
    if (!(r.total >= r.left)) r.total = r.left;
    r.seen = stamp;
    list.push(r);
  }
  for (const [k, r] of pool) if (r.seen !== stamp) pool.delete(k);
  return list;
}

/** The teammates' super jumps coming down on `me` (the alert): marks of kind 'jump' whose target is `me`. */
export function incomingJumps(me, out = []) {
  out.length = 0;
  if (!me) return out;
  for (const r of landingMarks()) if (r.kind === 'jump' && r.target === me && r.actor !== me && r.actor.team === me.team) out.push(r);
  return out;
}

// ------------------------------------------------------------------------------------------------ online
/** net/netmatch.js _playEvent('superjump'): a remote player's jump as its owner announced it. */
export function sjNetEvent(a, e) {
  const n = a && a.net;
  if (!n) return;
  if (e.phase === 'charge') {
    n.sjEv = { s: null, target: e.target || null, home: !!e.home, instant: !!e.instant, from: null, to: null, dur: 0 };
  } else if (e.phase === 'flight') {
    let v = n.sjEv;
    if (!v || (v.s && v.s !== a.superJumpState)) v = n.sjEv = { s: null, target: null, home: !!e.home, instant: false, from: null, to: null, dur: 0 };
    v.home = !!e.home;
    v.to = e.to && e.to.isVector3 ? e.to.clone() : null;
    v.from = e.from && e.from.isVector3 ? e.from.clone() : a.pos.clone();
    v.dur = +e.dur || sjFlightDur(v.from, v.to);
    // a jump onto a teammate riding Tower Command's tower: the owner's landing follows the tower's deck through the
    // flight (Actor._updateSuperJump s.tower / towerOff); here too, from this screen's tower (sjNetFill)
    const T = G.match?.tower, tg = v.target;
    v.tower = T && v.to && tg && tg.pos && tg.pos.isVector3 && T.riderList && T.riderList.includes(tg) ? T : null;
    v.off = v.tower ? v.to.clone().sub(T.pos) : null;
  }
}
/** net/netmatch.js applyRemote, after the tick's flags set superJumpState: its clock and what the events said. */
export function sjNetFill(a, dt) {
  const n = a && a.net, s = a && a.superJumpState;
  if (!n || !s) return;
  if (s._ph !== s.phase) { s._ph = s.phase; s.t = 0; } else s.t = (s.t || 0) + dt;
  const v = n.sjEv;
  if (!v || (v.s && v.s !== s)) return;   // (an older jump's word: wait for this one's)
  if (!v.s) { v.s = s; if (s.phase === 'charge' && v.instant) s.t = SJ_CHARGE; }
  s.target = v.target; s.home = v.home;
  if (v.to) { s.from = v.from; s.to = v.to; s.dur = v.dur; }
  if (v.tower) { if (G.match?.tower === v.tower) { v.to.copy(v.tower.pos).add(v.off); n.sjTo = v.to; } else v.tower = null; }   // (netmatch's landing ring rides it too)
}
