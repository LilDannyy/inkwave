// Assists (2026-10-02, with Surf N' Turf). The game had no assist stat; now a player earns one when a foe they helped
// with is splatted by one of their teammates:
//   damage   they hurt that foe (any amount, any weapon / sub / special) within ASSIST.damage s before the splat
//   jump     (the user's rule) their Surf N' Turf ring forced that foe to jump over it (src/game/sp-surf.js judges the
//            dodge) within ASSIST.jump s before the splat — "if you force a player to jump, that causes a short delay
//            in the background to count splatting that player as an assist"
// At most one assist per splat per player, never to the splatter (that's already a splat) and only when the splatter is
// on the helper's team (a foe who drowns with nobody's hit on them gives no one anything).
//
// Where it's judged: where the splat is — the victim's owner (offline: everyone is local). Its screen applies every hit
// on that player (net/netmatch.js: hits land on the victim's owner) and judges every dodge (the victim's own position),
// so the ledger below sees everything. actor.splat() asks judge() before it emits 'splatted', and the event carries the
// helpers: `assists` (actors, this screen) and, online, `as` (their net ids, "3,5") — netmatch forwards the event and
// every other screen credits the same players from `as` (NetMatch._remoteSplat → creditPacked). The host's final count
// carries stats.assists to every screen with the rest of the results (sendResult / _result).
import { G, on, emit } from '../core/ctx.js';
import { SPECIALS } from '../config.js';

// seconds a helper's mark on a foe lasts. (Splatoon 3 doesn't publish its window; ~3 s matches how it plays: a chip of
// damage just before a teammate's splat counts, one from an earlier fight doesn't.)
export const ASSIST = { damage: 3.0, jump: SPECIALS.surf?.jumpAssist ?? 3.5 };
export const ASSIST_STATS = { jumps: 0, byDamage: 0, byJump: 0, credited: 0 };   // forced jumps noted; assists judged by each rule (tests / match.cjs)

const LEDGER = new WeakMap();   // victim → Map(helper → { dmg: time of their last hit, jump: time of the last forced jump })
function rec(victim, helper) {
  let L = LEDGER.get(victim);
  if (!L) LEDGER.set(victim, (L = new Map()));
  let e = L.get(helper);
  if (!e) L.set(helper, (e = { dmg: -1e9, jump: -1e9 }));
  return e;
}
const foes = (a, b) => !!a && !!b && a !== b && a.team !== b.team;

/** helper hurt victim just now (the 'damage' event: the victim's owner's screen) */
export function noteDamage(victim, helper) { if (foes(victim, helper)) rec(victim, helper).dmg = G.time; }
/** helper's ring made victim jump over it just now (sp-surf.js, on the victim's owner's screen) */
export function noteJump(victim, helper) { if (foes(victim, helper)) { rec(victim, helper).jump = G.time; ASSIST_STATS.jumps++; } }
/** the open windows on victim right now: [{ helper, kind, left }] (tests, bots) */
export function windowsOn(victim) {
  const L = LEDGER.get(victim), out = [];
  if (!L) return out;
  for (const [helper, e] of L) {
    const d = ASSIST.damage - (G.time - e.dmg), j = ASSIST.jump - (G.time - e.jump);
    if (d > 0 || j > 0) out.push({ helper, kind: j > 0 ? 'jump' : 'damage', left: Math.max(d, j) });
  }
  return out;
}
/** victim was splatted by killer: who gets an assist (an array, maybe empty). Clears victim's ledger. */
export function judge(victim, killer) {
  const L = LEDGER.get(victim);
  LEDGER.delete(victim);
  const out = [];
  if (!L || !killer || killer.team === victim.team) return out;
  for (const [helper, e] of L) {
    if (helper === killer || helper === victim || helper.team !== killer.team) continue;
    const byJump = G.time - e.jump <= ASSIST.jump, byDmg = G.time - e.dmg <= ASSIST.damage;
    if (!byJump && !byDmg) continue;
    out.push(helper);
    if (byDmg) ASSIST_STATS.byDamage++; else ASSIST_STATS.byJump++;   // (only the jump: the user's rule did it)
  }
  return out;
}
/** online: the helpers as net ids ("3,5"; '' offline / none) */
export function pack(list) { return list && list.length ? list.map((a) => a.nid).filter((n) => n !== undefined).join(',') : ''; }
export function credit(list, victim = null) {
  for (const a of list || []) {
    if (!a || !a.stats) continue;
    a.stats.assists = (a.stats.assists || 0) + 1;
    ASSIST_STATS.credited++;
    emit('assist', { actor: a, victim });
  }
}
/** another screen's splat event (net/netmatch.js): its `as` field → this screen's actors */
export function creditPacked(as, byNid, victim = null) {
  if (!as || typeof as !== 'string') return;
  credit(as.split(',').map((n) => byNid.get(+n)).filter(Boolean), victim);
}

// the ledger: every hit on a player whose damage this screen applies
on('damage', ({ victim, attacker, amount }) => { if (amount > 0) noteDamage(victim, attacker); });
// this screen's own splats (the victim's owner): the event carries its helpers
on('splatted', ({ victim, assists }) => { if (assists && assists.length) credit(assists, victim); });

G.assists = { judge, credit, creditPacked, pack, noteJump, noteDamage, windowsOn, ASSIST, ASSIST_STATS };
