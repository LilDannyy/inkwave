// Bubble Guard chain [b5-sprules] (the user: "If a bubble is shared to a teammate, that player can also share the bubble
// to another teammate."). The special itself lives in specials.js (IMPL.bubbler, giveShield, the force fields' per-frame
// loop, filterDamage); this is who may pass a field on, and how.
//
//   chains     every Bubble Guard used starts a chain (giveShield(a, time, true) → its own new chain); every copy
//              shared from it, and from those copies, belongs to that chain (a._shieldChain)
//   passing    a shielded player passes it on by touch (within SPECIALS.bubbler.shareRange) to a teammate who has
//              none: the user's own field while their special runs (as before), and now ANY copy — a teammate who got
//              one shares it on, and so does whoever got it from them, down the line; the copy carries the time LEFT on
//              the one it came from (never a fresh timer), so the whole chain runs out together
//   one each   a player carries one field at a time (one with a field takes no other) and takes each chain once
//              (a._bgHad): no ping-pong — A → B → A never happens, nor B splatted and topped up again by C from the
//              same bubble; a new Bubble Guard (a new chain) can reach them again
//   outliving  copies never depended on their source: the owner splatted (their own field drops with them) leaves
//              every shared copy up for its time, and those copies keep passing it on
//
// Online: whoever owns the RECEIVER decides (its own squidkid; the host its bots), as for damage — each screen hands
// copies only to the players it owns, from its view of everyone's synced positions, and records it on the receiver:
// ['k', receiverNid, 'sp', [5, giverNid, time left, chain owner nid]] → every other screen gives that player the same
// copy (SpecialSystem.netGhost case 5 → shieldNet). The user's own field still comes from their special's start record
// (IMPL.bubbler.start runs on every screen).
//
// Bots: a bot carrying a field it can pass on (≥ botMin s left) steps over to a teammate close by on its level who has
// none and hasn't had this chain (botShare: botSpecials.js SpecialSense.act, after the danger checks).
import { G, emit } from '../core/ctx.js';
import { SPECIALS } from '../config.js';
import { netRec } from './kits/registry.js';

export const CHAIN = { botReach: 5, botMin: 1.2 };   // m a bot walks over to pass it on; s a field needs left for that
export const CHAIN_STATS = { shares: 0, chained: 0, net: 0, botSteps: 0 };   // (tests / match.cjs)
const r2 = (x) => Math.round(x * 100) / 100;
const NETC = new Map();   // chain owner nid → a stand-in chain for copies whose giver this screen can't place

// the field a now carries belongs to chain c (owner: the user's own Bubble Guard — a new chain); a takes it once
export function joinChain(a, c, owner) {
  if (!c && owner) c = { by: a, nid: a.nid ?? -1, t: G.time };
  a._shieldChain = c || null;
  if (c) (a._bgHad || (a._bgHad = new WeakSet())).add(c);
}
// can a pass its field on? the user's own while their special runs; any copy
const canPass = (a) => !!a._shieldChain && (!a._shieldOwner || a.specialActive?.id === 'bubbler');
// may o take a copy of chain c from a?
const takes = (a, o, c) => o !== a && o.team === a.team && o.alive && !(o.status.shield > 0) && !(o._bgHad && o._bgHad.has(c));

// per frame for every shielded player a (SpecialSystem.update): pass it on to teammates touching it — the players this
// screen owns (offline: everyone), each recorded for the other screens
export function shareShield(sys, a) {
  const c = a._shieldChain;
  if (!c || !canPass(a) || !a.alive) return;
  const R = SPECIALS.bubbler.shareRange;
  for (const o of G.actors) {
    if (o.remote || !takes(a, o, c) || o.superJumpState?.phase === 'flight') continue;
    if (o.pos.distanceTo(a.pos) >= R) continue;
    const left = a.status.shield;
    sys.giveShield(o, left, false, c);
    netRec(o, 'sp', [5, a.nid ?? -1, r2(left), c.nid ?? -1]);
    CHAIN_STATS.shares++;
    if (!a._shieldOwner) CHAIN_STATS.chained++;
    emit('special:share', { from: a, to: o, time: left, chained: !a._shieldOwner });
  }
}

// another screen's word that player a got a copy: [5, giver nid, time left, chain owner nid]
export function shieldNet(sys, a, d) {
  if (!a || !a.alive || !(d[2] > 0)) return;
  const from = G.actors.find((e) => e.nid === d[1]) || null;
  // (the giver's chain as this screen knows it; else one keyed by its owner's nid — only a screen that later owns this
  // player would ever ask it again)
  let c = from && from._shieldChain && from._shieldChain.nid === d[3] ? from._shieldChain : null;
  if (!c) { c = NETC.get(d[3]); if (!c || c.t < G.time - 2 * SPECIALS.bubbler.duration) NETC.set(d[3], (c = { by: null, nid: d[3], t: G.time })); }
  a.status.shield = 0;   // (its owner's word: this copy, this time — not the max with whatever this screen guessed)
  sys.giveShield(a, d[2], false, c);
  CHAIN_STATS.net++;
  emit('special:share', { from, to: a, time: d[2], chained: !!(from && !from._shieldOwner), remote: true });
}

// bots pass it on: step over to a teammate close by (≤ botReach m, on our level, no field, not had this chain) while
// ours has botMin s or more left (move: the bot's wanted step this frame)
export function botShare(b, move) {
  const a = b.a, c = a._shieldChain;
  if (!a.alive || !c || !(a.status.shield > CHAIN.botMin) || !canPass(a) || a.superJumpState || a.climbing) return;
  let best = null, bd = CHAIN.botReach;
  for (const o of G.actors) {
    if (!takes(a, o, c) || o.superJumpState || Math.abs(o.pos.y - a.pos.y) > 1.2) continue;
    const d = Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z);
    if (d < bd) { bd = d; best = o; }
  }
  if (!best || bd < 0.5) return;
  const ux = (best.pos.x - a.pos.x) / bd, uz = (best.pos.z - a.pos.z) / bd;
  // (never off a ledge to get there)
  if (G.level.groundHeight(a.pos.x + ux * 1.2, a.pos.z + uz * 1.2, a.pos.y + 1) < a.pos.y - 1.5) return;
  move.x = move.x * 0.3 + ux * 0.7; move.z = move.z * 0.3 + uz * 0.7;
  const l = Math.hypot(move.x, move.z); if (l > 1) { move.x /= l; move.z /= l; }
  CHAIN_STATS.botSteps++;
}

G.bubbleChain = { CHAIN, CHAIN_STATS, share: shareShield, net: shieldNet, botShare, canPass };
