// Bomb Barrages (special kind 'barrage': config SPECIALS.barrage, barrage_sticky … and [b5-sprules] barrage_waddle,
// barrage_mystery). For a few seconds you throw one kind of bomb as fast as its `gap` allows, no ink, your main weapon
// still working (the throw itself: weapons.js WeaponRunner.update — `bar.bomb`, `bar.gap`, then emit('barrage:throw')).
// [b5-sprules] moved here from specials.js (IMPL.barrage) with the two new ones:
//   Waddle Bomb Barrage   the Waddle Bomb (src/game/kits/waddle.js) — each one lands, senses, waddles after a foe near
//                         it and bursts (the barrage's are special bombs: their ink never charges the meter, `sp`)
//   Mystery Bomb Barrage  (the user: "mystery bomb barrage (changes bomb each time you throw)") every throw is a
//                         different bomb, drawn at random from `mystery` (the bombs the barrages throw, the Waddle
//                         included): a shuffled round of all of them, never the same one twice running (the round's
//                         first is never the last round's last), so a long run of throws covers every kind evenly. The
//                         next one shows before you throw it — in your hand (the sub prop), on the arc preview (its
//                         throw speed), the HUD's NEXT card by the crosshair and the sub badge on the special gauge
//                         (src/ui/hud-barrage.js), the hint line — and each throw waits its OWN bomb's barrage gap
//                         (a Pop Pellet 0.2 s … a Skitter / Waddle 0.5 s).
// Online: the variant is the special's start record ([0, index]); the Mystery's owner records each next bomb as the
// special's moment ['k', nid, 'sp', [4, 'nb', SUB_ORDER index]] (on start and after every throw) so every screen shows the
// same bomb in that player's hand; the throws themselves are the bombs' own records (weapons.js 'b', subs.js, the kits'
// 'k' — the Waddle's [0 …]), as for every barrage.
// Bots: bots.js fires any 'barrage' (its throw rhythm, the bombs' own bot aim — the Waddle lobs itself just short of its
// foe); botSpecials.js reads every bomb thrown during one (or 3.5 s after) as the barrage's, Waddles included.
import { G, emit, on } from '../core/ctx.js';
import { SPECIALS, SUBS, SUB_ORDER } from '../config.js';
import { registerSpecial } from './specials.js';
import { netRec } from './kits/registry.js';
import { SPECIAL_ICONS, SUB_ICONS } from '../ui/ui-icons.js';
import './kits/waddle.js';   // (its icon, model and kit registered before ours read them)

const rec = (a, d) => netRec(a, 'sp', d);
// counters (tests / match.cjs): throws per bomb kind (the Mystery's), the Mystery's draws
export const BARRAGE_STATS = { throws: {}, draws: 0, repeats: 0 };

// a bomb kind's gap between throws: its own barrage's (the Mystery throws each one at the pace its barrage would)
const GAP = {};
export function gapOf(kind, def) {
  if (GAP[kind] === undefined) {
    const v = Object.values(SPECIALS).find((d) => d.kind === 'barrage' && !d.mystery && d.bomb === kind);
    GAP[kind] = v ? v.gap : null;
  }
  return GAP[kind] ?? def.gap;
}
// the Mystery's next bomb: from a shuffled round of every kind; never the one just thrown
function draw(s) {
  const L = s.def.mystery;
  if (!s.bag || !s.bag.length) {
    const b = L.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = b[i]; b[i] = b[j]; b[j] = t; }
    if (b.length > 1 && s.bomb && b[0] === s.bomb.kind) { const t = b[0]; b[0] = b[b.length - 1]; b[b.length - 1] = t; }
    s.bag = b;
  }
  const k = s.bag.shift();
  BARRAGE_STATS.draws++;
  if (s.bomb && k === s.bomb.kind) BARRAGE_STATS.repeats++;
  return k;
}
// the bomb in hand now (send: the owner records it for everyone else's screen)
function setBomb(a, s, kind, send) {
  s.bomb = SUBS[kind] || SUBS.bomb;
  s.gap = gapOf(s.bomb.kind, s.def);
  s.nb = (s.nb || 0) + 1;   // (the HUD: one more bomb shown)
  a.character?.setSub?.(s.bomb.kind);
  if (send) rec(a, [4, 'nb', SUB_ORDER.indexOf(s.bomb.kind)]);
  emit('barrage:next', { actor: a, kind: s.bomb.kind, special: s });
}

