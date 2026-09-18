// Live preview of the AR experience: the chosen card as a flat plane with the
// exact same content the recipient will see, rendered by the shared package.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { parseExperience, buildContent } from 'incardible-ar';

export function draftToPayload(draft, card, mediaUrls) {
  const d = {
    id: draft?._id || null,
    cardId: { frontDesign: card?.frontDesign || null },
    arTemplateData: {
      templateId: draft.templateId,
      mainHeading: draft.heading,
      paragraph1: draft.paragraph1,
      paragraph2: draft.paragraph2,
      effectName: draft.effect,
      musicUrl: draft.musicUrl,
      videoUrl: mediaUrls.video || null,
    },
    templateVideo: mediaUrls.video || null,
  };
  (mediaUrls.photos || []).forEach((u, i) => { d[`templateImage${i}`] = u; });
  return { data: d };
}

export default function Preview({ payload, apiBase, muted = true, className }) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);

  // Build the renderer once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // CSS size is owned by the host; the drawing buffer follows it. Without
    // this the canvas' intrinsic size (CSS × DPR) would widen the host and the
    // ResizeObserver would grow it without bound on retina phones.
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });
    host.style.overflow = 'hidden';
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.15, 3.6);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);
    const clock = new THREE.Clock();
    let content = null;
    const resize = () => {
      const w = host.clientWidth || 300, h = host.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    renderer.setAnimationLoop(() => {
      const dt = Math.min(0.1, clock.getDelta());
      if (content) content.tick(dt);
      cardGroup.rotation.y = Math.sin(performance.now() / 2600) * 0.12;
      renderer.render(scene, camera);
    });
    sceneRef.current = { renderer, scene, camera, cardGroup, setContent: (c) => { content = c; } };
    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      if (content) content.pause();
      renderer.dispose();
      host.innerHTML = '';
      sceneRef.current = null;
    };
  }, []);

  // Rebuild content whenever the draft changes.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || !payload) return undefined;
    const exp = parseExperience(payload, apiBase);
    const front = payload.data?.cardId?.frontDesign;
    const group = s.cardGroup;
    while (group.children.length) group.remove(group.children[0]);

    let aspect = 1.4;
    const build = () => {
      const content = buildContent(exp, aspect);
      if (content.video) { content.video.muted = muted; content.video.loop = true; }
      if (content.audio) content.audio.muted = muted;
      group.add(content.group);
      s.setContent(content);
      content.play();
      // Frame the card + text panel.
      const totalH = aspect + 1.2;
      s.camera.position.z = Math.max(2.8, totalH * 1.55);
      s.camera.position.y = -0.15;
      s.camera.lookAt(0, -0.15, 0);
      return content;
    };

    let content = null;
    if (front) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(front, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        aspect = tex.image.height / tex.image.width || 1.4;
        const card = new THREE.Mesh(new THREE.PlaneGeometry(1, aspect), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
        card.position.z = -0.01;
        group.add(card);
        content = build();
      }, undefined, () => { content = build(); });
    } else {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(1, aspect), new THREE.MeshBasicMaterial({ color: 0xf3e9ee }));
      group.add(card);
      content = build();
    }
    return () => { if (content) content.pause(); };
  }, [payload, apiBase, muted]);

  return <div ref={hostRef} className={className} style={{ width: '100%', height: '100%', minHeight: 320 }} />;
}
