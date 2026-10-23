// Small in-memory issue ring shared by the desktop and hosted builds.
import { G } from './ctx.js';

const CAP = 500, entries = new Array(CAP), pending = [];
let head = 0, size = 0, installed = false, sendAt = 0;
const stuck = new WeakMap();   // [b5-beta1] per bot brain: the stuck watch (bots below)
const original = {};
const clean = (v) => {
  let s = String(v == null ? '' : v).replace(/\b[A-Z0-9]{5,8}\b/g, '[code]');
  for (const a of [...(G.match?.actors || []), ...(G.net?.lobby?.players || [])]) if (a?.name) s = s.split(String(a.name)).join('[player]');
  return s.slice(0, 1200);
};
function details() {
  const m = G.match, stage = G.game?.mapDef?.id || G.level?.mapId || null;
  return { build: window.inkwaveNative?.buildCommit?.() || document.querySelector('meta[name="inkwave-build"]')?.content || 'unknown', mode: m?.mode || G.mode || 'unknown', stage,
    era: m?.stage?.era ?? G.stageWorld?.era ?? null, lava: m?.lava?.state ?? G.lava?.state ?? null, online: !!G.netm };
}
function append(kind, message, extra = {}) {
  const row = { at: new Date().toISOString(), kind, message: clean(message), ...details(), ...extra };
  entries[head] = row; head = (head + 1) % CAP; size = Math.min(CAP, size + 1);
  if (pending.length === CAP) pending.shift(); pending.push(row);
  if (window.inkwaveNative?.issue) window.inkwaveNative.issue(row);
  else if (location.protocol !== 'app:') schedulePost();
  return row;
}
function snapshot() { const out = new Array(size); for (let i = 0; i < size; i++) out[i] = entries[(head - size + i + CAP) % CAP]; return out; }
function schedulePost() { if (sendAt) return; sendAt = setTimeout(() => { sendAt = 0; flush(); }, 10000); }
function flush() {
  if (!pending.length || location.protocol === 'app:') return;
  const batch = []; let bytes = 16;
  while (pending.length) { const row = pending[0], n = JSON.stringify(row).length + 1; if (batch.length && bytes + n > 7800) break; batch.push(pending.shift()); bytes += n; }
  fetch('/issue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entries: batch }), keepalive: true, credentials: 'same-origin' }).catch(() => {});
  if (pending.length) schedulePost();
}
export const issueLog = { append, snapshot, flush, frame(ms) { if (G.mode === 'match' && G.match && !G.match.loading && ms > 250) append('slow-frame', `frame ${Math.round(ms)} ms`); },
  // [b5-beta1] a bot stuck the way the botlab harnesses judge it (match.cjs, tower-match.cjs, karp-match.cjs): sampled every
  // 0.25 s of match time, wanting to move (alive, not super-jumping, charging a shot or the Carp Shot, pinned by a special,
  // riding the tower or holding a spot on purpose: BotBrain.holdingOnPurpose) and under 1 m from every place it was in
  // the last 3 s; one entry when an episode passes 5 s, with what the bot was doing. (It used to compare positions frame
  // to frame — 0.08 m a frame is 4.8 m/s at 60 Hz, 9.6 m/s at 120 — so a bot strafing, walking while firing or waiting on
  // purpose read as stuck once its noProg ticked.)
  bots(dt) {
    const m = G.match, actors = m?.actors; if (!actors || m.attract || m.paused || m.state !== 'playing') return;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i], b = a.bot; if (!b || (a.isLocal === false && a.remote)) continue;
      let s = stuck.get(b); if (!s) stuck.set(b, (s = { acc: 0, t: 0, h: [], ep: null }));
      s.acc += dt; if (s.acc < 0.25) continue;
      s.acc = Math.min(s.acc - 0.25, 0.25); s.t += 0.25;
      const h = s.h; h.push({ t: s.t, x: a.pos.x, z: a.pos.z });
      while (h.length && s.t - h[0].t > 3) h.shift();
      const wants = a.alive && !a.superJumpState && !a.weaponRunner?.charging && !a.carry?.gun?.charging && !a.specialActive?.pin
        && !m.tower?.riderList?.includes(a) && !b.holdingOnPurpose?.();
      let span = 0; for (const p of h) span = Math.max(span, Math.hypot(p.x - a.pos.x, p.z - a.pos.z));
      if (!(wants && h.length >= 11 && span < 1)) { s.ep = null; continue; }
      const ep = s.ep || (s.ep = { dur: 0, logged: false });
      ep.dur += 0.25;
      if (ep.dur > 5 && !ep.logged) {
        ep.logged = true;
        const r1 = (v) => Math.round(v * 10) / 10, nd = (id) => { const n = id >= 0 && G.nav?.nodes?.[id]; return n ? [r1(n.x), r1(n.y), r1(n.z)] : null; };
        const p = b.path, pi = b.pi | 0, e = p && pi > 0 && pi < p.length ? G.nav?.edge?.(p[pi - 1], p[pi]) : null;
        append('stuck-bot', 'bot stuck episode exceeded 5 seconds', { duration: ep.dur, pos: [r1(a.pos.x), r1(a.pos.y), r1(a.pos.z)], botMode: b.mode || null,
          role: b.zRole || b.tRole || b.kRole || null, path: p ? `${pi}/${p.length}` : null, next: p ? nd(p[pi]) : null, edgeIn: e ? e.type || 'walk' : null, goal: nd(b.goal),
          noProg: r1(b.noProg || 0), carry: !!a.carry, pipe: !!a.pipe, climbing: !!a.climbing });
      }
    }
  } };
if (typeof window !== 'undefined') window.__issueLog = issueLog;
if (!installed && typeof window !== 'undefined') {
  installed = true;
  for (const k of ['error', 'warn']) { original[k] = console[k]; console[k] = function (...args) { append(`console-${k}`, args.map((x) => x?.stack || x?.message || String(x)).join(' ')); return original[k].apply(this, args); }; }
  window.addEventListener('error', (e) => append('window-error', e.message || e.error?.stack || 'window error'));
  window.addEventListener('unhandledrejection', (e) => append('unhandled-rejection', e.reason?.stack || e.reason?.message || e.reason));
  window.addEventListener('beforeunload', flush);
}
