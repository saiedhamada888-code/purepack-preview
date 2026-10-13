/* بيورباك — صفحة المنتج: عارض 360° + اختيار اللون */
const viewer = document.querySelector('[data-viewer]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- اختيار اللون ---------------- */
let setViewerColor = () => {};
const colorsBox = document.querySelector('[data-colors]');
if (colorsBox) {
  const swatches = [...colorsBox.querySelectorAll('[role="radio"]')];
  const nameEl = document.querySelector('[data-color-name]');
  const waLink = document.querySelector('[data-wa-ask]');
  const waHref = waLink ? waLink.href.split('?')[0] : '';
  const waText = waLink ? (new URL(waLink.href).searchParams.get('text') || '') : '';

  const choose = (sw, focus) => {
    swatches.forEach((s) => {
      const on = s === sw;
      s.setAttribute('aria-checked', String(on));
      s.tabIndex = on ? 0 : -1;
      if (on) s.setAttribute('data-color-selected', ''); else s.removeAttribute('data-color-selected');
    });
    if (nameEl) nameEl.textContent = sw.dataset.name;
    if (focus) sw.focus();
    setViewerColor(sw.dataset.hex);
    if (waLink) {
      const lines = waText.split('\n');
      lines[0] = lines[0].replace(/[.]$/, '') + ' — ' + sw.dataset.name;
      waLink.href = waHref + '?text=' + encodeURIComponent(lines.join('\n'));
    }
  };
  swatches.forEach((s, i) => {
    s.addEventListener('click', () => choose(s));
    s.addEventListener('keydown', (e) => {
      const rtl = document.documentElement.dir === 'rtl';
      const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (next) { e.preventDefault(); choose(swatches[(i + next + swatches.length) % swatches.length], true); }
    });
  });
}

/* ---------------- العارض ---------------- */
if (viewer) {
  const canvas = viewer.querySelector('[data-viewer-canvas]');
  const fallback = viewer.querySelector('[data-viewer-fallback]');
  const spinImg = viewer.querySelector('[data-viewer-spin]');
  const photo = viewer.querySelector('[data-viewer-photo]');
  const hint = viewer.querySelector('[data-viewer-hint]');
  const spin = JSON.parse(viewer.dataset.spin || '[]');
  const thumbs = [...document.querySelectorAll('.thumb')];

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(viewer);
  viewer.tabIndex = 0;

  // التحكم المشترك: زاوية + تكبير
  const S = { angle: 0.35, vel: 0, zoom: 1, targetAngle: null, interacted: false };
  const pointers = new Map();
  let lastX = 0, pinchDist = 0;

  const onInteract = () => { S.interacted = true; S.targetAngle = null; if (hint) hint.classList.add('is-hidden'); };
  viewer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    viewer.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e.clientX + ',' + e.clientY);
    lastX = e.clientX;
    onInteract();
  });
  viewer.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e.clientX + ',' + e.clientY);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()].map((v) => v.split(',').map(Number));
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinchDist) setZoom(S.zoom * (d / pinchDist));
      pinchDist = d;
      return;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    S.angle += dx * 0.012;
    S.vel = dx * 0.012;
  });
  const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchDist = 0; };
  viewer.addEventListener('pointerup', up);
  viewer.addEventListener('pointercancel', up);
  viewer.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom(S.zoom * (e.deltaY < 0 ? 1.08 : 0.92)); } }, { passive: false });
  viewer.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: -0.3, ArrowRight: 0.3 }[e.key];
    if (k) { e.preventDefault(); onInteract(); S.angle += k; }
    if (e.key === '+' || e.key === '=') setZoom(S.zoom * 1.15);
    if (e.key === '-') setZoom(S.zoom / 1.15);
  });
  viewer.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => setZoom(S.zoom * (b.dataset.zoom === '1' ? 1.2 : 1 / 1.2))));

  function setZoom(z) { S.zoom = Math.min(2.2, Math.max(0.8, z)); }

  // الصور المصغرة: زاوية / صورة / رجوع للـ360
  function showPhoto(src) {
    photo.src = src; photo.hidden = false;
    canvas.hidden = true; spinImg.hidden = true; fallback.hidden = true;
    viewer.classList.add('is-photo');
  }
  function show360() {
    photo.hidden = true;
    viewer.classList.remove('is-photo');
    if (mode === '3d') canvas.hidden = false; else if (mode === 'spin') spinImg.hidden = false; else fallback.hidden = false;
  }
  thumbs.forEach((t) => t.addEventListener('click', () => {
    thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    if (t.dataset.thumbPhoto) return showPhoto(t.dataset.thumbPhoto);
    show360();
    if (t.dataset.thumbAngle !== undefined) {
      S.interacted = true;
      S.targetAngle = (parseFloat(t.dataset.thumbAngle) * Math.PI) / 180;
      if (mode === 'fallback') fallback.style.transform = 'scaleX(' + (Math.cos(S.targetAngle) >= 0 ? 1 : -1) + ')';
    }
  }));

  let mode = 'fallback';

  if (spin.length > 1) {
    /* ---- سلسلة صور 360 مرفوعة ---- */
    mode = 'spin';
    const frames = spin.map((src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
    spinImg.src = spin[0];
    spinImg.hidden = false;
    fallback.hidden = true;
    let last = -1;
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || document.hidden || viewer.classList.contains('is-photo')) return;
      tick();
      const n = frames.length;
      const idx = ((Math.round((S.angle / (Math.PI * 2)) * n) % n) + n) % n;
      if (idx !== last) { last = idx; spinImg.src = frames[idx].src; }
      spinImg.style.transform = 'scale(' + S.zoom + ')';
    })();
  } else {
    /* ---- موديل Three.js ---- */
    import('./bucket3d.mjs').then(({ webglOK, createBucket, createStage, THREE }) => {
      if (!webglOK()) return;
      mode = '3d';
      canvas.hidden = false;
      const stage = createStage(canvas, { distance: 3.6, height: 0.45 });
      const bucket = createBucket({ color: viewer.dataset.color, handle: viewer.dataset.handle });
      // لو القطر والارتفاع معروفين: الموديل بياخد النسبة الحقيقية
      const ratio = parseFloat(viewer.dataset.ratio || '');
      if (ratio > 0) { const r = Math.min(1.6, Math.max(0.55, ratio)); bucket.group.scale.set(r, 1, r); }
      stage.scene.add(bucket.group);
      const sel = document.querySelector('[data-color-selected]');
      if (sel) bucket.setColor(sel.dataset.hex);
      setViewerColor = (hex) => bucket.setColor(hex);

      let shown = false;
      (function loop() {
        requestAnimationFrame(loop);
        if (!visible || document.hidden || viewer.classList.contains('is-photo')) return;
        tick();
        bucket.group.rotation.y = S.angle;
        stage.camera.position.z = 3.6 / S.zoom;
        stage.camera.position.y = 0.45 / S.zoom;
        stage.camera.lookAt(0, 0, 0);
        stage.render();
        if (!shown) { shown = true; fallback.hidden = true; viewer.classList.add('is-3d'); }
      })();
    }).catch(() => { /* يفضل الـSVG */ });
  }

  // حركة اللف: لف تلقائي بطيء لحد ما المستخدم يلمس، وبعدين inertia
  function tick() {
    if (S.targetAngle !== null) {
      const full = Math.PI * 2;
      let d = ((S.targetAngle - S.angle) % full + full * 1.5) % full - full / 2;
      S.angle += d * 0.12;
      if (Math.abs(d) < 0.002) S.targetAngle = null;
    } else if (pointers.size === 0) {
      if (Math.abs(S.vel) > 0.0005) { S.angle += S.vel; S.vel *= 0.92; }
      else if (!S.interacted && !reduced) S.angle += 0.004;
    }
  }
}
