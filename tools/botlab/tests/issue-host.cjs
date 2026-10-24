'use strict';
// The hosted issue log (tools/host/selfhost.cjs POST /issue): JSONL append, same-origin, the 8 KiB cap, the rate limit.
// [b5-beta1] The log is written beside the site root, never inside it (its rotation too), and GET /issues.log answers 404
// even when an older server left one in the root. The limit is per player behind cloudflared (every request from
// 127.0.0.1): by default a loopback peer's CF-Connecting-IP, only with CF-Ray beside it (Cloudflare's edge sets both),
// keys a 20-a-minute bucket; X-Forwarded-For only with trustProxy 'xff' (its last address); otherwise — no such header,
// a forged one without CF-Ray, or a peer that isn't loopback — the peer's own address keys a 200-a-minute bucket. The
// bucket map is capped (least recently used out), so a flood of made-up names neither grows it nor scans it.
//   node tools/botlab/tests/issue-host.cjs
const fs = require('fs'); const os = require('os'); const path = require('path');
const { startSelfhost, issueBucket, issueAllowed, RATE_CAP } = require('../../host/selfhost.cjs');
(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'inkwave-issue-')), root = path.join(base, 'site');
  fs.mkdirSync(root);
  const s = await startSelfhost({ root, host: '127.0.0.1', port: 0, log() {}, issueLimit: 4096 });
  const post = (body, origin = s.url, headers = {}) => fetch(s.url + '/issue', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  let pass = 0, total = 0;
  const R = (ok, name) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); pass += !!ok; total++; };
  const cf = (ip) => ({ 'cf-connecting-ip': ip, 'cf-ray': '8d2f0c1e9a7b3c4d-AMS' });   // (as cloudflared passes them on)
  try {
    const ok = await post({ entries: [{ at: new Date().toISOString(), kind: 'probe', message: 'hosted test' }] }, s.url, cf('198.51.100.1'));
    R(ok.status === 204, 'hosted POST appends JSONL');
    const log = path.join(base, 'issues.log');
    R(fs.existsSync(log) && fs.readFileSync(log, 'utf8').includes('hosted test'), 'hosted issue appears in the file beside the site root');
    R(!fs.existsSync(path.join(root, 'issues.log')) && s.issueFile === log, 'nothing is written inside the site root');
    const get = await fetch(s.url + '/issues.log');
    R(get.status === 404, 'GET /issues.log answers 404');
    fs.writeFileSync(path.join(root, 'issues.log'), 'an older server\'s log\n'); fs.writeFileSync(path.join(root, 'issues.log.1'), 'its rotation\n');
    const get2 = await fetch(s.url + '/issues.log'), get3 = await fetch(s.url + '/issues.log.1'), head = await fetch(s.url + '/issues.log', { method: 'HEAD' });
    R(get2.status === 404 && get3.status === 404 && head.status === 404 && !(await get2.text()).includes('older'), 'GET / HEAD of an issues.log left in the root (and its rotation) answer 404');
    const denied = await post({ kind: 'probe' }, 'https://elsewhere.invalid');
    R(denied.status === 403, 'cross-origin POST refused');
    const big = await post({ entries: [], pad: 'x'.repeat(9000) }, s.url, cf('198.51.100.2'));
    R(big.status === 413, 'payload limit enforced');
    // the rotation: past issueLimit (4 KiB here) the file moves to issues.log.1 — beside the root as well
    for (let i = 0; i < 4; i++) await post({ entries: [{ kind: 'probe', message: 'r'.repeat(1500) }] }, s.url, cf('198.51.100.3'));
    R(fs.existsSync(path.join(base, 'issues.log.1')) && !fs.existsSync(path.join(root, 'issues.log.2')) && fs.readFileSync(path.join(root, 'issues.log.1'), 'utf8') === 'its rotation\n', 'the rotation (issues.log.1) is written beside the root too');
    // per player behind the tunnel: CF-Connecting-IP
    let a = [];
    for (let i = 0; i < 21; i++) a.push((await post({ entries: [] }, s.url, cf('203.0.113.7'))).status);
    R(a.slice(0, 20).every((x) => x === 204) && a[20] === 429, 'a player (CF-Connecting-IP) is held at 20 a minute');
    const other = await post({ entries: [] }, s.url, cf('203.0.113.8'));
    R(other.status === 204, 'another player behind the same tunnel is not: its own bucket');
    // the fallback: no header — the peer's address, 200 a minute (everyone behind a header-less proxy shares it); a
    // CF-Connecting-IP without CF-Ray (a client's own header through some other proxy) and an X-Forwarded-For (not
    // trusted by default) land in that same bucket, so rotating made-up addresses buys nothing
    a = [];
    for (let i = 0; i < 201; i++) {
      const h = i % 3 === 1 ? { 'cf-connecting-ip': `198.18.${i >> 8}.${i & 255}` } : i % 3 === 2 ? { 'x-forwarded-for': `198.19.${i >> 8}.${i & 255}` } : {};
      a.push((await post({ entries: [] }, s.url, h)).status);
    }
    R(a.slice(0, 200).every((x) => x === 204) && a[200] === 429, 'no trusted header: the peer\'s address keys a bucket of 200 a minute — rotated CF-Connecting-IPs without CF-Ray and X-Forwarded-Fors included');
    // which header names the player, per trustProxy (the unit: issueBucket)
    const lo = (headers) => ({ socket: { remoteAddress: '::ffff:127.0.0.1' }, headers });
    const fake = issueBucket({ socket: { remoteAddress: '203.0.113.99' }, headers: { 'cf-connecting-ip': '1.1.1.1', 'cf-ray': 'x', 'x-forwarded-for': '2.2.2.2' } });
    const viaTunnel = issueBucket(lo({ 'cf-connecting-ip': '1.1.1.1', 'cf-ray': '8d2f-AMS' })), noRay = issueBucket(lo({ 'cf-connecting-ip': '1.1.1.1' }));
    R(fake.key === 'p:203.0.113.99' && fake.limit === 200 && viaTunnel.key === 'h:1.1.1.1' && viaTunnel.limit === 20 && noRay.key === 'p:::ffff:127.0.0.1' && noRay.limit === 200,
      'a direct peer\'s headers are ignored (its own address, 200); a loopback peer\'s CF-Connecting-IP names the player only with CF-Ray');
    const xDef = issueBucket(lo({ 'x-forwarded-for': '192.0.2.44, 10.0.0.1' })), xT = issueBucket(lo({ 'x-forwarded-for': '192.0.2.44, 10.0.0.1' }), 'xff');
    const xCf = issueBucket(lo({ 'cf-connecting-ip': '1.1.1.1', 'cf-ray': 'x' }), 'xff'), none = issueBucket(lo({ 'cf-connecting-ip': '1.1.1.1', 'cf-ray': 'x', 'x-forwarded-for': '2.2.2.2' }), 'none');
    R(xDef.limit === 200 && xT.key === 'h:10.0.0.1' && xT.limit === 20 && xCf.limit === 200 && none.key === 'p:::ffff:127.0.0.1',
      'X-Forwarded-For only with trustProxy xff, and then its last address (the one the proxy added); none trusts no header');
    let threw = false; try { const s2 = await startSelfhost({ root, port: 0, host: '127.0.0.1', log() {}, trustProxy: 'any' }); await s2.close(); } catch (e) { threw = /trustProxy/.test(e.message); }
    R(threw, 'an unknown trustProxy is refused at start');
    // the bucket map under a flood of made-up names: capped at RATE_CAP, least recently used out, no scan per POST
    const rates = new Map(), t0 = Date.now();
    issueAllowed(rates, 'h:keep', 20, t0);
    let w0 = process.hrtime.bigint();
    for (let i = 0; i < RATE_CAP * 4; i++) { issueAllowed(rates, 'h:flood' + i, 20, t0 + 1); if (i % 1000 === 0) issueAllowed(rates, 'h:keep', 20, t0 + 1); }
    const floodMs = Number(process.hrtime.bigint() - w0) / 1e6;
    R(rates.size === RATE_CAP && rates.has('h:keep') && !rates.has('h:flood0') && rates.has('h:flood' + (RATE_CAP * 4 - 1)) && floodMs < 1500,
      `a flood of ${RATE_CAP * 4} made-up names keeps ${rates.size} buckets (cap ${RATE_CAP}; the busy one kept, the oldest gone) in ${floodMs.toFixed(0)} ms`);
  } finally { await s.close(); fs.rmSync(base, { recursive: true, force: true }); }
  console.log(`RESULT ${pass}/${total}`);
  if (pass !== total) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
