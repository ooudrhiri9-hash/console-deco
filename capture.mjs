const t = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = t.find((x) => x.type === 'page' && !x.url.startsWith('edge://'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const p = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) p.get(m.id)(m); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; p.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

for (const [nom, w, h] of [['bureau', 1280, 800], ['mobile', 390, 844]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 700 });
  await send('Page.enable');
  await send('Page.navigate', { url: 'https://maisondeco.ma/' });
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression: "document.readyState==='complete' && document.styleSheets.length>0", returnByValue: true });
    if (r.result?.result?.value) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await new Promise((r) => setTimeout(r, 1200));
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: 180, scale: 1 } });
  const fs = await import('node:fs');
  fs.writeFileSync(`entete-${nom}.png`, Buffer.from(shot.result.data, 'base64'));
  console.log(`entete-${nom}.png`);
}
ws.close();
