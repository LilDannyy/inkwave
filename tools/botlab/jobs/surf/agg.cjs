// Summaries for JOB-1's balance matches (job1.sh): per set (base / surf / mirror) and mode, over every stage and per
// stage — Alpha's win rate, K/D, turf; Surf N' Turf's numbers per use; assists.
//   node tools/botlab/jobs/surf/agg.cjs <dir of *.json>
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const runs = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue;
  const [tag, map, mode] = f.replace('.json', '').split('-');
  try { runs.push({ tag, map, mode, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }); } catch (e) { /* a broken run */ }
}
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
function summary(list) {
  const n = list.length; if (!n) return null;
  let winA = 0, kA = 0, dA = 0, kB = 0, dB = 0, covA = 0, covB = 0, asA = 0, asB = 0, spl = 0;
  const S = { uses: 0, lands: 0, rings: 0, hits: 0, dodges: 0, marks: 0, kills: 0, turf: 0, splats: 0, popped: 0, lost: 0 }, B = { jumps: 0, missed: 0, noticed: 0, shots: 0, atFoes: 0, atObj: 0, atTurf: 0 };
  let surfTurfA = 0, turfA = 0, byJump = 0, byDamage = 0;
  for (const { mode, r } of list) {
    const T = r.teamKD || [{}, {}];
    kA += T[0].k || 0; dA += T[0].d || 0; kB += T[1].k || 0; dB += T[1].d || 0;
    covA += r.cov[0]; covB += r.cov[1]; spl += r.splats;
    const w = mode === 'zones' ? r.winner : (r.cov[0] > r.cov[1] ? 0 : 1);
    if (w === 0) winA++;
    const s = r.surf; if (s) {
      for (const k in S) S[k] += s.stats[k] || 0; for (const k in B) B[k] += s.bots[k] || 0;
      asA += s.teams[0].assists; asB += s.teams[1].assists; surfTurfA += s.teams[0].surfTurf; turfA += s.teams[0].turf;
      byJump += s.assists.byJump || 0; byDamage += s.assists.byDamage || 0;
    }
  }
  return { n, winA: 100 * winA / n, kdA: kA / Math.max(1, dA), kdB: kB / Math.max(1, dB), covA: covA / n, covB: covB / n, splats: spl / n, asA: asA / n, asB: asB / n, byJump, byDamage,
    usesPerMatch: S.uses / n, perUse: S.lands ? { hits: S.hits / S.lands, dodges: S.dodges / S.lands, marks: S.marks / S.lands, kills: S.kills / S.lands, ink: S.turf / S.lands, splats: S.splats / S.lands } : null,
    S, B, surfTurfShareA: turfA ? 100 * surfTurfA / turfA : 0 };
}
const line = (k, s) => s ? `${k.padEnd(22)} n ${String(s.n).padStart(3)} | A wins ${f1(s.winA)}% | K/D A ${f2(s.kdA)} B ${f2(s.kdB)} | turf A ${f1(s.covA)}% B ${f1(s.covB)}% | splats/match ${f1(s.splats)} | assists/match A ${f1(s.asA)} B ${f1(s.asB)} (by jump ${s.byJump}, by damage ${s.byDamage})`
  + (s.perUse ? `\n${''.padEnd(22)} SURF uses/match ${f1(s.usesPerMatch)} (anchored ${s.S.lands}, lost ${s.S.lost}, shot down ${s.S.popped}) | per buoy: hits ${f2(s.perUse.hits)} marks ${f2(s.perUse.marks)} ring splats ${f2(s.perUse.kills)} dodged ${f2(s.perUse.dodges)} ink ${f1(s.perUse.ink)} m² in ${f1(s.perUse.splats)} splats | A's turf from it ${f1(s.surfTurfShareA)}% | bots: rings jumped ${s.B.jumps} / missed ${s.B.missed} of ${s.B.noticed} noticed, buoys shot at ${s.B.shots}, thrown at foes ${s.B.atFoes} / objective ${s.B.atObj} / turf ${s.B.atTurf}` : '') : `${k}: none`;
for (const mode of ['turf', 'zones']) {
  console.log(`\n### ${mode === 'turf' ? 'Turf War 180 s' : 'Zone Control'} — all stages`);
  for (const tag of ['base', 'surf', 'mirror']) { const L = runs.filter((x) => x.mode === mode && x.tag === tag); if (L.length) console.log(line(tag, summary(L))); }
  console.log(`--- per stage`);
  for (const map of [...new Set(runs.map((x) => x.map))]) for (const tag of ['base', 'surf', 'mirror']) { const L = runs.filter((x) => x.mode === mode && x.tag === tag && x.map === map); if (L.length) console.log(line(`${tag} ${map}`, summary(L))); }
}
const errs = runs.filter((x) => x.r.console && x.r.console.length);
console.log(`\nruns ${runs.length}`);
