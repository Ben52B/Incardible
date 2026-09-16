// Incardible AR viewer
// URL contract (unchanged from the Unity viewer): ?templateId=<CardCustomization _id>
import * as THREE from 'three';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import { parseExperience, buildContent } from './experience.js';

const $ = (id) => document.getElementById(id);
const screens = ['screen-start', 'screen-loading', 'screen-flat', 'screen-error'];
const show = (id) => { for (const s of screens) $(s).classList.toggle('hidden', s !== id); $('hud').classList.toggle('hidden', id !== null); };
const setProgress = (pct, text) => { $('progress-bar').style.width = `${Math.max(0, Math.min(100, pct))}%`; if (text) $('loading-text').textContent = text; };

const params = new URLSearchParams(location.search);
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const API_BASE = (isLocal && params.get('api')) || (window.INCARDIBLE_CONFIG && window.INCARDIBLE_CONFIG.apiBase) || 'https://api.incardible.com.au';
const templateId = params.get('templateId') || (location.pathname.split('/').filter(Boolean).pop() || '').match(/^[a-f0-9]{24}$/i)?.[0] || null;

const state = { exp: null, mindar: null, content: null, mode: null, started: false };
window.__incardible = state; // for tests and support

async function fetchExperience() {
  if (!templateId) throw new Error('This link is missing its card id. Please scan the QR code on your card again.');
  const res = await fetch(`${API_BASE}/api/user/ar-experience/get/${encodeURIComponent(templateId)}`, { cache: 'no-store' });
  if (res.status === 404) throw new Error('We could not find this card. Please check the QR code and try again.');
  if (!res.ok) throw new Error('The card could not be loaded right now. Please try again in a moment.');
  const json = await res.json();
  return parseExperience(json, API_BASE);
}

function showError(msg) {
  $('error-text').textContent = msg;
  show('screen-error');
}

// ---------------------------------------------------------------------------
// Flat (no-camera) mode
// ---------------------------------------------------------------------------
function renderFlat(exp) {
  $('flat-heading').textContent = exp.heading || 'A card for you';
  $('flat-p1').textContent = exp.paragraph1 || '';
  $('flat-p2').textContent = exp.paragraph2 || '';
  const media = $('flat-media');
  media.innerHTML = '';
  if (exp.video) {
    const v = document.createElement('video');
    v.src = exp.video; v.controls = true; v.playsInline = true; v.autoplay = true; v.loop = true;
    media.appendChild(v);
  }
  if (exp.photos.length) {
    const grid = document.createElement('div');
    grid.className = 'photos';
    for (const u of exp.photos) { const img = document.createElement('img'); img.src = u; img.alt = ''; img.loading = 'lazy'; grid.appendChild(img); }
    media.appendChild(grid);
  }
  if (exp.music) {
    const a = document.createElement('audio');
    a.src = exp.music; a.controls = true; a.loop = true; a.autoplay = true;
    media.appendChild(a);
  }
  state.mode = 'flat';
  show('screen-flat');
  $('btn-back-ar').classList.toggle('hidden', !(exp.tracking && exp.tracking.status === 'ready'));
}

