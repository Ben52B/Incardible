#!/usr/bin/env node
// Incardible target compiler
// ---------------------------
// Turns card artwork (front / inside-right faces) into a MindAR ".mind" image
// tracking target. Runs in Node with sharp for decoding and TensorFlow.js on
// the CPU, so it needs no native canvas build. ~10 s per 1000 px image.
//
// CLI:   node compile.mjs <out.mind> <image1> [image2 ...]
//        prints a JSON summary on stdout (last line)
// Lib:   import { compileTargets } from './compile.mjs'
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

// Longest edge used for feature extraction. Bigger is slower with little gain.
export const MAX_DIMENSION = 1000;
// Below this many feature points a target tracks poorly (flat colours, tiny art).
export const MIN_GOOD_POINTS = 600;

class NodeCompiler extends CompilerBase {
  createProcessCanvas(img) {
    return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: img.data }) }) };
  }
  compileTrack({ progressCallback, targetImages, basePercent }) {
    const percentPerImage = (100 - basePercent) / targetImages.length;
    let percent = 0;
    return Promise.resolve(targetImages.map((t) => {
      const list = buildTrackingImageList(t);
      const per = percentPerImage / list.length;
      return extractTrackingFeatures(list, () => { percent += per; progressCallback(basePercent + percent); });
    }));
  }
}

export async function loadImage(file, maxDim = MAX_DIMENSION) {
  const { data, info } = await sharp(file)
    .rotate()
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
  };
}

/**
 * @param {string[]} files  image paths, in target order
 * @param {string} out      output .mind path
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<{bytes:number, targets:Array<{index:number,file:string,width:number,height:number,points:number,quality:'good'|'weak'}>}>}
 */
export async function compileTargets(files, out, onProgress = () => {}) {
  if (!files.length) throw new Error('No input images');
  await tf.setBackend('cpu');
  await tf.ready();
  const images = [];
  for (const f of files) images.push(await loadImage(f));
  const compiler = new NodeCompiler();
  const data = await compiler.compileImageTargets(images, onProgress);
  const buf = compiler.exportData();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(buf));
  const targets = data.map((d, i) => {
    const points = d.matchingData.reduce((s, k) => s + k.maximaPoints.length + k.minimaPoints.length, 0);
    return {
      index: i,
      file: files[i],
      width: d.targetImage.width,
      height: d.targetImage.height,
      points,
      quality: points >= MIN_GOOD_POINTS ? 'good' : 'weak',
    };
  });
  return { bytes: buf.byteLength, targets };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isCli) {
  if (process.argv[2] === '--check') {
    console.log(JSON.stringify({ ok: true, tfjs: tf.version.tfjs, sharp: sharp.versions.sharp }));
    process.exit(0);
  }
  const [, , out, ...files] = process.argv;
  if (!out || !files.length) {
    console.error('usage: compile.mjs <out.mind> <image> [image...]');
    process.exit(2);
  }
  let last = -1;
  compileTargets(files, out, (p) => {
    const q = Math.floor(p / 10) * 10;
    if (q !== last) { last = q; process.stderr.write(`${q}% `); }
  }).then((r) => {
    process.stderr.write('\n');
    console.log(JSON.stringify(r));
  }).catch((e) => {
    console.error(e && e.stack || e);
    process.exit(1);
  });
}
