// Builds the 3D content for one Incardible experience and anchors it to the
// tracked card. Coordinates: MindAR normalises the target so its width is 1
// unit and its centre is the origin; +y is up the card, +z is towards the viewer.
import * as THREE from 'three';

const pick = (obj, keys, fallback = null) => {
  for (const k of keys) {
    const v = obj && obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback;
};

/** Normalise the API payload into what the renderer needs. */
export function parseExperience(json, apiBase) {
  const d = json && json.data ? json.data : json || {};
  const t = d.arTemplateData || {};
  const abs = (u) => {
    if (!u || typeof u !== 'string') return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `${apiBase.replace(/\/$/, '')}/${u.replace(/^\/+/, '')}`;
  };
  const photos = [];
  for (let i = 0; i <= 10; i++) {
    const u = abs(d[`templateImage${i}`]);
    if (u) photos.push(u);
  }
  const video = abs(pick(d, ['templateVideo']) || pick(t, ['videoUrl', 'video', 'selectedVideo']));
  let music = pick(t, ['musicUrl', 'audioUrl', 'music', 'selectedMusic', 'selectedAudio', 'sound']);
  if (music && typeof music === 'string' && !/^https?:\/\//i.test(music) && !music.startsWith('/')) {
    music = `music/${music}`;
  }
  music = abs(music);
  const effect = String(pick(t, ['effect', 'selectedEffect', 'particleEffect', 'particle', 'selectedEffectPrefab'], 'sparkles')).toLowerCase();
  return {
    id: d.id || null,
    isPaid: d.isPaid !== false,
    heading: String(pick(t, ['mainHeading', 'mainHeadingText', 'heading', 'title'], '') || '').trim(),
    paragraph1: String(pick(t, ['paragraph1', 'paragraph1Text', 'message'], '') || '').trim(),
    paragraph2: String(pick(t, ['paragraph2', 'paragraph2Text'], '') || '').trim(),
    textColor: pick(t, ['textColor'], '#ffffff'),
    photos,
    video,
    music,
    effect: /heart/.test(effect) ? 'hearts' : /confetti/.test(effect) ? 'confetti' : /none|off|false/.test(effect) ? 'none' : 'sparkles',
    tracking: d.tracking || { status: 'none' },
    card: d.cardId || {},
  };
}

// ---------------------------------------------------------------------------
// Text panel rendered to a canvas texture
// ---------------------------------------------------------------------------
function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text).split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width > maxWidth) { out.push(line); line = words[i]; } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function makeTextPanel({ heading, paragraph1, paragraph2, color = '#ffffff' }, widthUnits = 1.1) {
  const W = 1024, PAD = 56;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  const ctx = canvas.getContext('2d');
  const headingSize = 72, bodySize = 44, lineH = 1.3;
  ctx.font = `700 ${headingSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const hLines = heading ? wrapLines(ctx, heading, W - PAD * 2) : [];
  ctx.font = `400 ${bodySize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const p1 = paragraph1 ? wrapLines(ctx, paragraph1, W - PAD * 2) : [];
  const p2 = paragraph2 ? wrapLines(ctx, paragraph2, W - PAD * 2) : [];
  const H = Math.ceil(PAD * 2 + hLines.length * headingSize * lineH + (hLines.length ? 24 : 0)
    + p1.length * bodySize * lineH + (p1.length && p2.length ? 28 : 0) + p2.length * bodySize * lineH);
  if (H <= PAD * 2) return null;
  canvas.height = H;
  // Background card
  const r = 40;
  ctx.fillStyle = 'rgba(20, 22, 30, 0.82)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, r);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  let y = PAD;
  ctx.font = `700 ${headingSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  for (const l of hLines) { ctx.fillText(l, PAD, y); y += headingSize * lineH; }
  if (hLines.length) y += 24;
  ctx.font = `400 ${bodySize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  for (const l of p1) { ctx.fillText(l, PAD, y); y += bodySize * lineH; }
  if (p1.length && p2.length) y += 28;
  for (const l of p2) { ctx.fillText(l, PAD, y); y += bodySize * lineH; }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(widthUnits, widthUnits * (H / W));
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.aspect = H / W;
  return mesh;
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
function spriteTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  if (kind === 'hearts') {
    ctx.fillStyle = '#ff5c8a';
    ctx.beginPath();
    ctx.moveTo(32, 56);
    ctx.bezierCurveTo(4, 36, 4, 12, 20, 12);
    ctx.bezierCurveTo(28, 12, 32, 20, 32, 22);
    ctx.bezierCurveTo(32, 20, 36, 12, 44, 12);
    ctx.bezierCurveTo(60, 12, 60, 36, 32, 56);
    ctx.fill();
  } else if (kind === 'confetti') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 22, 28, 18);
  } else {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,240,200,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeParticles(kind, cardW = 1, cardH = 1.4, count = 90) {
  if (kind === 'none') return null;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = kind === 'confetti'
    ? [[1, .3, .4], [1, .8, .2], [.3, .8, 1], [.5, 1, .5], [.9, .5, 1]]
    : kind === 'hearts' ? [[1, 1, 1]] : [[1, 1, 1], [1, .9, .7], [.8, .9, 1]];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * cardW * 1.6;
    pos[i * 3 + 1] = (Math.random() - 0.5) * cardH * 1.6;
    pos[i * 3 + 2] = Math.random() * 0.6;
    vel[i * 3] = (Math.random() - 0.5) * 0.15;
    vel[i * 3 + 1] = kind === 'confetti' ? -(0.15 + Math.random() * 0.25) : 0.12 + Math.random() * 0.2;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    const c = palette[i % palette.length];
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: kind === 'hearts' ? 0.09 : kind === 'confetti' ? 0.06 : 0.07,
    map: spriteTexture(kind), transparent: true, depthWrite: false, vertexColors: true,
    blending: kind === 'sparkles' ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.tick = (dt) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3] += vel[i * 3] * dt;
      p[i * 3 + 1] += vel[i * 3 + 1] * dt;
      p[i * 3 + 2] += vel[i * 3 + 2] * dt;
      const top = cardH * 0.9, bottom = -cardH * 0.9;
      if (p[i * 3 + 1] > top) { p[i * 3 + 1] = bottom; p[i * 3] = (Math.random() - 0.5) * cardW * 1.6; }
      if (p[i * 3 + 1] < bottom) { p[i * 3 + 1] = top; p[i * 3] = (Math.random() - 0.5) * cardW * 1.6; }
    }
    geo.attributes.position.needsUpdate = true;
  };
  return points;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export function makeVideo(url) {
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.loop = true;
  video.preload = 'auto';
  video.muted = false;
  const tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5625), mat);
  mesh.visible = false;
  video.addEventListener('loadedmetadata', () => {
    const a = video.videoHeight / video.videoWidth || 0.5625;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(1, a);
    mesh.userData.aspect = a;
    mesh.visible = true;
    if (mesh.userData.onReady) mesh.userData.onReady(a);
  });
  // A transient network/decoder hiccup must not leave the card silent: reload
  // the source a few times before giving up.
  let retries = 0;
  video.addEventListener('error', () => {
    const code = video.error && video.error.code;
    if (retries < 3) {
      retries++;
      console.warn(`video error ${code}; retrying load (${retries})`);
      setTimeout(() => { video.load(); if (mesh.userData.wantPlay) video.play().catch(() => {}); }, 600 * retries);
    }
  });
  mesh.userData.video = video;
  return mesh;
}

