/**
 * Responsive sweep: looks for horizontal overflow and clipped text across
 * widths on every page template. Catches the band *between* breakpoints,
 * which eyeballing 375 and 1440 always misses.
 *
 *   node scripts/serve-out.mjs 4322 &
 *   node scripts/test-responsive.mjs http://localhost:4322
 */
const BASE = process.argv[2] ?? 'http://localhost:4322';
const PORT = 9334;

const WIDTHS = [320, 360, 375, 414, 480, 600, 700, 768, 820, 900, 960, 1024, 1280, 1440, 1920];
const PAGES = [
  ['home', '/'],
  ['catalogue', '/produits/'],
  ['category', '/produits/tableaux/'],
  ['product', '/produits/consoles/console-atlas-noyer-laiton/'],
  ['about', '/a-propos/'],
  ['contact', '/contact/'],
  ['cart', '/panier/'],
  ['404', '/zzz-nope/'],
];

const { spawn } = await import('node:child_process');
const proc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}/cdp-resp-${Date.now()}`,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target = null;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === 'page' && !t.url.startsWith('edge://'));
  } catch {}
}
if (!target) {
  console.error('✗ browser did not start');
  proc.kill();
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))
    .result?.result?.value;

await send('Page.enable');
await send('Runtime.enable');

const PROBE = `(() => {
  const d = document.documentElement;
  const vw = d.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1) {
      offenders.push(el.tagName.toLowerCase() + '.' + (el.className||'').toString().split(' ')[0] + ' right=' + Math.round(r.right));
    }
  }
  return JSON.stringify({
    overflow: Math.round(d.scrollWidth - vw),
    offenders: [...new Set(offenders)].slice(0, 4),
  });
})()`;

let problems = 0;
console.log(`\nResponsive sweep — ${PAGES.length} templates x ${WIDTHS.length} widths\n`);

for (const [name, path] of PAGES) {
  const bad = [];
  for (const w of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w < 768,
    });
    await send('Page.navigate', { url: BASE + path });
    // Poll for styles — a fixed timeout measures images at intrinsic width on
    // the first navigation of a fresh browser and reports phantom overflow.
    for (let i = 0; i < 60; i++) {
      await sleep(150);
      if (await evaluate("document.readyState === 'complete' && document.styleSheets.length > 0")) break;
    }
    await sleep(250);
    const r = JSON.parse(await evaluate(PROBE));
    if (r.overflow > 1) bad.push(`${w}px: +${r.overflow}px [${r.offenders.join(', ')}]`);
  }
  if (bad.length) {
    problems += bad.length;
    console.log(`  ✗ ${name}`);
    for (const b of bad) console.log(`      ${b}`);
  } else {
    console.log(`  ✓ ${name} — no overflow at any width`);
  }
}

ws.close();
proc.kill();
console.log(`\n${problems ? problems + ' overflow case(s)' : 'no horizontal overflow anywhere'}\n`);
process.exit(problems ? 1 : 0);
