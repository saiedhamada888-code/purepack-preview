/* بيورباك — موديل الجردل ثلاثي الأبعاد (Three.js)
   بيستخدم في: الهيرو، عارض ٣٦٠° في صفحة المنتج، وأداة طباعة اللوجو. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export { THREE };

// أبعاد نسبية (مش مقاسات حقيقية): الارتفاع 1
const H = 1.0, R_TOP = 0.5, R_BOT = 0.41;
const rAt = (y) => R_BOT + (R_TOP - R_BOT) * (y / H);

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/**
 * createBucket({ color, handle: 'metal'|'plastic'|'none', lid: true, label: {...} })
 * label: { text, sub, bg, fg, image (HTMLImageElement اختياري) }
 */
export function createBucket(opts = {}) {
  const group = new THREE.Group();
  const color = new THREE.Color(opts.color || '#F4F6F7');

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.0, side: THREE.DoubleSide });

  // جسم الجردل (Lathe): قاع + جدار مخروطي + شفة
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(R_BOT - 0.03, 0.0),
    new THREE.Vector2(R_BOT, 0.02),
    new THREE.Vector2(rAt(0.12) + 0.004, 0.12),
    new THREE.Vector2(rAt(0.13) + 0.012, 0.13),
    new THREE.Vector2(rAt(0.145) + 0.004, 0.145),
    new THREE.Vector2(rAt(0.86), 0.86),
    new THREE.Vector2(rAt(0.87) + 0.018, 0.87),
    new THREE.Vector2(rAt(0.9) + 0.018, 0.9),
    new THREE.Vector2(rAt(0.905), 0.905),
    new THREE.Vector2(R_TOP, H - 0.02),
    new THREE.Vector2(R_TOP + 0.035, H - 0.01),
    new THREE.Vector2(R_TOP + 0.035, H + 0.02),
    new THREE.Vector2(R_TOP - 0.02, H + 0.02),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), bodyMat);
  group.add(body);
  // أجزاء الجردل متاحة بره عشان الأنيميشن يتحكم فيها (رحلة الجردل في الرئيسية)
  const parts = { body, bodyMat, lid: null, handle: [], ears: [], label: null };

  // الغطا
  if (opts.lid !== false) {
    const lidMat = new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0, 0, 0.02), roughness: 0.38 });
    const lidPts = [
      new THREE.Vector2(0, H + 0.075),
      new THREE.Vector2(R_TOP - 0.06, H + 0.07),
      new THREE.Vector2(R_TOP - 0.02, H + 0.085),
      new THREE.Vector2(R_TOP + 0.05, H + 0.085),
      new THREE.Vector2(R_TOP + 0.055, H + 0.07),
      new THREE.Vector2(R_TOP + 0.055, H - 0.02),
      new THREE.Vector2(R_TOP + 0.045, H - 0.03),
    ];
    parts.lid = new THREE.Mesh(new THREE.LatheGeometry(lidPts, 96), lidMat);
    group.add(parts.lid);
  }

  // اليد
  const handle = opts.handle || 'metal';
  if (handle !== 'none') {
    const isMetal = handle === 'metal';
    const hMat = new THREE.MeshStandardMaterial({
      color: isMetal ? 0x8C99A3 : color.clone().offsetHSL(0, 0, -0.1),
      roughness: isMetal ? 0.3 : 0.5, metalness: isMetal ? 0.85 : 0,
    });
    const hr = R_TOP + 0.06;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(hr, isMetal ? 0.011 : 0.02, 10, 64, Math.PI), hMat);
    arc.position.y = H - 0.08;
    arc.rotation.x = -0.5;
    group.add(arc);
    parts.handle.push(arc);
    if (!isMetal) {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), hMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(0, H - 0.08 + hr * Math.cos(0.5), -hr * Math.sin(0.5));
      group.add(grip);
      parts.handle.push(grip);
    }
    const earMat = new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0, 0, -0.06), roughness: 0.5 });
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 20), earMat);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(s * (rAt(H - 0.08) + 0.012), H - 0.08, 0);
      group.add(ear);
      parts.ears.push(ear);
    });
  }

  // الاستيكر
  const labelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rAt(0.8) + 0.009, rAt(0.2) + 0.009, 0.6, 96, 1, true, -1.25, 2.5),
    new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.35, side: THREE.FrontSide })
  );
  labelMesh.position.y = 0.5;
  labelMesh.visible = false;
  group.add(labelMesh);
  parts.label = labelMesh;

  group.position.y = -0.55;

  const api = {
    group,
    parts,
    setColor(hex) {
      const c = hex && hex.isColor ? hex : new THREE.Color(hex);
      bodyMat.color.copy(c);
      if (parts.lid) parts.lid.material.color.copy(c).offsetHSL(0, 0, 0.02);
      parts.ears.forEach((e) => e.material.color.copy(c).offsetHSL(0, 0, -0.06));
      parts.handle.forEach((h) => { if (h.material.metalness < 0.5) h.material.color.copy(c).offsetHSL(0, 0, -0.1); });
    },
    async setLabel(label) {
      if (!label) { labelMesh.visible = false; return; }
      const tex = await labelTexture(label);
      if (labelMesh.material.map) labelMesh.material.map.dispose();
      labelMesh.material.map = tex;
      labelMesh.material.needsUpdate = true;
      labelMesh.visible = true;
    },
  };
  if (opts.label) api.setLabel(opts.label);
  return api;
}

