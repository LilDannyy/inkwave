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
