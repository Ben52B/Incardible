// Prepares everything the e2e test needs in test/.tmp:
//   - sample-card.mind   compiled tracking target (tools/target-compiler)
//   - cam.y4m            fake camera feed showing the card
//   - video.webm         short test clip (Chromium MediaRecorder)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const tmp = path.join(here, '.tmp');
fs.mkdirSync(tmp, { recursive: true });
const card = process.argv[2] || path.join(here, 'fixtures', 'sample-card.png');
fs.copyFileSync(card, path.join(tmp, 'front.png'));
const compiler = path.join(here, '..', '..', 'tools', 'target-compiler', 'compile.mjs');
if (!fs.existsSync(path.join(tmp, 'front.mind'))) {
  console.log('compiling tracking target (≈10 s)…');
  execFileSync(process.execPath, [compiler, path.join(tmp, 'front.mind'), path.join(tmp, 'front.png')], { stdio: 'inherit' });
}
if (!fs.existsSync(path.join(tmp, 'cam.y4m'))) execFileSync(process.execPath, [path.join(here, 'make-cam.mjs'), path.join(tmp, 'front.png'), path.join(tmp, 'cam.y4m')], { stdio: 'inherit', env: { ...process.env, CARD_FRACTION: '0.5' } });
if (!fs.existsSync(path.join(tmp, 'video.webm'))) execFileSync(process.execPath, [path.join(here, 'make-video.mjs'), path.join(tmp, 'video.webm')], { stdio: 'inherit' });
console.log('test fixtures ready in', tmp);
