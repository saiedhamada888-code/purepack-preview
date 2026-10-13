/* بيورباك — أداة طباعة اللوجو: جردل ثلاثي الأبعاد + استيكر بالاسم أو اللوجو */
const root = document.querySelector('[data-print]');
if (root) {
  const L = window.PP.lang;
  const sizes = JSON.parse(root.dataset.sizes || '[]');
  const T = JSON.parse(root.dataset.i18n || '{}');
  const $ = (s) => root.querySelector(s);

  const brandInput = $('[data-brand]');
  const logoInput = $('[data-logo]');
  const logoName = $('[data-logo-name]');
  const logoClear = $('[data-logo-clear]');
  const capEl = $('[data-pt-cap]');
  const info = $('[data-method-info]');
  const colorsBox = $('[data-bucket-colors]');
  const fallback = $('[data-pt-fallback]');
  const canvas = $('[data-pt-canvas]');
  const viewer = $('[data-pt-viewer]');
  const logoLabel = logoName.textContent;

  const S = {
    brand: '', logoImg: null, bg: '#B5321F', fg: '#FFFFFF',
    method: ($('[data-method]') || {}).dataset?.method || 'iml',
    size: sizes[0] || null, color: null, angle: 0.35, vel: 0, zoom: 1, interacted: false,
  };
  const infoText = { iml: document.documentElement.lang === 'ar' ? 'IML: الطباعة بتتعمل جوه الجردل وقت الحقن — ثابتة ومبتتمسحش.' : 'IML: printed into the bucket during moulding — permanent and scratch-proof.',
                     silk: document.documentElement.lang === 'ar' ? 'سيلك سكرين: طباعة على السطح بعد التصنيع — مناسبة للكميات الأقل.' : 'Silk screen: printed on the surface after moulding — good for smaller runs.' };

  /* ---------------- معاينة SVG مسطحة (احتياطي) ---------------- */
  function flatSVG() {
    const c = S.color || '#F4F6F7';
    const h = S.size ? S.size.handle : 'metal';
    const text = (S.brand || T.brand).replace(/[<>&]/g, '');
    const sticker = S.logoImg
      ? `<path d="M27.2 62 L92.8 62 L89.4 92 L30.6 92 Z" fill="${S.bg}"/><image href="${S.logoImg.src}" x="38" y="64" width="44" height="26" preserveAspectRatio="xMidYMid meet"/>`
      : `<path d="M27.2 62 L92.8 62 L89.4 92 L30.6 92 Z" fill="${S.bg}"/><text x="60" y="81" text-anchor="middle" font-family="Readex Pro, sans-serif" font-weight="700" font-size="${Math.max(6, Math.min(12, 120 / Math.max(4, text.length)))}" fill="${S.fg}">${text}</text>`;
    const handle = h === 'none' ? '' : `<path d="M30 46 C 34 14, 86 14, 90 46" fill="none" stroke="${h === 'metal' ? '#7B8794' : '#9AA7B1'}" stroke-width="${h === 'metal' ? 3.2 : 4.5}" stroke-linecap="round"/>`;
    fallback.innerHTML = `<svg class="viewer-svg" viewBox="0 0 120 130" aria-hidden="true">${handle}<path d="M24 50 L96 50 L88 122 Q87.5 126 83 126 L37 126 Q32.5 126 32 122 Z" fill="${c}" stroke="rgba(0,0,0,.18)"/>${sticker}<rect x="19" y="41" width="82" height="11" rx="3" fill="${c}" stroke="rgba(0,0,0,.18)"/></svg>`;
  }

  /* ---------------- لوحة الألوان حسب المقاس ---------------- */
  function renderBucketColors() {
    colorsBox.innerHTML = '';
    const list = (S.size && S.size.colors.length) ? S.size.colors : [{ hex: '#F4F6F7', ar: 'أبيض', en: 'White' }];
    if (!S.color || !list.some((c) => c.hex === S.color)) S.color = list[0].hex;
    list.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(c.hex === S.color));
      b.style.setProperty('--c', c.hex);
      b.title = L === 'ar' ? c.ar : c.en;
      b.innerHTML = `<span class="sr-only">${b.title}</span>`;
      b.addEventListener('click', () => { S.color = c.hex; renderBucketColors(); apply(); });
      colorsBox.appendChild(b);
    });
  }

  /* ---------------- 3D ---------------- */
  let three = null; // { bucket, stage, rebuild }
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(viewer);

  async function rebuild3D() {
    if (!three) return;
    const { createBucket } = three.mod;
    if (three.bucket) three.stage.scene.remove(three.bucket.group);
    three.bucket = createBucket({ color: S.color || '#F4F6F7', handle: S.size ? S.size.handle : 'metal' });
    three.stage.scene.add(three.bucket.group);
    await updateLabel();
  }
  async function updateLabel() {
    if (!three || !three.bucket) return;
    await three.bucket.setLabel({ text: S.brand || T.brand, bg: S.bg, fg: S.fg, image: S.logoImg });
  }

  import('./bucket3d.mjs').then(async (mod) => {
    if (!mod.webglOK()) return;
    const stage = mod.createStage(canvas, { distance: 3.6, height: 0.45 });
    three = { mod, stage, bucket: null };
    await rebuild3D();
    canvas.hidden = false;
    fallback.hidden = true;
    viewer.classList.add('is-3d');
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (Math.abs(S.vel) > 0.0005) { S.angle += S.vel; S.vel *= 0.92; }
      else if (!S.interacted && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) S.angle += 0.004;
      if (three.bucket) three.bucket.group.rotation.y = S.angle;
      stage.camera.position.z = 3.6 / S.zoom;
      stage.render();
    })();
  }).catch(() => {});

  /* سحب لللف */
  let dragX = null;
  viewer.addEventListener('pointerdown', (e) => { dragX = e.clientX; S.interacted = true; viewer.setPointerCapture(e.pointerId); });
  viewer.addEventListener('pointermove', (e) => { if (dragX !== null) { const d = e.clientX - dragX; dragX = e.clientX; S.angle += d * 0.012; S.vel = d * 0.012; } });
  ['pointerup', 'pointercancel'].forEach((ev) => viewer.addEventListener(ev, () => { dragX = null; }));
  viewer.style.touchAction = 'pan-y';

  /* ---------------- التطبيق ---------------- */
  let applyTimer;
  function apply() {
    flatSVG();
    capEl.textContent = S.size ? `${S.size.cap} L` : '';
    info.textContent = infoText[S.method] || '';
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => (three ? rebuild3D() : null), 60);
    save();
  }
  function save() {
    try {
      localStorage.setItem('pp_print', JSON.stringify({ brand: S.brand, method: S.method, bg: S.bg, cap: S.size && S.size.cap, color: S.color, hasLogo: !!S.logoImg, logoName: S.logoImg ? logoName.textContent : '' }));
    } catch (e) { /* */ }
  }

  /* ---------------- الأحداث ---------------- */
  brandInput.addEventListener('input', () => { S.brand = brandInput.value.trim(); if (S.brand) clearLogo(true); apply(); });

  function setLogo(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type) || file.size > 6 * 1024 * 1024) { window.PPToast && PPToast(document.documentElement.lang === 'ar' ? 'الصورة لازم تكون PNG أو JPG أو SVG' : 'Image must be PNG, JPG or SVG'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      S.logoImg = img; S.brand = ''; brandInput.value = '';
      logoName.textContent = file.name; logoClear.hidden = false;
      apply();
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }
  function clearLogo(silent) {
    S.logoImg = null; logoInput.value = ''; logoName.textContent = logoLabel; logoClear.hidden = true;
    if (!silent) apply();
  }
  logoInput.addEventListener('change', () => setLogo(logoInput.files[0]));
  logoClear.addEventListener('click', () => clearLogo());
  const drop = $('[data-logo-drop]');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); }));
  drop.addEventListener('drop', (e) => setLogo(e.dataTransfer.files[0]));

  root.querySelectorAll('[data-stickers] .swatch').forEach((sw) => sw.addEventListener('click', () => {
    root.querySelectorAll('[data-stickers] .swatch').forEach((x) => x.setAttribute('aria-checked', String(x === sw)));
    S.bg = sw.dataset.bg; S.fg = sw.dataset.fg; apply();
  }));
  root.querySelectorAll('[data-method]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-method]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    S.method = b.dataset.method; apply();
  }));
  root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    S.size = sizes.find((s) => s.cap === b.dataset.size) || S.size;
    renderBucketColors(); apply();
  }));

  // الطلب: بنضيف المنتج بالمقاس المختار للسلة وبنروح لصفحة الطلب
  $('[data-cta]').addEventListener('click', () => {
    save();
    if (S.size && window.PPCart) {
      const col = (S.size.colors.find((c) => c.hex === S.color) || {});
      const items = PPCart.read();
      if (!items.some((i) => i.id === S.size.id)) {
        PPCart.add({ id: S.size.id, slug: S.size.slug, ar: S.size.ar, en: S.size.en, cap: S.size.cap, min: S.size.min, img: S.size.img, color: S.color, colorAr: col.ar || '', colorEn: col.en || '' }, Math.max(S.size.min || 0, 100));
      }
      if (window.PPTrack) PPTrack('InitiateCheckout', { content_name: S.size.en });
    }
    location.href = root.dataset.order;
  });

  /* بداية: المقاس المطلوب من صفحة المنتج */
  if (root.dataset.pre) {
    const s = sizes.find((x) => x.cap === root.dataset.pre);
    if (s) {
      S.size = s;
      root.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.size === s.cap)));
    }
  }
  // الاسم واللون جايين من معاينة الطباعة في الرئيسية
  try {
    const q = new URLSearchParams(location.search);
    const b = (q.get('brand') || '').trim().slice(0, 30);
    if (b) { S.brand = b; brandInput.value = b; }
    const bg = q.get('bg');
    if (bg && /^#[0-9a-fA-F]{6}$/.test(bg)) {
      const sw = [...root.querySelectorAll('[data-stickers] .swatch')].find((x) => x.dataset.bg.toLowerCase() === bg.toLowerCase());
      if (sw) { root.querySelectorAll('[data-stickers] .swatch').forEach((x) => x.setAttribute('aria-checked', String(x === sw))); S.bg = sw.dataset.bg; S.fg = sw.dataset.fg; }
    }
  } catch (e) { /* */ }
  renderBucketColors();
  apply();
}
