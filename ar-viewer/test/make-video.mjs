// Produces a short VP8 WebM test clip using Chromium's MediaRecorder (the
// bundled ffmpeg has no encoders/generators we can use).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
const out = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '.tmp', 'video.webm');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent('<canvas id=c width=320 height=180></canvas>');
const b64 = await page.evaluate(() => new Promise((resolve) => {
  const c = document.getElementById('c'); const ctx = c.getContext('2d');
  const stream = c.captureStream(15);
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 400000 });
  const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = async () => { const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer(); resolve(btoa(String.fromCharCode(...new Uint8Array(buf)))); };
  let f = 0; const id = setInterval(() => { const h = (f * 7) % 360; ctx.fillStyle = `hsl(${h} 80% 60%)`; ctx.fillRect(0, 0, 320, 180); ctx.fillStyle = '#111'; ctx.font = 'bold 40px sans-serif'; ctx.fillText(`frame ${f}`, 40, 105); f++; }, 66);
  rec.start(200); setTimeout(() => { clearInterval(id); rec.stop(); }, 3200);
}));
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
await browser.close();
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
