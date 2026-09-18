// End-to-end: boots the viewer in headless Chromium with a fake camera that
// "sees" a real card image, and asserts the card is detected and media plays.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { startMockServer } from './mock-api.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(here, '..', 'dist');
const tmp = path.join(here, '.tmp');
const chromePath = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const y4m = path.join(tmp, 'cam.y4m');
for (const f of [path.join(dist, 'app.js'), y4m, path.join(tmp, 'front.mind'), path.join(tmp, 'video.webm')]) {
  if (!fs.existsSync(f)) { console.error('missing', f, '- run `npm run build` and prepare test/.tmp first'); process.exit(2); }
}

const experience = {
  id: '64b000000000000000000001',
  payload: (base) => ({
    id: '64b000000000000000000001', isPaid: true,
    cardId: { title: 'Test card', frontDesign: `${base}/uploads/front.png` },
    tracking: { status: 'ready', url: `${base}/uploads/front.mind`, targets: [{ face: 'front', width: 669, height: 1000, quality: 'good' }] },
    arTemplateData: { mainHeading: 'Happy Birthday Sam!', paragraph1: 'Hope your day is as wonderful as you are.', paragraph2: 'Love, Ben', effect: 'hearts' },
    templateImage0: `${base}/uploads/front.png`,
    templateVideo: `${base}/uploads/video.webm`, // open-source Chromium has no H.264; production serves MP4
  }),
};

const { server, port } = await startMockServer({ distDir: dist, tmpDir: tmp, experience });
const base = `http://127.0.0.1:${port}`;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${y4m}`,
    '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox',
  ],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['camera'] });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); if (m.type() === 'warning') consoleWarnings.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  const t0 = Date.now();
  await page.goto(`${base}/?templateId=${experience.id}&api=${encodeURIComponent(base)}`);
  await page.waitForSelector('#btn-start');
  if (!process.env.SKIP_WAIT) {
  const subtitle = await page.waitForFunction(() => document.getElementById('start-subtitle').textContent.includes('Happy Birthday'), null, { timeout: 10000 }).then(() => true).catch(() => false);
  check('start screen shows greeting title', subtitle);
  }

  // Wrong id -> friendly error
  if (!process.env.SKIP_P2) {
  const p2 = await ctx.newPage();
  await p2.goto(`${base}/?templateId=64b0000000000000000000ff&api=${encodeURIComponent(base)}`);
  await p2.click('#btn-start');
  const errShown = await p2.waitForSelector('#screen-error:not(.hidden)', { timeout: 10000 }).then(() => true).catch(() => false);
  check('unknown card shows error screen', errShown, errShown ? await p2.textContent('#error-text') : '');
  await p2.close();
  }

  await page.click('#btn-start');
  const arReady = await page.waitForFunction(() => window.__incardible && window.__incardible.mode === 'ar', null, { timeout: 60000 }).then(() => true).catch(() => false);
  check('AR mode started (camera + tracker)', arReady, `${((Date.now() - t0) / 1000).toFixed(1)}s after page open`);

  let found = false;
  if (arReady) {
    const tf = Date.now();
    found = await page.waitForFunction(() => window.__incardible.found === true, null, { timeout: 90000 }).then(() => true).catch(() => false);
    check('card detected by tracker', found, found ? `${((Date.now() - tf) / 1000).toFixed(1)}s after AR start (software GPU)` : 'not found within 90s');
  }
  if (found) {
    const playing = await page.waitForFunction(() => {
      const c = window.__incardible.content && window.__incardible.content[0];
      const v = c && c.video;
      return !!(v && !v.paused && v.currentTime > 0.2);
    }, null, { timeout: 15000 }).then(() => true).catch(() => false);
    const media = await page.evaluate(() => {
      const c = window.__incardible.content && window.__incardible.content[0];
      const v = c && c.video;
      return { hasVideo: !!v, currentTime: v ? v.currentTime : null, hintFaded: document.getElementById('scan-hint').classList.contains('faded') };
    });
    media.playing = playing;
    if (!playing) {
      const diag = await page.evaluate(() => {
        const c = window.__incardible.content && window.__incardible.content[0]; const v = c && c.video;
        return v ? { src: v.src, currentSrc: v.currentSrc, expVideo: window.__incardible.exp && window.__incardible.exp.video, paused: v.paused, readyState: v.readyState, networkState: v.networkState, error: v.error && v.error.code, muted: v.muted, playError: c.group.userData.playError, hidden: document.hidden, found: window.__incardible.found } : 'no video';
      });
      console.log('video diagnostics:', JSON.stringify(diag), 'console warnings:', consoleWarnings.slice(-5).join(' | '));
    }
    check('video plays when card is found', media.hasVideo && media.playing, `t=${media.currentTime && media.currentTime.toFixed(2)}`);
    check('scan hint fades on detection', media.hintFaded);
    const render = await page.evaluate(async () => {
      const s = window.__incardible;
      const png = await s.capture();
      return { frames: s.frames, triangles: s.triangles, anchors: s.anchorsVisible(), png };
    });
    check('3D content is rendered on the anchor', render.anchors[0] === true && render.triangles > 0, `triangles=${render.triangles} frames=${render.frames}`);
    if (render.png) fs.writeFileSync(path.join(tmp, 'ar-webgl.png'), Buffer.from(render.png.split(',')[1], 'base64'));
    await page.screenshot({ path: path.join(tmp, 'ar-found.png') });
  }

  // Flat fallback works and returns
  await page.click('#btn-flat');
  const flat = await page.waitForSelector('#screen-flat:not(.hidden)', { timeout: 10000 }).then(() => true).catch(() => false);
  check('flat fallback renders', flat && (await page.textContent('#flat-heading')).includes('Happy Birthday'));
  await page.screenshot({ path: path.join(tmp, 'flat.png') });

  const fatal = consoleErrors.filter((e) => !/WebGL|GPU|swiftshader|Autoplay|play\(\)|favicon/i.test(e));
  check('no unexpected console errors', fatal.length === 0, fatal.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
