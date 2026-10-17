'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { startSelfhost } = require('../../host/selfhost.cjs');
(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inkwave-issue-'));
  const s = await startSelfhost({ root, host: '127.0.0.1', port: 0, log() {} });
  const post = (body, origin = s.url) => fetch(s.url + '/issue', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const ok = await post({ entries: [{ at: new Date().toISOString(), kind: 'probe', message: 'hosted test' }] });
    console.log(`${ok.status === 204 ? 'PASS' : 'FAIL'} hosted POST appends JSONL`);
    console.log(`${fs.readFileSync(path.join(root, 'issues.log'), 'utf8').includes('hosted test') ? 'PASS' : 'FAIL'} hosted issue appears in file`);
    const denied = await post({ kind: 'probe' }, 'https://elsewhere.invalid');
    console.log(`${denied.status === 403 ? 'PASS' : 'FAIL'} cross-origin POST refused`);
    const big = await post({ entries: [], pad: 'x'.repeat(9000) });
    console.log(`${big.status === 413 ? 'PASS' : 'FAIL'} payload limit enforced`);
    let limited = false;
    for (let i = 0; i < 21; i++) { const r = await post({ entries: [] }); if (r.status === 429) limited = true; }
    console.log(`${limited ? 'PASS' : 'FAIL'} rate limit holds at 20 per minute`);
  } finally { await s.close(); fs.rmSync(root, { recursive: true, force: true }); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
