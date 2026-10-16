// [b5-int3] the Mac mini's measurement tables: node agg-int3.cjs <set> <dir of match.cjs OUT jsons>
//   A  Zone Control forgiveness   A-<code>-<map>-<i>.json   (code: base 7759085 / head b97b3eb)
//   B  Cheer Orb A/B, zones       B-<map>-t<side>.json      (SPECIALS=team<side>=booyah, the other team random)
//   C  all rollers, Turf War      C-<code>-<map>-<i>.json
//   D  barrages, Turf War         D-<special>-<map>-<i>.json (SPECIALS=all=<special>)
//   E  subs                       E-<mode>-<sub>-<map>-<i>.json (SUBS=all=<sub>)
// Each set: one row per match, then the means. "err" = console lines / frame errors.
const fs = require('fs'), path = require('path');
const [set, dir] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.startsWith(set + '-') && f.endsWith('.json')).sort();
const load = (f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return null; } };
const all = files.map((f) => ({ f, k: f.slice(set.length + 1, -5).split('-'), r: load(f) }));
const mean = (a) => { const b = a.filter((x) => Number.isFinite(x)); return b.length ? b.reduce((s, x) => s + x, 0) / b.length : NaN; };
const f1 = (v) => (Number.isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '-'), f2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '-');
const P = (s, n) => String(s).padEnd(n), err = (r) => `${r.consoleLines || 0}/${r.frameErr?.n || 0}`;
const sum = (o) => Object.values(o || {}).reduce((s, v) => s + (+v || 0), 0);
const missing = all.filter((x) => !x.r).map((x) => x.f);
if (missing.length) console.log(`(no result: ${missing.join(', ')})`);
const ok = all.filter((x) => x.r);
const groups = (i) => [...new Set(ok.map((x) => x.k[i]))];

