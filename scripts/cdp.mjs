// Minimal Chrome DevTools Protocol driver for visual QA (no puppeteer/playwright).
// Usage: node scripts/cdp.mjs <script.json>
// script: { url, width, height, steps: [ {wait:ms} | {eval:"js"} | {shot:"file.png"} | {click:[x,y]} | {move:[x,y]} | {key:"k"} ] }
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const CHROME =
  process.env.CHROME ?? '/nix/store/isj0gablal4pqpvhv97l9kqkx8xfaqdk-kuri-0.3.3/libexec/kuri-chrome/google-chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = join(tmpdir(), `iw-cdp-${port}`);
mkdirSync(prof, { recursive: true });
const env = { ...process.env };
delete env.LD_LIBRARY_PATH;
const W = spec.width ?? 1600;
const H = spec.height ?? 900;
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--no-sandbox',
    '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    `--user-data-dir=${prof}`,
    `--window-size=${W},${H}`,
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { env, stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = list.find((t) => t.type === 'page');
    if (page) {
      ws = new WebSocket(page.webSocketDebuggerUrl);
      break;
    }
  } catch {
    /* not up yet */
  }
  await sleep(250);
}
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    const t = msg.params.type;
    if (t === 'error' || t === 'warning' || t === 'log')
      console.log(`[console.${t}]`, msg.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 400));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    console.log('[exception]', msg.params.exceptionDetails.exception?.description?.slice(0, 600) ?? msg.params.exceptionDetails.text);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: spec.url });

for (const s of spec.steps) {
  if (s.wait) await sleep(s.wait);
  if (s.eval) {
    const r = await send('Runtime.evaluate', { expression: s.eval, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) console.log('[eval error]', JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    else if (r.result?.result?.value !== undefined) console.log('[eval]', JSON.stringify(r.result.result.value).slice(0, 3000));
  }
  if (s.move) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.move[0], y: s.move[1] });
  if (s.click) {
    const [x, y] = s.click;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  if (s.key) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: s.key, text: s.key.length === 1 ? s.key : undefined });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: s.key });
  }
  if (s.shot) {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(s.shot, Buffer.from(r.result.data, 'base64'));
    console.log('[shot]', s.shot);
  }
}
ws.close();
chrome.kill('SIGKILL');
process.exit(0);
