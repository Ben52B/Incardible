// Renders a card image into a Y4M "camera feed" (I420) for Chromium's fake
// video capture. Uses sharp from the target-compiler package (no ffmpeg needed).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'tools', 'target-compiler', 'node_modules', 'sharp'));

const [, , input, output, wArg = '960', hArg = '720', fpsArg = '10', secArg = '3'] = process.argv;
const W = +wArg, H = +hArg, FPS = +fpsArg, FRAMES = Math.round(+secArg * FPS);

const rgb = await sharp(input).rotate().flatten({ background: '#ffffff' })
  .resize({ height: Math.round(H * +(process.env.CARD_FRACTION || 0.5)), fit: "inside" })
  .extend({ background: { r: 138, g: 143, b: 153 }, top: 0, bottom: 0, left: 0, right: 0 })
  .toBuffer()
  .then((b) => sharp(b).resize({ width: W, height: H, fit: 'contain', background: { r: 138, g: 143, b: 153 } }).removeAlpha().raw().toBuffer());

// RGB -> I420
const Y = Buffer.alloc(W * H), U = Buffer.alloc((W / 2) * (H / 2)), V = Buffer.alloc((W / 2) * (H / 2));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3, r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
  Y[y * W + x] = Math.max(0, Math.min(255, Math.round(0.257 * r + 0.504 * g + 0.098 * b + 16)));
  if ((y & 1) === 0 && (x & 1) === 0) {
    const j = (y / 2) * (W / 2) + x / 2;
    U[j] = Math.max(0, Math.min(255, Math.round(-0.148 * r - 0.291 * g + 0.439 * b + 128)));
    V[j] = Math.max(0, Math.min(255, Math.round(0.439 * r - 0.368 * g - 0.071 * b + 128)));
  }
}
const frame = Buffer.concat([Buffer.from('FRAME\n'), Y, U, V]);
const out = fs.createWriteStream(output);
out.write(`YUV4MPEG2 W${W} H${H} F${FPS}:1 Ip A1:1 C420jpeg\n`);
for (let f = 0; f < FRAMES; f++) out.write(frame);
out.end(() => console.log(`wrote ${output}: ${W}x${H} ${FPS}fps ${FRAMES} frames`));