const IMPL = {
  start(a, s) {
    s.nextThrow = 0;
    if (s.def.mystery) setBomb(a, s, draw(s), true);
    else setBomb(a, s, s.def.bomb, false);
  },
  end(a) { a.character.setSub?.(a.sub.kind); a.weaponRunner.aimingSub = false; },
  prompt(a, s) {
    if (s.def.mystery) return `Mystery Bomb Barrage! Next: ${s.bomb.name} — throw with RMB / E, no ink needed`;
    return `${s.def.name}! Throw ${s.bomb.name}s with RMB / E — no ink needed`;
  },
};
// another player's (the start record builds it; the Mystery's bombs come from its owner's [4, 'nb'] records)
const GHOST = {
  start(a, s) { s.nextThrow = 0; setBomb(a, s, s.def.bomb, false); },
  event(a, s, d) { if (d[1] === 'nb' && SUBS[SUB_ORDER[d[2]]]) setBomb(a, s, SUB_ORDER[d[2]], false); },
};
registerSpecial('barrage', IMPL, GHOST);

// a barrage throw (weapons.js, the owner's): the Mystery draws its next bomb
on('barrage:throw', ({ actor: a, special: s, kind }) => {
  if (!a || !s || s.ghost || a.specialActive !== s) return;
  BARRAGE_STATS.throws[kind] = (BARRAGE_STATS.throws[kind] || 0) + 1;
  if (s.def.mystery) setBomb(a, s, draw(s), true);
});

// ================================================================================================= icons
// as the other variants: three of the sub's own icon falling under the barrage's motion streaks (ui-icons.js); the
// Mystery: a big bomb with a question mark on it, between a Cling Charge and a Waddle Bomb
{
  const K = '#15121c', DK = '#2b2735';
  const svg = (body) => `<svg class="iw-ico " viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
  const inner = (s) => String(s || '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const streaks = `<g stroke-linecap="round"><path d="M12 3 L12 11 M32 2 L32 8 M52 3 L52 11" stroke="${K}" stroke-width="6.5"/><path d="M12 3 L12 11 M32 2 L32 8 M52 3 L52 11" stroke="currentColor" stroke-width="2.8"/></g>`;
  const at = (body, x, y, sc, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc}) translate(-32 -32)">${body}</g>`;
  const wad = inner(SUB_ICONS.waddle);
  SPECIAL_ICONS.barrage_waddle = svg(streaks + [[16.5, 36, 0.44, -14], [47.5, 36, 0.44, 14], [32, 42, 0.56, 0]].map(([x, y, sc, r]) => at(wad, x, y, sc, r)).join(''));
  // the mystery bomb: the Splat Bomb's body, a "?" where its light is
  const q = `<g stroke="${K}" stroke-width="3" stroke-linejoin="round"><rect x="26.5" y="6" width="11" height="10" rx="3" fill="${DK}"/>
      <path d="M32 13 C38 13 53 39 53 46 C53 53 46 56.5 32 56.5 C18 56.5 11 53 11 46 C11 39 26 13 32 13 Z" fill="currentColor"/></g>
    <path d="M25.5 34.5 Q25.5 27.5 32.5 27.5 Q39.5 27.5 39.5 33.5 Q39.5 37.5 34.5 39.5 Q32.5 40.5 32.5 43.5" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M25.5 34.5 Q25.5 27.5 32.5 27.5 Q39.5 27.5 39.5 33.5 Q39.5 37.5 34.5 39.5 Q32.5 40.5 32.5 43.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32.5" cy="50" r="3.4" fill="#fff" stroke="${K}" stroke-width="2.2"/>`;
  SPECIAL_ICONS.barrage_mystery = svg(streaks + at(inner(SUB_ICONS.sticky), 15, 38, 0.4, -16) + at(wad, 49, 38, 0.4, 16) + at(q, 32, 40, 0.66, 0));
  SPECIAL_ICONS.mystery_bomb = svg(q);   // (the HUD's NEXT card before its first draw)
}
