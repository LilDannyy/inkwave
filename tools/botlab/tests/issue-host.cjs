'use strict';
// The hosted issue log (tools/host/selfhost.cjs POST /issue): JSONL append, same-origin, the 8 KiB cap, the rate limit.
// [b5-beta1] The log is written beside the site root, never inside it (its rotation too), and GET /issues.log answers 404
// even when an older server left one in the root. The limit is per player behind cloudflared (every request from
// 127.0.0.1): a loopback peer's CF-Connecting-IP, then X-Forwarded-For, keys a 20-a-minute bucket; with neither — or from
// a peer that isn't loopback (headers anyone could forge) — the peer's own address keys a 200-a-minute bucket.
//   node tools/botlab/tests/issue-host.cjs
const fs = require('fs'); const os = require('os'); const path = require('path');
const { startSelfhost, issueBucket } = require('../../host/selfhost.cjs');
(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'inkwave-issue-')), root = path.join(base, 'site');
  fs.mkdirSync(root);
  const s = await startSelfhost({ root, host: '127.0.0.1', port: 0, log() {}, issueLimit: 4096 });
  const post = (body, origin = s.url, headers = {}) => fetch(s.url + '/issue', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  let pass = 0, total = 0;
  const R = (ok, name) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); pass += !!ok; total++; };
  const cf = (ip) => ({ 'cf-connecting-ip': ip });
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
    a = [];
    for (let i = 0; i < 21; i++) a.push((await post({ entries: [] }, s.url, { 'x-forwarded-for': '192.0.2.44, 10.0.0.1' })).status);
    const xo = await post({ entries: [] }, s.url, { 'x-forwarded-for': '192.0.2.45' });
    R(a.slice(0, 20).every((x) => x === 204) && a[20] === 429 && xo.status === 204, 'without CF-Connecting-IP, the first X-Forwarded-For address keys the bucket (20 a minute each)');
    // the fallback: no header — the peer's address, 200 a minute (everyone behind a header-less proxy shares it)
    a = [];
    for (let i = 0; i < 201; i++) a.push((await post({ entries: [] })).status);
    R(a.slice(0, 200).every((x) => x === 204) && a[200] === 429, 'no forwarding header: the peer\'s address keys a bucket of 200 a minute');
    // forged headers from a peer that is not loopback are not trusted
    const fake = issueBucket({ socket: { remoteAddress: '203.0.113.99' }, headers: { 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' } });
    const viaTunnel = issueBucket({ socket: { remoteAddress: '::ffff:127.0.0.1' }, headers: { 'cf-connecting-ip': '1.1.1.1' } });
    R(fake.key === 'p:203.0.113.99' && fake.limit === 200 && viaTunnel.key === 'h:1.1.1.1' && viaTunnel.limit === 20, 'a direct peer\'s forwarding headers are ignored (its own address, 200); a loopback peer\'s are the player');
  } finally { await s.close(); fs.rmSync(base, { recursive: true, force: true }); }
  console.log(`RESULT ${pass}/${total}`);
  if (pass !== total) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