if (set === 'A') {
  for (const code of groups(0)) {
    const L = ok.filter((x) => x.k[0] === code);
    console.log(`A ${code}: map | winner (reason) | final counts | margin | lead changes | first take s | contested % | OT | err`);
    const row = (x) => { const r = x.r, m = Math.abs(r.counts[0] - r.counts[1]), c = (100 * r.contestedS) / r.simT;
      console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P('AB'[r.winner] || '-', 2)}(${P(r.reason, 11)}) ${P(r.counts.join(' vs '), 9)} ${P(m, 4)} ${P(r.leadChanges, 3)} ${P(r.firstCapture ?? '-', 6)} ${P(f1(c), 5)} ${P(r.overtime ? f1(r.overtimeT) + 's' : 'no', 6)} ${err(r)}`);
      return { m, lc: r.leadChanges, fc: r.firstCapture, c, ko: r.reason === 'knockout' ? 1 : 0, ot: r.overtime ? 1 : 0 }; };
    const R = L.map(row);
    console.log(`  MEAN (n ${R.length}): margin ${f1(mean(R.map((x) => x.m)))} | lead changes ${f2(mean(R.map((x) => x.lc)))} | first take ${f1(mean(R.map((x) => x.fc)))} s | contested ${f1(mean(R.map((x) => x.c)))} % | knockouts ${R.reduce((s, x) => s + x.ko, 0)}/${R.length} | overtime ${R.reduce((s, x) => s + x.ot, 0)}/${R.length}`);
  }
}
if (set === 'B') {
  console.log('B: map / forced side | winner (reason) | counts forced vs other | forced won | K/D forced vs other | orbs used | splats by the orb (forced) | Cheer Orb stats | err');
  const R = ok.map((x) => { const r = x.r, s = +x.k[1].slice(1), o = 1 - s, T = r.teamKD, won = r.winner === s ? 1 : 0;
    const uses = (r.spUses[s] || {}).booyah || 0, orbSplats = T[o].by?.booyah || 0, z = r.zipcheer || {};
    console.log(`  ${P(x.k[0] + ' t' + s, 13)} ${P('AB'[r.winner] || '-', 2)}(${P(r.reason, 11)}) ${P(r.counts[s] + ' vs ' + r.counts[o], 9)} ${P(won ? 'yes' : 'no', 4)} ${P(T[s].k + '/' + T[s].d + ' vs ' + T[o].k + '/' + T[o].d, 15)} ${P(uses, 3)} ${P(orbSplats, 3)} orbs ${z.orbs ?? '-'} lifted ${z.lifted ?? '-'} cheers ${z.cheers ?? '-'} gains ${z.gains ?? '-'} (${f1(z.gainPts)} pts) held ${z.splatHeld ?? '-'} | ${err(r)}`);
    return { won, m: r.counts[o] - r.counts[s], kd: T[s].k / Math.max(1, T[s].d), kdo: T[o].k / Math.max(1, T[o].d), uses, orbSplats }; });
  console.log(`  MEAN (n ${R.length}): the Cheer Orb team won ${R.reduce((s, x) => s + x.won, 0)}/${R.length} | count lead (other − forced; + = forced ahead) ${f1(mean(R.map((x) => x.m)))} | K/D forced ${f2(mean(R.map((x) => x.kd)))} vs other ${f2(mean(R.map((x) => x.kdo)))} | orbs used ${f1(mean(R.map((x) => x.uses)))}/match, splats by them ${f2(mean(R.map((x) => x.orbSplats)))}/match`);
}
if (set === 'C') {
  const M = {};
  for (const code of groups(0)) {
    const L = ok.filter((x) => x.k[0] === code);
    console.log(`C ${code}: map | turf % A / B | per bot: turf p, splats | all splats | roller (×8) turf p | err`);
    const R = L.map((x) => { const r = x.r; console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P(r.cov.join(' / '), 12)} ${P(r.per.turf, 5)} ${P(r.per.splats, 5)} ${P(r.splats, 4)} ${P(r.byWeapon?.roller?.turf ?? '-', 5)} ${err(r)}`);
      return { t: r.per.turf, s: r.per.splats, cov: r.cov[0] + r.cov[1], all: r.splats }; });
    M[code] = { t: mean(R.map((x) => x.t)), s: mean(R.map((x) => x.s)), cov: mean(R.map((x) => x.cov)), all: mean(R.map((x) => x.all)), n: R.length };
    console.log(`  MEAN (n ${R.length}): turf per bot ${f1(M[code].t)} p | splats per bot ${f2(M[code].s)} | inked total ${f1(M[code].cov)} % | splats ${f1(M[code].all)}/match`);
  }
  if (M.base && M.head) console.log(`  head / base: turf per bot ×${f2(M.head.t / M.base.t)}, splats per bot ×${f2(M.head.s / M.base.s)}, inked total ×${f2(M.head.cov / M.base.cov)}`);
}
if (set === 'D') {
  for (const sp of groups(0)) {
    const L = ok.filter((x) => x.k[0] === sp);
    console.log(`D ${sp}: map | uses | splats by barrages | per use | turf % A+B | deaths during it | throws by kind | err`);
    const R = L.map((x) => { const r = x.r, uses = (r.spUses[0].barrage || 0) + (r.spUses[1].barrage || 0), sp2 = (r.teamKD[0].by?.barrage || 0) + (r.teamKD[1].by?.barrage || 0);
      const died = [0, 1].reduce((s, t) => s + Object.entries(r.spEnds[t] || {}).filter(([id]) => /^barrage/.test(id)).reduce((q, [, o]) => q + (o.splat || 0), 0), 0), cov = r.cov[0] + r.cov[1];
      console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P(uses, 4)} ${P(sp2, 4)} ${P(f2(sp2 / Math.max(1, uses)), 5)} ${P(f1(cov), 6)} ${P(died, 3)} ${JSON.stringify(r.barrage?.throws || {})} | ${err(r)}`);
      return { uses, sp2, died, cov }; });
    const U = R.reduce((s, x) => s + x.uses, 0);
    console.log(`  MEAN (n ${R.length}): uses ${f1(mean(R.map((x) => x.uses)))}/match | splats per use ${f2(R.reduce((s, x) => s + x.sp2, 0) / Math.max(1, U))} | inked ${f1(mean(R.map((x) => x.cov)))} % (A+B; ÷ uses: ${f2(R.reduce((s, x) => s + x.cov, 0) / Math.max(1, U))} %/use, rough) | deaths during the special ${f2(R.reduce((s, x) => s + x.died, 0) / Math.max(1, U))}/use`);
  }
}
if (set === 'E') {
  const COST = { bomb: 70, glide: 65, sentry: 65, bobber: 40, dash: 55 };   // (src/config.js SUBS at b97b3eb)
  for (const mode of groups(0)) for (const sub of [...new Set(ok.filter((x) => x.k[0] === mode).map((x) => x.k[1]))]) {
    const L = ok.filter((x) => x.k[0] === mode && x.k[1] === sub);
    console.log(`E ${mode} ${sub}: map | uses | enemy hits | splats by it | hits/use | splats/use | ink/splat | its own counters | err`);
    const R = L.map((x) => { const r = x.r, u = r.subUse?.[sub] || { uses: 0, hits: 0, dmg: 0 }, sp = (r.byCause || {})[sub] || 0; let extra = '';
      const o = { uses: u.uses, hits: u.hits, sp };
      if (sub === 'sentry' && r.sentry) { const S = r.sentry; o.lock = S.aliveS ? S.lockedS / S.aliveS : NaN; o.uses = S.uses || u.uses; o.hits = S.hits; o.sp = S.splats ?? sp; extra = `rounds ${S.shots} hits ${S.hits} | locked on ${f1(100 * o.lock)} % of its life (${f1(S.lockedS)} / ${f1(S.aliveS)} s) | ends ${JSON.stringify(S.ends)}`; }
      if (sub === 'bobber' && r.bobber) { const S = r.bobber.s; o.trig = S.triggers; o.exp = S.expired; o.dis = S.disarmed; o.uses = S.thrown || u.uses; o.sp = S.splats ?? sp; o.hits = S.hits ?? u.hits;
        extra = `chains set off ${S.triggers} / expired ${S.expired} / disarmed ${S.disarmed} (caught a foe ${S.hitTriggers}, wasted ${S.wasted}) | splats per chain set off ${f2(S.splats / Math.max(1, S.triggers))}`; }
      if (sub === 'dash' && r.dash) { const S = r.dash; o.dodge = S.why?.dodge || 0; o.sea = S.seaAfter || 0; o.uses = S.dashes || u.uses; o.hits = S.hits ?? u.hits;
        extra = `dashes ${S.dashes} (ground ${S.ground}, air ${S.air}) | bots' reasons ${JSON.stringify(S.why)} | sea deaths soon after ${S.seaAfter} | streak splats ${S.streak}`; }
      if (sub === 'glide' && r.glide) { const S = r.glide; extra = `blasts ${S.blasts} hits ${S.hits} | cooked ${S.cooked} | popped ${S.popped} sunk ${S.sunk} smashed ${S.smashed} bounces ${S.bounces}`; }
      console.log(`  ${P(x.k[2] + '-' + x.k[3], 13)} ${P(o.uses, 4)} ${P(o.hits, 4)} ${P(o.sp, 3)} ${P(f2(o.hits / Math.max(1, o.uses)), 5)} ${P(f2(o.sp / Math.max(1, o.uses)), 5)} ${P(o.sp ? Math.round((o.uses * COST[sub]) / o.sp) : '-', 6)} ${extra} | ${err(r)}`);
      return o; });
    const U = R.reduce((s, x) => s + x.uses, 0), H = R.reduce((s, x) => s + x.hits, 0), S = R.reduce((s, x) => s + x.sp, 0);
    let ex = '';
    if (sub === 'sentry') ex = ` | locked on ${f1(100 * mean(R.map((x) => x.lock)))} % of its life`;
    if (sub === 'bobber') { const t = R.reduce((s, x) => s + (x.trig || 0), 0), e = R.reduce((s, x) => s + (x.exp || 0), 0), d = R.reduce((s, x) => s + (x.dis || 0), 0); ex = ` | chains set off ${t} / expired ${e} / disarmed ${d} (${f1((100 * t) / Math.max(1, t + e + d))} % set off) | splats per chain set off ${f2(S / Math.max(1, t))}`; }
    if (sub === 'dash') ex = ` | dodges ${R.reduce((s, x) => s + (x.dodge || 0), 0)} (${f2(R.reduce((s, x) => s + (x.dodge || 0), 0) / R.length)}/match) | sea deaths soon after a dash ${R.reduce((s, x) => s + (x.sea || 0), 0)}`;
    console.log(`  MEAN (n ${R.length}): uses ${f1(U / R.length)}/match | hits per use ${f2(H / Math.max(1, U))} | splats per use ${f2(S / Math.max(1, U))} | ink per splat ${S ? Math.round((U * COST[sub]) / S) : '-'}${ex}`);
  }
}
// ---- JOB-6 (the lead's follow-ups): A2 = set A at n 16 with the count at 60 / 120 / 180 s and the knockout time;
// C2 = a mixed lobby, random weapons with one roller per team (slots 0 and 4): the rollers' turf vs the lobby's mean,
// splats, and their share of alive time spent rolling
if (set === 'A2') {
  for (const code of groups(0)) {
    const L = ok.filter((x) => x.k[0] === code);
    console.log(`A2 ${code}: map | winner (reason, KO at) | counts A-B at 60 / 120 / 180 s | final | margin | lead changes | first take | contested % | err`);
    const R = L.map((x) => { const r = x.r, c = r.countAt || {}, g = (t) => (c[t] ? c[t][0] + '-' + c[t][1] : 'end'), m = Math.abs(r.counts[0] - r.counts[1]);
      const lead60 = c[60] ? (c[60][0] < c[60][1] ? 0 : c[60][1] < c[60][0] ? 1 : -1) : -1, ko = r.reason === 'knockout';
      console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P('AB'[r.winner] || '-', 2)}(${P(r.reason + (ko ? ' ' + f1(r.simT) + 's' : ''), 17)}) ${P(g(60), 8)} ${P(g(120), 8)} ${P(g(180), 8)} ${P(r.counts.join('-'), 7)} ${P(m, 4)} ${P(r.leadChanges, 3)} ${P(r.firstCapture ?? '-', 6)} ${P(f1((100 * r.contestedS) / r.simT), 5)} ${err(r)}`);
      const gap = (t) => (c[t] ? Math.abs(c[t][0] - c[t][1]) : NaN);
      return { m, ko, koT: ko ? r.simT : NaN, lc: r.leadChanges, fc: r.firstCapture, c: (100 * r.contestedS) / r.simT, g60: gap(60), g120: gap(120), g180: gap(180), lead60, won60: lead60 >= 0 ? (lead60 === r.winner ? 1 : 0) : NaN }; });
    const kos = R.filter((x) => x.ko);
    console.log(`  MEAN (n ${R.length}): knockouts ${kos.length}/${R.length} (at ${kos.map((x) => f1(x.koT)).join(', ') || '-'} s) | margin ${f1(mean(R.map((x) => x.m)))} | count gap at 60 s ${f1(mean(R.map((x) => x.g60)))}, 120 s ${f1(mean(R.map((x) => x.g120)))}, 180 s ${f1(mean(R.map((x) => x.g180)))} (matches still on) | the 60 s leader won ${R.filter((x) => x.won60 === 1).length}/${R.filter((x) => Number.isFinite(x.won60)).length} | lead changes ${f2(mean(R.map((x) => x.lc)))} | first take ${f1(mean(R.map((x) => x.fc)))} s | contested ${f1(mean(R.map((x) => x.c)))} %`);
  }
}
if (set === 'C2') {
  const M = {};
  for (const code of groups(0)) {
    const L = ok.filter((x) => x.k[0] === code);
    console.log(`C2 ${code}: map | lobby turf p/bot | roller A (slot 0): turf, ×lobby, splats/deaths, rolling % | roller B (slot 4): same | other rollers | err`);
    const R = [];
    for (const x of L) { const r = x.r, lob = r.per.turf, rs = r.rollers || [];
      const one = (i) => { const o = rs.find((q) => q.i === i); if (!o) return { s: '-', v: null }; const k = o.turf / Math.max(1, lob), rp = (100 * o.rollS) / Math.max(1, o.aliveS);
        R.push({ k, rp, sp: o.splats, d: o.deaths, lsp: r.per.splats }); return { s: `${o.turf} ×${f2(k)} ${o.splats}/${o.deaths} ${f1(rp)}%` }; };
      const a = one(0), b = one(4), extra = rs.filter((q) => q.i !== 0 && q.i !== 4).length;
      console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P(lob, 6)} ${P(a.s, 26)} ${P(b.s, 26)} ${P(extra, 2)} ${err(r)}`); }
    M[code] = { k: mean(R.map((x) => x.k)), rp: mean(R.map((x) => x.rp)), sp: mean(R.map((x) => x.sp)), d: mean(R.map((x) => x.d)), lsp: mean(R.map((x) => x.lsp)), n: R.length };
    console.log(`  MEAN (${R.length} rollers): turf ×${f2(M[code].k)} the lobby's mean | splats ${f2(M[code].sp)} (lobby ${f2(M[code].lsp)} per bot) | deaths ${f2(M[code].d)} | rolling ${f1(M[code].rp)} % of alive time`);
  }
  if (M.base && M.head) console.log(`  head vs base: roller turf ×lobby ${f2(M.base.k)} → ${f2(M.head.k)}; rolling ${f1(M.base.rp)} % → ${f1(M.head.rp)} %; roller splats ${f2(M.base.sp)} → ${f2(M.head.sp)}`);
}
// ---- JOB-7: A3 = Zone Control at n 16 per code with the count every 30 s and every take of the objective.
//   node agg-int3.cjs A3 <dir>    the per-match rows and the means
//   node agg-int3.cjs A3T <dir>   each match's timeline (A-B count and penalties at every 30 s mark)
//   node agg-int3.cjs A3F <dir>   each match's takes
if (/^A3[TF]?$/.test(set)) {
  const pre = 'A3-';
  const L3 = fs.readdirSync(dir).filter((f) => f.startsWith(pre) && f.endsWith('.json')).sort().map((f) => ({ k: f.slice(3, -5).split('-'), r: load(f) })).filter((x) => x.r);
  const codes = [...new Set(L3.map((x) => x.k[0]))];
  for (const code of codes) {
    const L = L3.filter((x) => x.k[0] === code);
    if (set === 'A3T') {
      console.log(`A3 timeline ${code}: count A-B (penalty A/B when not 0) at each 30 s mark; | = the end`);
      for (const x of L) { const c = x.r.countAt30 || {}; console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ` + Object.keys(c).map(Number).sort((a, b) => a - b).map((t) => `${t}:${c[t][0]}-${c[t][1]}${c[t][2] || c[t][3] ? '(+' + c[t][2] + '/+' + c[t][3] + ')' : ''}`).join(' ') + ` | ${x.r.reason} ${x.r.counts.join('-')} @${f1(x.r.simT)}s`); }
      continue;
    }
    if (set === 'A3F') {
      console.log(`A3 takes ${code}: time obj taker←(prev state, last holder) penalty-to-loser counts-then [role]`);
      for (const x of L) console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ` + (x.r.flips || []).map((f) => `${f1(f.t)}s ${f.obj} ${'AB'[f.to]}←(${f.prev < 0 ? 'N' : 'AB'[f.prev]},${f.from < 0 ? '-' : 'AB'[f.from]}) +${f.pen} ${f.c[0]}-${f.c[1]} [${f.role}]`).join(' · '));
      continue;
    }
    console.log(`A3 ${code}: map | winner (reason, KO at) | final | margin | lead changes, last at | takes (off the other team) | after 180 s: by leader / trailer / level | penalty per take off the other team | err`);
    const R = L.map((x) => { const r = x.r, F = r.flips || [], off = F.filter((f) => f.from === 1 - f.to), late = F.filter((f) => f.t >= 180), ko = r.reason === 'knockout';
      const by = (role) => late.filter((f) => f.role === role).length, pen = off.reduce((s, f) => s + f.pen, 0);
      console.log(`  ${P(x.k[1] + '-' + x.k[2], 13)} ${P('AB'[r.winner] || '-', 2)}(${P(r.reason + (ko ? ' ' + f1(r.simT) + 's' : ''), 17)}) ${P(r.counts.join('-'), 7)} ${P(Math.abs(r.counts[0] - r.counts[1]), 4)} ${P(r.leadChanges + (r.lastLeadT != null ? ' @' + f1(r.lastLeadT) : ''), 9)} ${P(F.length + ' (' + off.length + ')', 8)} ${P(by('leader') + ' / ' + by('trailer') + ' / ' + by('level'), 11)} ${P(off.length ? f1(pen / off.length) : '-', 5)} ${err(r)}`);
      return { r, F, off, late, ko, pen }; });
    // the gap at each 30 s mark (matches still on), the last lead change, the late takes, the penalties
    const marks = [...new Set(R.flatMap((x) => Object.keys(x.r.countAt30 || {}).map(Number)))].sort((a, b) => a - b);
    console.log('  gap |A − B| at each 30 s mark (matches still on): ' + marks.map((t) => { const g = R.filter((x) => x.r.countAt30?.[t]).map((x) => Math.abs(x.r.countAt30[t][0] - x.r.countAt30[t][1])); return `${t}s ${f1(mean(g))} (n ${g.length})`; }).join(' · '));
    const lc = R.filter((x) => x.r.lastLeadT != null);
    const late = R.flatMap((x) => x.late), off = R.flatMap((x) => x.off);
    const cnt = (A, role) => A.filter((f) => f.role === role).length;
    console.log(`  MEAN (n ${R.length}): knockouts ${R.filter((x) => x.ko).length}/${R.length} | margin ${f1(mean(R.map((x) => Math.abs(x.r.counts[0] - x.r.counts[1]))))} | last lead change at ${f1(mean(lc.map((x) => x.r.lastLeadT)))} s (${lc.length} matches had one; ${R.length - lc.length} never changed leader)`);
    console.log(`    takes ${R.reduce((s, x) => s + x.F.length, 0)} (${off.length} off the other team) | after 180 s: ${late.length} takes — by the leader ${cnt(late, 'leader')}, the trailer ${cnt(late, 'trailer')}, level ${cnt(late, 'level')}; off the other team after 180 s: leader ${cnt(late.filter((f) => f.from === 1 - f.to), 'leader')}, trailer ${cnt(late.filter((f) => f.from === 1 - f.to), 'trailer')}`);
    console.log(`    penalty per take off the other team ${f2(off.reduce((s, f) => s + f.pen, 0) / Math.max(1, off.length))} (all takes: ${f2(off.reduce((s, f) => s + f.pen, 0) / Math.max(1, R.reduce((s, x) => s + x.F.length, 0)))}) | by the taker's role: leader took ${f2(off.filter((f) => f.role === 'leader').reduce((s, f) => s + f.pen, 0) / Math.max(1, cnt(off, 'leader')))} per take (${cnt(off, 'leader')}), trailer ${f2(off.filter((f) => f.role === 'trailer').reduce((s, f) => s + f.pen, 0) / Math.max(1, cnt(off, 'trailer')))} (${cnt(off, 'trailer')})`);
  }
}
