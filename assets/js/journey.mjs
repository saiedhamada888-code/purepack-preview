/* بيورباك — "رحلة الجردل": مشهد ثلاثي الأبعاد بيتحرك مع السكرول
   ٦ فصول: الخامة ← الحقن ← اليد ← الطباعة ← الفحص ← الرص والتغليف
   لو WebGL مش شغال أو المستخدم مفعّل "تقليل الحركة": بيفضل عرض الفصول كمان كروت ثابتة. */
const root = document.querySelector('[data-journey]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root && !reduced) {
  // نحمّل المشهد لما القسم يقرّب من الشاشة بس
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    start().catch(() => { /* يفضل العرض الثابت */ });
  }, { rootMargin: '700px 0px' });
  io.observe(root);
}

async function start() {
  const { webglOK, createBucket, createStage, THREE } = await import('./bucket3d.mjs');
  if (!webglOK()) return;

  const canvas = root.querySelector('[data-j-canvas]');
  const stage = createStage(canvas, { fov: 30, distance: 3.8, height: 0.5 });
  stage.renderer.localClippingEnabled = true;
  const { scene, camera } = stage;

  const brand = root.dataset.brand || 'سديم';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (x, a, b) => clamp((x - a) / (b - a));
  const ease = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const labelCfg = { text: brand, bg: '#B5321F', fg: '#FFFFFF' };

  /* ---------------- الجردل الأساسي ---------------- */
  const bucket = createBucket({ color: '#F4F6F7', handle: 'metal', label: labelCfg });
  const P = bucket.parts;
  const baseY = bucket.group.position.y; // -0.55
  scene.add(bucket.group);

  const fillPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), baseY);
  P.bodyMat.clippingPlanes = [fillPlane];
  P.bodyMat.emissive = new THREE.Color('#FF7A1A');
  const WHITE = new THREE.Color('#F4F6F7');
  const MOLTEN = new THREE.Color('#FF9A3C');
  P.label.material.transparent = true;

  // رسم هيكلي خفيف بيوضّح مكان الجردل قبل ما يتحقن
  const ghost = new THREE.Mesh(P.body.geometry, new THREE.MeshBasicMaterial({ color: 0x7FD0FF, wireframe: true, transparent: true, opacity: 0.2, depthWrite: false }));
  bucket.group.add(ghost);

  // الوضع الأصلي لليد (عشان نحركها وترجع)
  P.handle.forEach((h) => { h.userData.y = h.position.y; h.userData.rx = h.rotation.x; });

  /* ---------------- القمع (الخامة) ---------------- */
  const funnelPts = [
    new THREE.Vector2(0.12, 0.0), new THREE.Vector2(0.12, 0.28),
    new THREE.Vector2(0.2, 0.34), new THREE.Vector2(0.78, 0.98), new THREE.Vector2(0.8, 1.04), new THREE.Vector2(0.74, 1.04),
    new THREE.Vector2(0.72, 0.99), new THREE.Vector2(0.17, 0.34), new THREE.Vector2(0.09, 0.28), new THREE.Vector2(0.09, 0.0),
  ];
  const FUNNEL_OP = 0.5;
  const funnelMat = new THREE.MeshStandardMaterial({ color: 0xB4D2E2, metalness: 0.2, roughness: 0.35, side: THREE.DoubleSide, transparent: true, opacity: FUNNEL_OP, depthWrite: false });
  const funnel = new THREE.Mesh(new THREE.LatheGeometry(funnelPts, 48), funnelMat);
  funnel.position.y = 0.62;
  scene.add(funnel);

  /* ---------------- حبيبات الخامة ---------------- */
  const N = 240;
  const gran = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.047, 0), new THREE.MeshStandardMaterial({ roughness: 0.4 }), N);
  const palette = ['#F4F6F7', '#F4F6F7', '#F4F6F7', '#2F6FD6', '#FFB600'].map((c) => new THREE.Color(c));
  const seed = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    seed.push({ a, r, s: Math.random(), rest: 1.5 + Math.random() * 0.3, h: Math.random() });
    gran.setColorAt(i, palette[Math.floor(Math.random() * palette.length)]);
  }
  gran.instanceColor.needsUpdate = true;
  scene.add(gran);
  const dummy = new THREE.Object3D();

  /* ---------------- القالب (نصفين بيقفلوا حوالين الجردل) ---------------- */
  const moldMat = new THREE.MeshStandardMaterial({ color: 0x5A9DBD, metalness: 0.35, roughness: 0.4, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const moldGeo = new THREE.CylinderGeometry(0.64, 0.58, 1.28, 40, 1, true, 0, Math.PI);
  const moldR = new THREE.Mesh(moldGeo, moldMat);
  const moldL = new THREE.Mesh(moldGeo, moldMat);
  moldL.rotation.y = Math.PI;
  moldR.position.y = moldL.position.y = baseY + 0.56;
  scene.add(moldR, moldL);

  /* ---------------- حلقة الطباعة وحلقة الفحص وعلامة الصح ---------------- */
  const ringGeo = new THREE.TorusGeometry(1, 0.012, 10, 72);
  const printRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xFFB600 }));
  printRing.rotation.x = Math.PI / 2;
  bucket.group.add(printRing);
  const scanRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x5BE3A0, transparent: true, opacity: 0.95 }));
  scanRing.rotation.x = Math.PI / 2;
  bucket.group.add(scanRing);
  const scanGlow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x5BE3A0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  bucket.group.add(scanGlow);

  const cc = document.createElement('canvas'); cc.width = cc.height = 128;
  const cg = cc.getContext('2d');
  cg.fillStyle = '#1FA855'; cg.beginPath(); cg.arc(64, 64, 58, 0, Math.PI * 2); cg.fill();
  cg.strokeStyle = '#fff'; cg.lineWidth = 12; cg.lineCap = 'round'; cg.lineJoin = 'round';
  cg.beginPath(); cg.moveTo(36, 66); cg.lineTo(56, 86); cg.lineTo(94, 44); cg.stroke();
  const check = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cc), transparent: true, depthTest: false }));
  check.position.set(0.62, 0.95, 0.35);
  bucket.group.add(check);

  /* ---------------- الرص: جرادل متداخلة + كرتونة ---------------- */
  const stack = [];
  for (let i = 1; i <= 4; i++) {
    const b = createBucket({ color: '#F4F6F7', handle: 'none', label: labelCfg });
    b.group.visible = false;
    scene.add(b.group);
    stack.push(b);
  }
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xC9A46A, roughness: 0.85, side: THREE.DoubleSide, transparent: true });
  const carton = new THREE.Group();
  const CW = 1.22, CH = 0.3;
  const wallGeo = new THREE.PlaneGeometry(CW, CH);
  [[0, 0, CW / 2, 0], [0, 0, -CW / 2, 0], [CW / 2, 0, 0, Math.PI / 2], [-CW / 2, 0, 0, Math.PI / 2]].forEach(([x, , z, ry]) => {
    const w = new THREE.Mesh(wallGeo, cardMat);
    w.position.set(x, CH / 2, z); w.rotation.y = ry; carton.add(w);
  });
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(CW, CW), cardMat);
  bottom.rotation.x = Math.PI / 2; bottom.position.y = 0.01; carton.add(bottom);
  carton.position.y = baseY;
  carton.visible = false;
  scene.add(carton);

  /* ---------------- الكاميرا: مسار بين الفصول ---------------- */
  const K = [
    { p: 0, pos: [0.0, 0.95, 5.9], look: [0, 0.62, 0] },
    { p: 1, pos: [0.2, 0.65, 5.0], look: [0, 0.38, 0] },
    { p: 2, pos: [1.0, 0.85, 4.1], look: [0, 0.42, 0] },
    { p: 3, pos: [0.0, 0.35, 3.3], look: [0, 0.0, 0] },
    { p: 4, pos: [-0.8, 0.5, 3.6], look: [0, 0.1, 0] },
    { p: 5, pos: [0.0, 0.8, 3.7], look: [0, 0.0, 0] },
    { p: 6, pos: [0.0, 1.0, 7.0], look: [0, 0.5, 0] },
  ];
  const camPos = new THREE.Vector3(...K[0].pos), camLook = new THREE.Vector3(...K[0].look);
  function camAt(p6) {
    const i = Math.min(5, Math.floor(p6)), t = ease(p6 - i);
    const a = K[i], b = K[i + 1];
    return [new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), t), new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), t)];
  }

  /* ---------------- حالة المشهد عند تقدّم معين ---------------- */
  const ui = {
    chapters: [...root.querySelectorAll('.j-chapter')],
    dots: [...root.querySelectorAll('[data-j-dot]')],
    bar: root.querySelector('[data-j-bar]'),
  };
  let lastChapter = -1;

  function setState(p) {
    const p6 = p * 6;

    // الحبيبات: تنزل في القمع، وبعدها تتسحب للجردل
    const t1 = seg(p6, 0, 1), t2 = seg(p6, 1, 1.9);
    for (let i = 0; i < N; i++) {
      const s = seed[i];
      const fall = ease(seg(t1 * 1.35 - s.s * 0.45, 0, 0.8));
      const x0 = Math.cos(s.a) * s.r * 0.62, z0 = Math.sin(s.a) * s.r * 0.62;
      const y0 = 2.15 + s.h * 0.9;
      const yRest = funnel.position.y + 0.42 + s.h * 0.45;
      let x = lerp(x0, x0 * 0.55, fall), z = lerp(z0, z0 * 0.55, fall), y = lerp(y0, yRest, fall);
      const d = ease(seg(t2 * 1.3 - s.s * 0.3, 0, 0.9));
      x = lerp(x, 0, d); z = lerp(z, 0, d); y = lerp(y, baseY + 0.15 + s.h * 0.5, d);
      const sc = 1 - ease(seg(d, 0.6, 1));
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(Math.max(0.0001, sc));
      dummy.updateMatrix();
      gran.setMatrixAt(i, dummy.matrix);
    }
    gran.instanceMatrix.needsUpdate = true;
    gran.visible = p6 < 2.2;

    // القمع يختفي بعد الحقن
    const fOut = 1 - ease(seg(p6, 1.9, 2.3));
    funnelMat.opacity = FUNNEL_OP * fOut; funnel.visible = fOut > 0.01;
    funnel.position.y = lerp(0.62, 0.7, ease(seg(p6, 0, 1)));

    // القالب
    const m = ease(seg(p6, 0.9, 1.1)) * (1 - ease(seg(p6, 1.85, 2.1)));
    moldR.position.x = (1 - m) * 1.25; moldL.position.x = -(1 - m) * 1.25;
    moldR.visible = moldL.visible = m > 0.001 || (p6 > 0.85 && p6 < 2.15);

    // الحقن: الجردل بيتملي من تحت لفوق وبيبرد من البرتقالي للأبيض
    const fill = ease(seg(p6, 1.05, 1.85));
    ghost.visible = fill < 0.999;
    ghost.material.opacity = 0.22 * (1 - fill);
    fillPlane.constant = baseY + 1.2 * fill;
    P.body.visible = fill > 0.001;
    const cool = ease(seg(p6, 1.75, 2.35));
    P.bodyMat.color.copy(MOLTEN).lerp(WHITE, cool);
    P.bodyMat.emissiveIntensity = (1 - cool) * 0.85;
    if (p6 > 2.4) { P.bodyMat.clippingPlanes = []; } else { P.bodyMat.clippingPlanes = [fillPlane]; }

    // الغطا
    const lid = ease(seg(p6, 1.95, 2.2));
    if (P.lid) { P.lid.visible = lid > 0.001 && p6 < 5.2; P.lid.position.y = (1 - lid) * 0.3; }

    // اليد
    const h = ease(seg(p6, 2.2, 2.85));
    const handOut = p6 < 5.2;
    P.handle.forEach((o) => { o.visible = h > 0.001 && handOut; o.position.y = o.userData.y + (1 - h) * 0.9; o.rotation.x = o.userData.rx - (1 - h) * 1.1; });
    const e = ease(seg(p6, 2.7, 2.98));
    P.ears.forEach((o) => { o.visible = e > 0.001 && handOut; o.scale.setScalar(Math.max(0.001, e)); });

    // الطباعة: الاستيكر بينزل من فوق لتحت مع حلقة طباعة صفرا
    const l = ease(seg(p6, 3.0, 3.85));
    P.label.visible = l > 0.001;
    P.label.scale.y = Math.max(0.001, l);
    P.label.position.y = 0.8 - 0.3 * l;
    const py = 0.8 - 0.6 * l;
    printRing.visible = l > 0.001 && l < 0.999;
    printRing.position.y = py;
    printRing.scale.setScalar(0.41 + 0.09 * py + 0.045);

    // الفحص: خط ضوء أخضر بيطلع وينزل وبعدين علامة صح
    const sc = seg(p6, 4.05, 4.8);
    const on = p6 > 4.02 && p6 < 4.95;
    scanRing.visible = scanGlow.visible = on;
    if (on) {
      const y = 0.04 + 1.0 * (0.5 - 0.5 * Math.cos(sc * Math.PI * 2));
      const r = 0.41 + 0.09 * y + 0.04;
      scanRing.position.y = scanGlow.position.y = y;
      scanRing.scale.setScalar(r); scanGlow.scale.set(r, 1, r);
    }
    const ck = ease(seg(p6, 4.75, 4.95)) * (1 - ease(seg(p6, 5.25, 5.5)));
    check.visible = ck > 0.01;
    check.scale.setScalar(Math.max(0.001, ck * 0.5));

    // الرص: جرادل بتتداخل جوه كرتونة
    const cart = ease(seg(p6, 5.0, 5.45));
    carton.visible = cart > 0.01;
    cardMat.opacity = cart;
    carton.scale.set(1, Math.max(0.01, cart), 1);
    stack.forEach((b, i) => {
      const k = ease(seg(p6, 5.15 + i * 0.12, 5.5 + i * 0.12));
      b.group.visible = k > 0.001;
      b.group.position.set(0, baseY + (i + 1) * 0.16 + (1 - k) * 1.3, 0);
      b.group.rotation.y = bucket.group.rotation.y;
    });

    // دوران الجردل: ميلان خفيف طول الرحلة + لفة كاملة في الآخر
    bucket.group.rotation.y = 0.55 * Math.sin(p6 * 1.7) + Math.PI * 2 * ease(seg(p6, 5.35, 6));
    bucket.group.position.y = baseY;

    // الكاميرا
    const [cp, cl] = camAt(p6);
    camPos.lerp(cp, 0.14); camLook.lerp(cl, 0.14);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // الواجهة: الفصل الحالي + شريط التقدم
    const idx = Math.min(5, Math.floor(p6));
    if (idx !== lastChapter) {
      lastChapter = idx;
      root.dataset.chapter = String(idx);
      ui.chapters.forEach((c, i) => { c.classList.toggle('is-active', i === idx); c.setAttribute('aria-hidden', String(i !== idx)); });
      ui.dots.forEach((d, i) => { d.classList.toggle('is-done', i < idx); d.classList.toggle('is-current', i === idx); });
    }
    if (ui.bar) ui.bar.style.setProperty('--p', (p * 100).toFixed(2) + '%');
  }

  /* ---------------- التقدّم مع السكرول ---------------- */
  let target = 0, cur = 0, visible = true;
  function readScroll() {
    const r = root.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    target = clamp(total > 0 ? -r.top / total : 0);
  }
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    document.documentElement.classList.toggle('in-journey', en[0].intersectionRatio > 0.05);
  }, { rootMargin: '200px', threshold: [0, 0.05, 0.5] }).observe(root);
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll);
  readScroll();

  // ضغطة على نقطة في الشريط تروّح للفصل
  ui.dots.forEach((d, i) => d.addEventListener('click', () => {
    const r = root.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const y = window.scrollY + r.top + total * ((i + 0.5) / 6);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  root.classList.add('is-3d');
  canvas.hidden = false;
  cur = target;
  setState(cur);
  stage.render();

  (function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    cur += (target - cur) * 0.1;
    if (Math.abs(target - cur) < 0.0002) cur = target;
    setState(cur);
    stage.render();
  })();
}
