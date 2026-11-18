/**
 * UI verification: captures real screenshots of every key page at desktop and
 * mobile widths via Chrome DevTools Protocol, and records browser errors.
 *
 * Usage: node scripts/verify_ui.js <jwt-token-file> <output-dir>
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const TOKEN_FILE = process.argv[2];
const OUT = process.argv[3];
if (!TOKEN_FILE || !OUT) { console.error('Usage: node verify_ui.js <jwt> <outdir>'); process.exit(1); }
const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
fs.mkdirSync(OUT, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9251;
const PROFILE = path.join(os.tmpdir(), 'opencode', 'ui-verify-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox',
    '--no-first-run', '--hide-scrollbars', '--window-size=1440,900',
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`, 'about:blank'
  ], { stdio: 'ignore', detached: true });

  let target;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch (_) {}
    await sleep(300);
  }
  if (!target) { console.error('DevTools unavailable'); process.exit(2); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(`EXCEPTION: ${m.params.exceptionDetails.text} ${m.params.exceptionDetails.exception?.description || ''}`);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      errors.push(`LOG: ${m.params.entry.text}`);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

  async function seed() {
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(3500);
    await send('Runtime.evaluate', { expression: `localStorage.setItem('token', ${JSON.stringify(token)})` });
    await sleep(300);
  }
  async function shot(name, url, waitMs = 4200) {
    if (url) await send('Page.navigate', { url });
    await sleep(waitMs);
    const state = await send('Runtime.evaluate', {
      expression: `JSON.stringify({url:location.href,title:document.title,text:document.body.innerText.slice(0,70)})`,
      returnByValue: true
    });
    const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(OUT, name + '.png');
    fs.writeFileSync(file, Buffer.from(data.data, 'base64'));
    const info = JSON.parse(state.result.value);
    console.log(`SHOT ${name}: ${info.url} | ${info.title} | ${fs.statSync(file).size} bytes`);
    return { name, ...info };
  }

  const captured = [];

  // ── Desktop ────────────────────────────────────────────────────────────────
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await seed();
  for (const p of [
    ['desktop_dashboard', 'http://localhost:3000/'],
    ['desktop_projects', 'http://localhost:3000/projects'],
    ['desktop_infrastructure', 'http://localhost:3000/infrastructure'],
    ['desktop_deployments', 'http://localhost:3000/deployments'],
    ['desktop_pipelines', 'http://localhost:3000/pipelines'],
    ['desktop_security', 'http://localhost:3000/security'],
    ['desktop_monitoring', 'http://localhost:3000/monitoring'],
    ['desktop_cost', 'http://localhost:3000/cost'],
    ['desktop_governance', 'http://localhost:3000/governance'],
    ['desktop_reliability', 'http://localhost:3000/reliability'],
    ['desktop_syllabus', 'http://localhost:3000/syllabus'],
  ]) captured.push(await shot(p[0], p[1]));

  // ── Mobile ─────────────────────────────────────────────────────────────────
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await seed();
  captured.push(await shot('mobile_dashboard', 'http://localhost:3000/'));
  // Open the mobile drawer through a real click on the menu toggle.
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[aria-label="Open navigation"]')?.click()`
  });
  captured.push(await shot('mobile_drawer', null, 900));
  captured.push(await shot('mobile_cost', 'http://localhost:3000/cost'));
  captured.push(await shot('mobile_syllabus', 'http://localhost:3000/syllabus'));

  // ── Login ──────────────────────────────────────────────────────────────────
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `localStorage.removeItem('token')` });
  captured.push(await shot('login', 'http://localhost:3000/login'));

  const report = { generated: new Date().toISOString(), captured, errors };
  fs.writeFileSync(path.join(OUT, 'ui_report.json'), JSON.stringify(report, null, 2));
  console.log(`BROWSER_ERRORS=${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.log('  ' + e));

  ws.close();
  try { process.kill(-chrome.pid, 'SIGTERM'); } catch (_) { try { chrome.kill(); } catch (_) {} }
  process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(3); });