/** رسم الاستيكر على canvas: نص العلامة أو اللوجو المرفوع */
async function labelTexture({ text = '', sub = '', bg = '#B5321F', fg = '#ffffff', image = null }) {
  const W = 1024, Hh = 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = Hh;
  const g = c.getContext('2d');
  try { await document.fonts.load('700 140px "Readex Pro"'); } catch (e) { /* الخط هيتحمل بعدين */ }

  g.fillStyle = bg;
  g.fillRect(0, 0, W, Hh);
  // شريط علوي رفيع بلون اللوجو
  g.fillStyle = 'rgba(255,255,255,.18)';
  g.fillRect(0, 22, W, 6);
  g.fillRect(0, Hh - 28, W, 6);

  if (image) {
    const pad = 60, maxW = W * 0.62, maxH = Hh - pad * 2;
    const r = Math.min(maxW / image.width, maxH / image.height);
    const w = image.width * r, h = image.height * r;
    g.drawImage(image, (W - w) / 2, (Hh - h) / 2, w, h);
  } else {
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr';
    let size = 150;
    g.font = `700 ${size}px "Readex Pro", sans-serif`;
    while (g.measureText(text).width > W * 0.5 && size > 36) { size -= 6; g.font = `700 ${size}px "Readex Pro", sans-serif`; }
    g.fillText(text, W / 2, sub ? Hh / 2 - 30 : Hh / 2 + 6);
    if (sub) {
      g.globalAlpha = 0.85;
      g.font = `500 44px "IBM Plex Sans Arabic", sans-serif`;
      g.direction = /[؀-ۿ]/.test(sub) ? 'rtl' : 'ltr';
      g.fillText(sub, W / 2, Hh / 2 + 82);
      g.globalAlpha = 1;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** مشهد جاهز: كاميرا + إضاءة + ظل ناعم تحت الجردل */
export function createStage(canvas, { fov = 30, distance = 3.4, height = 0.35 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50);
  camera.position.set(0, height, distance);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xB8CBD6, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.2, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xCFE3EE, 0.9);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  // ظل ناعم
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const sg = sc.getContext('2d');
  const grad = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,52,77,.35)');
  grad.addColorStop(1, 'rgba(0,52,77,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.56;
  scene.add(shadow);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  return { renderer, scene, camera, resize, render: () => renderer.render(scene, camera) };
}
