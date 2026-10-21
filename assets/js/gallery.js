/* بيورباك — معرض صور المنتج: انتقال ناعم + سحب + أسهم الكيبورد */
(function () {
  'use strict';
  var g = document.querySelector('[data-gallery]');
  if (!g) return;
  var slides = [].slice.call(g.querySelectorAll('[data-slide]'));
  var thumbs = [].slice.call(g.querySelectorAll('[data-thumb]'));
  var cur = g.querySelector('[data-cur]');
  var stage = g.querySelector('[data-stage]');
  var rtl = document.documentElement.dir === 'rtl';
  var i = 0;

  function show(n) {
    n = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === n); });
    thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === n); });
    if (cur) cur.textContent = String(n + 1);
    i = n;
  }
  thumbs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
  var prev = g.querySelector('[data-prev]'), next = g.querySelector('[data-next]');
  if (prev) prev.addEventListener('click', function () { show(i + (rtl ? 1 : -1)); });
  if (next) next.addEventListener('click', function () { show(i + (rtl ? -1 : 1)); });

  // سحب بالإصبع / الماوس
  var x0 = null;
  stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (x0 === null || slides.length < 2) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(i + ((dx < 0) !== rtl ? 1 : -1));
  });
  stage.addEventListener('pointercancel', function () { x0 = null; });
  g.setAttribute('tabindex', '0');
  g.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(i + (rtl ? 1 : -1));
    if (e.key === 'ArrowRight') show(i + (rtl ? -1 : 1));
  });
})();