// ---------------------------------------------------------------------------
// AR mode
// ---------------------------------------------------------------------------
async function startAR(exp) {
  if (!exp.tracking || exp.tracking.status !== 'ready' || !exp.tracking.url) {
    renderFlat(exp);
    $('flat-heading').insertAdjacentHTML('afterend', '<p class="hint">The camera experience for this card is still being prepared. Here is your greeting in the meantime.</p>');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    renderFlat(exp);
    return;
  }
  show('screen-loading');
  setProgress(10, 'Preparing the card…');

  const container = $('ar-container');
  if (state.mindar) { try { await state.mindar.stop(); } catch (_) {} state.mindar = null; container.innerHTML = ''; }

  const mindar = new MindARThree({
    container,
    imageTargetSrc: exp.tracking.url,
    maxTrack: 1,
    uiLoading: 'no', uiScanning: 'no', uiError: 'no',
    filterMinCF: 0.0005, filterBeta: 0.01,
    warmupTolerance: 3, missTolerance: 8,
  });
  state.mindar = mindar;
  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // One content group per compiled face; the same greeting appears whichever
  // side of the card the recipient points at.
  const targets = exp.tracking.targets && exp.tracking.targets.length ? exp.tracking.targets : [{ face: 'front', width: 1, height: 1.4 }];
  const contents = [];
  let visibleCount = 0;
  targets.forEach((t, i) => {
    const aspect = t.width && t.height ? t.height / t.width : 1.4;
    const content = buildContent(exp, aspect);
    const anchor = mindar.addAnchor(i);
    anchor.group.add(content.group);
    anchor.onTargetFound = () => {
      visibleCount++;
      $('scan-hint').classList.add('faded');
      content.play();
      state.found = true;
    };
    anchor.onTargetLost = () => {
      visibleCount = Math.max(0, visibleCount - 1);
      if (visibleCount === 0) { $('scan-hint').classList.remove('faded'); content.pause(); }
    };
    contents.push(content);
  });
  state.content = contents;

  setProgress(35, 'Starting your camera…');
  try {
    await mindar.start();
  } catch (err) {
    console.error('MindAR start failed', err);
    const denied = /denied|permission|NotAllowed/i.test(String(err && (err.name || err.message)));
    renderFlat(exp);
    if (denied) $('flat-heading').insertAdjacentHTML('afterend', '<p class="hint">Camera access was blocked. Allow the camera in your browser settings, or enjoy the card here.</p>');
    return;
  }
  setProgress(100, 'Ready');
  state.mode = 'ar';
  show(null);
  $('scan-hint').classList.remove('faded');
  $('scan-hint').textContent = targets.length > 1 ? 'Point your camera at the front or inside of the card' : 'Point your camera at the card';

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.1, clock.getDelta());
    for (const c of contents) c.tick(dt);
    renderer.render(scene, camera);
    state.frames = (state.frames || 0) + 1;
    state.triangles = renderer.info.render.triangles;
    if (state.captureRequest) {
      // Must run synchronously after render (drawing buffer is not preserved).
      const done = state.captureRequest; state.captureRequest = null;
      try { done(renderer.domElement.toDataURL('image/png')); } catch (e) { done(null); }
    }
  });
  state.anchorsVisible = () => mindar.anchors.map((a) => a.group.visible);
  state.capture = () => new Promise((resolve) => { state.captureRequest = resolve; });
}

async function stopAR() {
  if (state.mindar) {
    try { state.mindar.renderer.setAnimationLoop(null); await state.mindar.stop(); } catch (_) {}
  }
  if (state.content) for (const c of state.content) c.pause();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot(mode) {
  try {
    show('screen-loading');
    setProgress(5, 'Loading your card…');
    if (!state.exp) state.exp = await fetchExperience();
    if (state.exp.heading) $('start-subtitle').textContent = state.exp.heading;
    if (mode === 'flat') { await stopAR(); renderFlat(state.exp); return; }
    await startAR(state.exp);
  } catch (err) {
    console.error(err);
    showError(err.message || 'Please try again.');
  }
}

$('btn-start').addEventListener('click', () => boot('ar'));
$('btn-flat-start').addEventListener('click', () => boot('flat'));
$('btn-flat').addEventListener('click', () => boot('flat'));
$('btn-back-ar').addEventListener('click', () => boot('ar'));
$('btn-retry').addEventListener('click', () => { state.exp = null; show('screen-start'); });

// Pause media when the tab is hidden; resume tracking when it returns.
document.addEventListener('visibilitychange', () => {
  if (!state.content) return;
  if (document.hidden) for (const c of state.content) c.pause();
});

// Prefetch the experience so the start screen can show the greeting title.
fetchExperience().then((exp) => {
  state.exp = exp;
  if (exp.heading) $('start-subtitle').textContent = exp.heading;
}).catch((err) => {
  // Keep the start screen; the error is shown when the user taps start.
  console.warn(err.message);
});
