// Tracking-target pipeline
// ------------------------
// Each card's front and inside-right artwork is compiled into one MindAR
// ".mind" file that the web AR viewer loads. Compilation is CPU heavy
// (~10 s per face) so it runs in a child process, one card at a time, and the
// result is stored on the Card document:
//
//   card.trackingTarget = {
//     status: 'pending' | 'ready' | 'failed' | 'none',
//     path: 'uploads/targets/<uuid>-<hash>.mind',
//     faces: ['front', 'insideRight'],           // order == target index in the .mind file
//     targets: [{face, width, height, points, quality}],
//     sourceHash, compiledAt, error
//   }
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {spawn} = require('child_process');
const Card = require('../models/card');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TARGET_DIR = path.join(PUBLIC_DIR, 'uploads', 'targets');
const COMPILER = process.env.TARGET_COMPILER_PATH
    || path.join(__dirname, '..', '..', 'tools', 'target-compiler', 'compile.mjs');

const FACES = [
    {face: 'front', field: 'frontDesign'},
    {face: 'insideRight', field: 'insideRightDesign'},
];

const relToAbs = (rel) => path.join(PUBLIC_DIR, String(rel).replace(/\\/g, '/').replace(/^\/+/, ''));

function sourceFilesFor(card) {
    const files = [];
    for (const {face, field} of FACES) {
        const rel = card[field];
        if (!rel) continue;
        const abs = relToAbs(rel);
        if (fs.existsSync(abs)) files.push({face, abs, rel});
    }
    return files;
}

function hashSources(files) {
    const h = crypto.createHash('sha1');
    for (const f of files) {
        const st = fs.statSync(f.abs);
        h.update(`${f.face}:${f.rel}:${st.size}:${Math.floor(st.mtimeMs)};`);
    }
    return h.digest('hex').slice(0, 12);
}

function runCompiler(outAbs, inputs) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [COMPILER, outAbs, ...inputs], {stdio: ['ignore', 'pipe', 'pipe']});
        let out = '', err = '';
        child.stdout.on('data', d => out += d);
        child.stderr.on('data', d => err += d);
        child.on('error', reject);
        child.on('close', (code) => {
            if (code !== 0) return reject(new Error(`compiler exited ${code}: ${err.slice(-500)}`));
            try {
                const last = out.trim().split('\n').pop();
                resolve(JSON.parse(last));
            } catch (e) {
                reject(new Error(`compiler output unreadable: ${out.slice(-300)}`));
            }
        });
    });
}

/** Compile now (blocking the caller, not the event loop). */
async function compileCardTarget(cardId, {force = false} = {}) {
    const card = await Card.findById(cardId);
    if (!card) throw new Error('Card not found');
    const files = sourceFilesFor(card);
    if (!files.length) {
        await Card.updateOne({_id: card._id}, {$set: {trackingTarget: {status: 'none', faces: [], targets: [], compiledAt: new Date()}}});
        return {status: 'none'};
    }
    const sourceHash = hashSources(files);
    const current = card.trackingTarget || {};
    if (!force && current.status === 'ready' && current.sourceHash === sourceHash && current.path && fs.existsSync(relToAbs(current.path))) {
        return {status: 'ready', unchanged: true, path: current.path};
    }

    await Card.updateOne({_id: card._id}, {$set: {'trackingTarget.status': 'pending', 'trackingTarget.error': null}});
    const filename = `${card.uuid || card._id}-${sourceHash}.mind`;
    const outAbs = path.join(TARGET_DIR, filename);
    const rel = `uploads/targets/${filename}`;
    try {
        const result = await runCompiler(outAbs, files.map(f => f.abs));
        const targets = result.targets.map((t, i) => ({
            face: files[i].face, width: t.width, height: t.height, points: t.points, quality: t.quality,
        }));
        const trackingTarget = {
            status: 'ready', path: rel, faces: files.map(f => f.face), targets,
            bytes: result.bytes, sourceHash, compiledAt: new Date(), error: null,
        };
        await Card.updateOne({_id: card._id}, {$set: {trackingTarget}});
        // Remove stale target files for this card.
        if (current.path && current.path !== rel) {
            fs.promises.unlink(relToAbs(current.path)).catch(() => {});
        }
        return trackingTarget;
    } catch (err) {
        await Card.updateOne({_id: card._id}, {$set: {'trackingTarget.status': 'failed', 'trackingTarget.error': String(err.message).slice(0, 500)}});
        throw err;
    }
}

// ---- serial in-process queue -------------------------------------------
const queue = [];
const queued = new Set();
let running = false;

async function drain() {
    if (running) return;
    running = true;
    while (queue.length) {
        const {cardId, force} = queue.shift();
        queued.delete(String(cardId));
        try {
            const r = await compileCardTarget(cardId, {force});
            if (!r.unchanged) console.log(`[targets] card ${cardId}: ${r.status}${r.targets ? ` (${r.targets.map(t => `${t.face}:${t.points}pts`).join(', ')})` : ''}`);
        } catch (err) {
            console.error(`[targets] card ${cardId} failed:`, err.message);
        }
    }
    running = false;
}

/** Fire-and-forget: compile in the background, deduplicated per card. */
function scheduleCardTargetCompile(cardId, {force = false} = {}) {
    const key = String(cardId);
    if (queued.has(key)) return;
    queued.add(key);
    queue.push({cardId, force});
    // Small delay so a burst of face uploads results in one compile.
    const t = setTimeout(drain, 1500);
    if (t.unref) t.unref();
}

module.exports = {compileCardTarget, scheduleCardTargetCompile, sourceFilesFor, FACES, COMPILER};