export function makePhotoCarousel(urls, size = 0.5) {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const meshes = urls.map((u, i) => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: i === 0 ? 1 : 0, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    loader.load(u, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const a = tex.image.height / tex.image.width;
      m.geometry.dispose();
      m.geometry = a >= 1 ? new THREE.PlaneGeometry(size / a, size) : new THREE.PlaneGeometry(size, size * a);
      mat.map = tex; mat.needsUpdate = true;
    });
    m.position.z = 0.002 * i;
    group.add(m);
    return m;
  });
  let current = 0, t = 0;
  const HOLD = 3.2, FADE = 0.6;
  group.userData.tick = (dt) => {
    if (meshes.length < 2) return;
    t += dt;
    if (t > HOLD) {
      const next = (current + 1) % meshes.length;
      const k = Math.min(1, (t - HOLD) / FADE);
      meshes[current].material.opacity = 1 - k;
      meshes[next].material.opacity = k;
      if (k >= 1) { current = next; t = 0; }
    }
    group.rotation.y = Math.sin(performance.now() / 1400) * 0.08;
  };
  return group;
}

/**
 * Compose the scene for a card of aspect (height/width) `cardAspect`.
 * Layout: video floats over the card; text hangs above; photos to the right.
 */
export function buildContent(exp, cardAspect = 1.4) {
  const root = new THREE.Group();
  const tickers = [];
  const cardH = cardAspect;

  let videoMesh = null;
  if (exp.video) {
    videoMesh = makeVideo(exp.video);
    videoMesh.position.set(0, 0, 0.02);
    videoMesh.userData.onReady = (a) => {
      // Fit the video inside the card face with a small margin.
      const s = Math.min(0.92, (cardH * 0.92) / a);
      videoMesh.scale.set(s, s, 1);
    };
    root.add(videoMesh);
  }

  // Text hangs just below the card so it stays in view while the phone is
  // pointed at the card; photos float above the top edge.
  const text = makeTextPanel({ heading: exp.heading, paragraph1: exp.paragraph1, paragraph2: exp.paragraph2, color: exp.textColor }, 1.1);
  if (text) {
    text.position.set(0, -(cardH / 2) - 0.06 - (text.userData.aspect * 1.1) / 2, 0.05);
    root.add(text);
  }

  if (exp.photos.length) {
    const size = 0.6;
    const carousel = makePhotoCarousel(exp.photos, size);
    if (videoMesh) {
      carousel.position.set(0, cardH / 2 + 0.06 + size / 2, 0.06);
    } else {
      // No video: photos take the centre of the card.
      carousel.position.set(0, 0, 0.04);
      carousel.scale.setScalar(Math.min(1.5, (cardH * 0.9) / size));
    }
    root.add(carousel);
    tickers.push(carousel.userData.tick);
  }

  const particles = makeParticles(exp.effect, 1, cardH);
  if (particles) {
    particles.position.z = 0.15;
    root.add(particles);
    tickers.push(particles.userData.tick);
  }

  let audio = null;
  if (exp.music) {
    audio = new Audio(exp.music);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.volume = 0.6;
  }

  return {
    group: root,
    video: videoMesh ? videoMesh.userData.video : null,
    audio,
    tick(dt) { for (const f of tickers) f(dt); },
    play() {
      if (videoMesh) {
        videoMesh.userData.wantPlay = true;
        videoMesh.userData.video.play().catch((e) => {
          // Autoplay policy: retry muted so the picture still shows; sound
          // returns on the next tap (see app.js).
          root.userData.playError = e && e.name;
          console.warn('video play blocked:', e && e.name);
          const v = videoMesh.userData.video;
          v.muted = true;
          v.play().catch(() => {});
        });
      }
      if (audio) audio.play().catch((e) => console.warn('audio play blocked:', e && e.name));
    },
    pause() {
      if (videoMesh) { videoMesh.userData.wantPlay = false; videoMesh.userData.video.pause(); }
      if (audio) audio.pause();
    },
  };
}
