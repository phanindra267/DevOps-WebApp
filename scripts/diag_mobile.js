const { spawn } = require('child_process');
const os = require('os'); const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9253;
(async () => {
  const c = spawn(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--no-first-run',
    `--user-data-dir=${path.join(os.tmpdir(),'opencode','diag-profile')}`,`--remote-debugging-port=${PORT}`,'about:blank'],
    {stdio:'ignore', detached:true});
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  let t;
  for(let i=0;i<50;i++){ try{ const l=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); t=l.find(x=>x.type==='page'); if(t)break;}catch(e){} await sleep(300); }
  const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  let id=0; const p=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
  const send=(method,params={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.navigate',{url:'http://localhost:3000/'});
  await sleep(2500);
  const token = require('fs').readFileSync(process.argv[2],'utf8').trim();
  await send('Runtime.evaluate',{expression:`localStorage.setItem('token',${JSON.stringify(token)})`});
  await sleep(500);
  await send('Page.navigate',{url:'http://localhost:3000/'});
  await sleep(3500);
  const r=await send('Runtime.evaluate',{expression:`JSON.stringify({
    innerWidth, clientWidth:document.documentElement.clientWidth,
    body:document.body.getBoundingClientRect().width,
    main:document.querySelector('.main-content')?.getBoundingClientRect().width,
    content:document.querySelector('.page-content')?.getBoundingClientRect().width,
    hero:document.querySelector('.hero-banner')?.getBoundingClientRect().width,
    split:document.querySelector('.ui-split')?.getBoundingClientRect().width,
    meta:document.querySelector('meta[name=viewport]')?.content,
    overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>400).slice(0,12).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,60),right:Math.round(e.getBoundingClientRect().right),w:Math.round(e.getBoundingClientRect().width)}))
  })`,returnByValue:true});
  console.log(r.result.value);
  try{process.kill(-c.pid,'SIGTERM')}catch(e){try{c.kill()}catch(e2){}}
  process.exit(0);
})().catch(e=>{console.error(e.message);process.exit(1)});
