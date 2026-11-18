/**
 * Capture AUTHENTICATED screenshots of the local Next.js dashboard using
 * Chrome DevTools Protocol. 100% local: no external services, no cloud.
 *
 * Usage:
 *   node scripts/cdp_screenshot.js <jwt-token-file> <output-dir>
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const TOKEN_FILE = process.argv[2];
const OUT_DIR = process.argv[3];
if (!TOKEN_FILE || !OUT_DIR) {
  console.error('Usage: node cdp_screenshot.js <jwt-token-file> <output-dir>');
  process.exit(1);
}
const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9244;
const PROFILE = path.join(os.tmpdir(), 'opencode', 'cdp-profile');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox',
    '--no-first-run', '--hide-scrollbars', '--window-size=1440,900',
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`, 'about:blank'
  ], { stdio: 'ignore', detached: true });

  let target;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      target = list.find(t => t.type === 'page');
      if (target) break;
    } catch (_) {}
    await sleep(300);
  }
  if (!target) { console.error('Could not connect to Chrome DevTools'); process.exit(2); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const pages = [
    ['14_auth_dashboard', 'http://localhost:3000/'],
    ['15_auth_syllabus', 'http://localhost:3000/syllabus'],
    ['16_auth_cost', 'http://localhost:3000/cost'],
    ['17_auth_monitoring', 'http://localhost:3000/monitoring'],
    ['18_auth_security', 'http://localhost:3000/security'],
    ['19_auth_infrastructure', 'http://localhost:3000/infrastructure']
  ];

  // Seed the JWT into localStorage on the app origin, then reload.
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(4000);
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('token', ${JSON.stringify(token)}); 'seeded'`
  });
  await sleep(500);
  const diag = await send('Runtime.evaluate', {
    expression: `JSON.stringify({url:location.href, token:(localStorage.getItem('token')||'').slice(0,20)})`,
    returnByValue: true
  });
  console.log('CDP DIAG after seed:', diag.result.value);

  for (const [name, url] of pages) {
    await send('Page.navigate', { url });
    await sleep(5000);
    const state = await send('Runtime.evaluate', {
      expression: `JSON.stringify({url:location.href, token:(localStorage.getItem('token')||'').slice(0,20), text:document.body.innerText.slice(0,90)})`,
      returnByValue: true
    });
    console.log(`STATE ${name}: ${state.result.value}`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const out = path.join(OUT_DIR, name + '.png');
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(`CAPTURED ${name}.png (${fs.statSync(out).size} bytes) <- ${url}`);
  }

  ws.close();
  try { process.kill(-chrome.pid, 'SIGTERM'); } catch (_) { try { chrome.kill(); } catch (_) {} }
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(3); });
