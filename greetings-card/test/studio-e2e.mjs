// Drives the new studio in headless Chromium against the mock API.
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
import { startMockApi } from './mock-api.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const WEB = 'http://127.0.0.1:3005';
const chromePath = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const results = [];
const check = (name, okv, detail = '') => { results.push({ name, ok: !!okv }); console.log(`${okv ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };
const up = (url) => new Promise((r) => http.get(url, (res) => { res.resume(); r(res.statusCode < 500); }).on('error', () => r(false)));
const waitFor = async (fn, ms, step = 500) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, step)); } return false; };

const { server, state, CARD } = await startMockApi(5055);
let dev = null;
if (!(await up(WEB))) {
  const env = { ...process.env };
  for (const line of fs.readFileSync(path.join(here, '.env.test'), 'utf8').split('\n')) { const m = /^([A-Z_]+)=(.*)$/.exec(line); if (m) env[m[1]] = m[2]; }
  dev = spawn('npx', ['next', 'dev', '-p', '3005'], { cwd: root, env, stdio: 'ignore' });
  if (!(await waitFor(() => up(WEB), 120000, 1000))) { console.error('next dev did not start'); process.exit(2); }
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const uuid = 'studio-test-uuid-1';
  const url = `${WEB}/studio/${uuid}?selected=${CARD.uuid}`;

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('text=Write your greeting', { timeout: 180000 });
  check('studio opens on a phone viewport', true, `${((Date.now() - t0) / 1000).toFixed(1)}s (dev build)`);
  check('guest customisation created via upload-card-id', await waitFor(() => Promise.resolve(state.temp.has(uuid)), 10000, 200));
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bodyOverflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow, sh: document.documentElement.scrollHeight, ih: window.innerHeight }));
  check('no horizontal overflow on a phone', overflow.sw <= overflow.cw + 1, JSON.stringify(overflow));

  await page.getByLabel('Heading').fill('Happy Birthday Sam!');
  await page.getByLabel('Your message').fill('Hope your day is as wonderful as you are.');
  await page.getByLabel('Sign-off').fill('Love, Ben');
  const saved = await waitFor(() => Promise.resolve(state.temp.get(uuid)?.arTemplateData?.mainHeading === 'Happy Birthday Sam!'), 8000, 200);
  check('autosave stores arTemplateData (v2)', saved && state.temp.get(uuid).arTemplateData.version === 2, JSON.stringify(state.temp.get(uuid)?.arTemplateData || {}).slice(0, 120));
  check('preview canvas rendered', await page.locator('canvas').count() >= 1);
  await page.screenshot({ path: path.join(here, '.tmp-studio-message.png') });

  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForSelector('text=Add photos and a video');
  await page.locator('input[type=file][accept="image/*"]').setInputFiles(path.join(root, '..', 'ar-viewer', 'test', 'fixtures', 'sample-card.png'));
  const photoUp = await waitFor(() => Promise.resolve(!!state.temp.get(uuid)?.templateImage0), 15000, 250);
  const upFile = [...state.uploads.values()][0];
  check('photo uploaded and downscaled to JPEG', photoUp && upFile && upFile.type === 'image/jpeg' && upFile.data.length < 600 * 1024, upFile ? `${upFile.type} ${(upFile.data.length / 1024).toFixed(0)} KB` : 'no upload');
  await page.waitForSelector('img[src*="templateImages"]', { timeout: 10000 });
  await page.screenshot({ path: path.join(here, '.tmp-studio-media.png') });

  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForSelector('text=Choose a style');
  await page.getByText('With Love', { exact: true }).click();
  const styled = await waitFor(() => Promise.resolve(state.temp.get(uuid)?.arTemplateData?.templateId === 'love' && state.temp.get(uuid)?.arTemplateData?.effectName === 'hearts'), 8000, 200);
  check('template choice saved (love / hearts)', styled);
  await page.screenshot({ path: path.join(here, '.tmp-studio-style.png') });

  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForSelector('text=Ready to order?');
  const guestBtn = await page.getByRole('button', { name: /Log in and continue/ }).count();
  check('guest sees "log in and continue"', guestBtn === 1);

  // Simulate login: token in localStorage, reload; the page must migrate the draft and proceed to checkout.
  await page.evaluate(() => { localStorage.setItem('token', 'test-user-token'); localStorage.setItem('redirectToCheckout', 'true'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const navigated = await waitFor(() => Promise.resolve(page.url().includes('/checkout/')), 60000, 500);
  const cust = state.cust.get(uuid);
  check('draft migrated to the account (guest -> user)', !!cust && cust.arTemplateData?.mainHeading === 'Happy Birthday Sam!' && !!cust.templateImage0);
  check('marked complete and print artwork uploaded (A4 landscape PNG)', !!cust?.templateTextSS && cust?.arTemplateData?.isCustomizationComplete === true && (() => { const f = state.uploads.get(cust.templateTextSS); if (!f) return false; const w = f.data.readUInt32BE(16), h = f.data.readUInt32BE(20); return w === 3508 && h === 2480; })());
  check('navigated to checkout with the customisation id', navigated && page.url().endsWith(`/checkout/${cust?._id}`), page.url());
  if (cust?.templateTextSS) fs.writeFileSync(path.join(here, '.tmp-print.png'), state.uploads.get(cust.templateTextSS).data);

  const fatal = errors.filter((e) => !/ResizeObserver|WebGL|hydrat/i.test(e));
  check('no page errors', fatal.length === 0, fatal.slice(0, 2).join(' | '));
} catch (e) {
  console.error('E2E error:', e && e.stack || e);
  results.push({ name: 'run completed', ok: false });
} finally {
  await browser.close();
  server.close();
  if (dev) dev.kill('SIGTERM');
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
