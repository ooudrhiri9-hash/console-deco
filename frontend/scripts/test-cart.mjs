/**
 * End-to-end check of the commerce flow against the BUILT site.
 * Drives headless Edge over CDP — no test framework, no dependency.
 *
 *   node scripts/serve-out.mjs 4322 &
 *   node scripts/test-cart.mjs http://localhost:4322
 */
const BASE = process.argv[2] ?? 'http://localhost:4322';
const PORT = 9333;

const { spawn } = await import('node:child_process');
const edge =
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const proc = spawn(edge, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}/cdp-cart-${Date.now()}`,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait for the debugger to come up.
let target = null;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === 'page' && !t.url.startsWith('edge://'));
  } catch {
    /* not up yet */
  }
}
if (!target) {
  console.error('✗ could not reach the browser debugger');
  proc.kill();
  process.exit(1);
}

// ONE connection drives every navigation — reconnecting per page makes
// Page.navigate silently not take effect.
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

/** awaitPromise is required or every field comes back undefined. */
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return r.result?.result?.value;
};

const goto = async (path) => {
  await send('Page.navigate', { url: BASE + path });
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const ready = await evaluate(
      "document.readyState === 'complete' && document.styleSheets.length > 0",
    );
    if (ready) break;
  }
  await sleep(600); // let React hydrate
};

await send('Page.enable');
await send('Runtime.enable');

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

console.log(`\nCommerce flow against ${BASE}\n`);

// 1. product page: add to cart
await goto('/produits/consoles/console-atlas-noyer-laiton/');
const addLabel = await evaluate(
  `[...document.querySelectorAll('button')].find(b=>/Ajouter au panier/i.test(b.textContent))?.textContent ?? null`,
);
check('add-to-cart button rendered', addLabel !== null, addLabel ?? 'not found');

await evaluate(
  `[...document.querySelectorAll('button')].find(b=>/Ajouter au panier/i.test(b.textContent)).click(); true`,
);
await sleep(500);

const stored = await evaluate(`localStorage.getItem('cart.v1')`);
check('cart persisted to localStorage', /CNS-001/.test(stored ?? ''), stored ?? 'empty');

const badge = await evaluate(`document.querySelector('.icon-btn__count')?.textContent ?? null`);
check('header badge shows 1', badge === '1', `badge="${badge}"`);

// 2. quantity + second add
await evaluate(
  `[...document.querySelectorAll('.qty button')].find(b=>b.textContent.trim()==='+').click(); true`,
);
await sleep(300);
// The add button shows "Ajouté ✓" for 1.8s after a click — wait for it to
// revert before clicking again, and select by class rather than by label.
await sleep(2000);
await evaluate(`document.querySelector('.buy-row .btn--primary').click(); true`);
await sleep(600);
const badge2 = await evaluate(`document.querySelector('.icon-btn__count')?.textContent ?? null`);
check('badge accumulates to 3 (1 + 2)', badge2 === '3', `badge="${badge2}"`);

// 3. cart page reflects it
await goto('/panier/');
const cart = await evaluate(`JSON.stringify({
  lines: document.querySelectorAll('.cart-line').length,
  total: document.querySelector('.summary__row--total span:last-child')?.textContent ?? null,
  empty: /est vide/i.test(document.querySelector('main').innerText)
})`);
const c = JSON.parse(cart);
check('cart page lists the line', c.lines === 1, `${c.lines} line(s)`);
check('cart is not shown as empty', c.empty === false);
check('total = 3 x 4 900 DH', (c.total ?? '').replace(/\s/g, '') === '14700DH', `total="${c.total}"`);

// 4. checkout: WhatsApp link is built from the cart
await goto('/commande/');
const wa = await evaluate(
  `document.querySelector('a[href^="https://wa.me/"]')?.getAttribute('href') ?? null`,
);
const decoded = wa ? decodeURIComponent(wa) : '';
check('checkout builds a WhatsApp order message', /CNS-001/.test(decoded) && /14\s?700/.test(decoded),
  decoded.slice(decoded.indexOf('text=') + 5, decoded.indexOf('text=') + 70).replace(/\n/g, ' | '));

// 5. cart survives a reload (localStorage, not memory)
await goto('/panier/');
const after = await evaluate(`document.querySelectorAll('.cart-line').length`);
check('cart survives navigation/reload', after === 1, `${after} line(s)`);

// 6. locale switch keeps the visitor on the same page
await goto('/produits/tables-basses/');
const enHref = await evaluate(
  `document.querySelector('.lang a[hreflang="en"]')?.getAttribute('href') ?? null`,
);
check('FR->EN switch maps the category', enHref === '/en/products/coffee-tables/', `href="${enHref}"`);

ws.close();
proc.kill();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
process.exit(failed.length ? 1 : 0);
