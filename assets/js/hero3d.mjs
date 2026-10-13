/* بيورباك — جردل الهيرو: بيهبط بحركة ارتداد، بيتابع الماوس، وبيتغير لونه واسمه من لوحة "جرّبه بنفسك".
   لو WebGL مش شغال بتفضل رسمة الـSVG وبتتغير هي كمان. */
const box = document.querySelector('[data-hero3d]');
const cfg = document.querySelector('[data-hero-config]');
const brandInput = document.querySelector('[data-hero-brand]');
const fallbackSvg = box && box.querySelector('.hero-fallback svg');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// الحالة المشتركة بين الـ3D والرسمة الاحتياطية
const state = { hex: '#F4F6F7', bg: '#B5321F', fg: '#FFFFFF', text: box ? (box.dataset.label || '') : '' };
const defaultText = state.text;
let apply3D = () => {};

function applyFallback() {
  if (!fallbackSvg) return;
  fallbackSvg.querySelectorAll('.bk-body, .bk-rim').forEach((e) => e.setAttribute('fill', state.hex));
  const lab = fallbackSvg.querySelector('.bk-label');
  const txt = fallbackSvg.querySelector('.bk-text');
  if (lab) lab.setAttribute('fill', state.bg);
  if (txt) {
    txt.textContent = state.text;
    txt.setAttribute('fill', state.fg);
    txt.setAttribute('font-size', String(Math.max(5.5, Math.min(11, 84 / Math.max(5, state.text.length)))));
  }
}

if (cfg) {
  cfg.querySelectorAll('.hv-sw').forEach((b) => b.addEventListener('click', () => {
    cfg.querySelectorAll('.hv-sw').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    state.hex = b.dataset.hex; state.bg = b.dataset.bg; state.fg = b.dataset.fg;
    applyFallback(); apply3D(true);
  }));
  if (brandInput) brandInput.addEventListener('input', () => {
    state.text = brandInput.value.trim() || defaultText;
    applyFallback(); apply3D(false, true);
  });
}

if (box) {
  // حركة الماوس بتحرّك الطبقات (بارالاكس) في الهيرو كله
  const hero = document.querySelector('[data-hero]');
  const stageEl = box.querySelector('.hv-stage');
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  if (hero && !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      look.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      look.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    hero.addEventListener('pointerleave', () => { look.tx = 0; look.ty = 0; });
  }
  // CSS variables للطبقات (حتى لو مفيش WebGL)
  (function cssLoop() {
    requestAnimationFrame(cssLoop);
    look.x += (look.tx - look.x) * 0.08;
    look.y += (look.ty - look.y) * 0.08;
    if (stageEl) { stageEl.style.setProperty('--px', look.x.toFixed(3)); stageEl.style.setProperty('--py', look.y.toFixed(3)); }
    if (hero) { hero.style.setProperty('--mx', look.x.toFixed(3)); hero.style.setProperty('--my', look.y.toFixed(3)); }
  })();
}

import('./bucket3d.mjs').then(({ webglOK, createBucket, createStage, THREE }) => {
  if (!box || !webglOK()) return;
  const canvas = box.querySelector('.hero-canvas');
  const stage = createStage(canvas, { distance: 3.75, height: 0.5 });
  const bucket = createBucket({ color: state.hex, handle: 'metal', label: { text: state.text, bg: state.bg, fg: state.fg } });
  stage.scene.add(bucket.group);
  const baseY = bucket.group.position.y;

  // تغيير اللون بنعومة
  const cur = new THREE.Color(state.hex), target = new THREE.Color(state.hex);
  let labelTimer;
  apply3D = (colorChanged, textChanged) => {
    target.set(state.hex);
    clearTimeout(labelTimer);
    labelTimer = setTimeout(() => bucket.setLabel({ text: state.text, bg: state.bg, fg: state.fg }), textChanged ? 160 : 0);
  };

  // الهبوط: بيبدأ لما رسالة الترحيب تخلص (html.entered)
  const html = document.documentElement;
  let t0 = null;
  const startDrop = () => { if (t0 === null) t0 = performance.now(); };
  if (html.classList.contains('entered') || reduced) startDrop();
  else new MutationObserver((m, o) => { if (html.classList.contains('entered')) { startDrop(); o.disconnect(); } }).observe(html, { attributes: true, attributeFilter: ['class'] });
  const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(box);

  // سحب بالصباع/الماوس
  let drag = null, spin = 0, user = 0;
  canvas.style.pointerEvents = 'auto';
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag !== null) { const d = (e.clientX - drag) * 0.011; drag = e.clientX; user += d; spin = d; } });
  ['pointerup', 'pointercancel'].forEach((ev) => canvas.addEventListener(ev, () => { drag = null; }));

  let last = performance.now(), auto = 0.35, first = true;
  bucket.group.scale.setScalar(0.001);
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;

    cur.lerp(target, 0.12);
    bucket.setColor(cur);

    // الهبوط
    let e = 1;
    if (t0 === null) e = 0; else e = Math.min(1, (now - t0) / 1250);
    const k = e >= 1 ? 1 : easeOutBack(e);
    bucket.group.scale.setScalar(Math.max(0.001, 0.55 + 0.45 * k));
    bucket.group.position.y = baseY + (1 - k) * 1.7 + (reduced ? 0 : Math.sin(now / 1500) * 0.014 * e);

    // دوران: تلقائي بطيء + سحب + ميل ناحية الماوس
    if (!reduced && drag === null) auto += dt * (0.32 + (1 - e) * 2.2);
    user += spin; spin *= 0.9;
    const look = window.__ppLook || { x: 0, y: 0 };
    bucket.group.rotation.y = auto + user + (reduced ? 0 : (parseFloat(stage.renderer.domElement.closest('.hv-stage')?.style.getPropertyValue('--px') || 0)) * 0.55);
    bucket.group.rotation.x = 0.07 + (reduced ? 0 : (parseFloat(stage.renderer.domElement.closest('.hv-stage')?.style.getPropertyValue('--py') || 0)) * 0.1);

    stage.render();
    if (first) { first = false; box.classList.add('is-3d'); }
  }
  requestAnimationFrame(loop);
}).catch(() => { /* تفضل الرسمة */ });
