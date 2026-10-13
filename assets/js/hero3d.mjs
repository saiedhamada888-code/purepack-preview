/* الجردل الكبير اللي بيلف في الهيرو — لو WebGL مش شغال بتفضل صورة الـSVG */
import { webglOK, createBucket, createStage } from './bucket3d.mjs';

const box = document.querySelector('[data-hero3d]');
if (box && webglOK()) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = box.querySelector('.hero-canvas');
  const stage = createStage(canvas, { distance: 3.9, height: 0.55 });
  const bucket = createBucket({
    color: '#F4F6F7',
    handle: 'metal',
    label: { text: box.dataset.label || 'سديم', sub: box.dataset.labelSub || '', bg: '#B5321F' },
  });
  bucket.group.rotation.y = 0.35;
  bucket.group.rotation.x = 0.06;
  stage.scene.add(bucket.group);

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(box);

  // سحب خفيف بالماوس/الصباع يلف الجردل
  let drag = null, spin = 0;
  canvas.style.pointerEvents = 'auto';
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag !== null) { spin += (e.clientX - drag) * 0.01; drag = e.clientX; } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  let last = performance.now(), first = true;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    if (!reduced && drag === null) bucket.group.rotation.y += dt * 0.35;
    bucket.group.rotation.y += spin; spin *= 0.85;
    bucket.group.position.y = -0.55 + (reduced ? 0 : Math.sin(now / 1400) * 0.015);
    stage.render();
    if (first) { first = false; box.classList.add('is-3d'); }
  }
  requestAnimationFrame(loop);
}
