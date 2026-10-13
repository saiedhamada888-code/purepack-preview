/* بيورباك — حركات الصفحة الرئيسية: الترحيب، العدّادات، ميلان الكروت، معاينة الطباعة */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- رسالة الترحيب ---------------- */
  var intro = document.querySelector('[data-intro]');
  var enterBtn = intro && intro.querySelector('[data-intro-enter]');

  function entered() { html.classList.add('entered'); }

  function closeIntro() {
    if (!intro || intro.classList.contains('is-leaving')) return;
    try { sessionStorage.setItem('pp_intro', '1'); } catch (e) { /* */ }
    intro.classList.add('is-leaving');
    setTimeout(function () {
      html.classList.remove('intro-open');
      intro.classList.remove('is-leaving');
      entered();
      var h = document.querySelector('.hero-title');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }, reduced ? 0 : 700);
  }

  if (intro && html.classList.contains('intro-open')) {
    setTimeout(function () { if (enterBtn) enterBtn.focus({ preventScroll: true }); }, reduced ? 0 : 1500);
    enterBtn.addEventListener('click', closeIntro);
    document.addEventListener('keydown', function (e) {
      if (!html.classList.contains('intro-open')) return;
      if (e.key === 'Enter' && document.activeElement !== intro.querySelector('.intro-lang')) { e.preventDefault(); closeIntro(); }
      // الفوكس يفضل جوه الرسالة
      if (e.key === 'Tab') {
        var f = [enterBtn, intro.querySelector('.intro-lang')];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  } else {
    entered();
  }

  /* ---------------- عدّادات الأرقام ---------------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var raw = el.textContent.trim();
    var m = raw.match(/[\d][\d,.]*/);
    if (!m) return;
    var num = parseFloat(m[0].replace(/,/g, ''));
    if (!isFinite(num) || num <= 0) return;
    var pre = raw.slice(0, m.index), post = raw.slice(m.index + m[0].length);
    var dec = (m[0].split('.')[1] || '').length;
    var useComma = m[0].indexOf(',') > -1;
    var t0 = null, dur = 1500;
    function fmt(v) {
      var s = v.toFixed(dec);
      return useComma ? Number(s).toLocaleString('en-US', { minimumFractionDigits: dec }) : s;
    }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(num * e) + post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { cio.unobserve(x.target); animateCount(x.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------------- ميلان كروت المنتجات مع الماوس ---------------- */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (w) {
      var card = w.firstElementChild;
      if (!card) return;
      w.addEventListener('pointermove', function (e) {
        var r = w.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      w.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });

    // بارالاكس خفيف للجردل في الهيرو مع حركة الماوس
    var hero = document.querySelector('.hero-pro');
    var stage = document.querySelector('[data-parallax]');
    if (hero && stage) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        stage.style.transform = 'translate(' + (x * 18).toFixed(1) + 'px,' + (y * 12).toFixed(1) + 'px)';
      });
      hero.addEventListener('pointerleave', function () { stage.style.transform = ''; });
    }
  }

  /* ---------------- معاينة الطباعة السريعة ---------------- */
  var ptBucket = document.querySelector('[data-pt-bucket]');
  var ptInput = document.querySelector('[data-pt-input]');
  if (ptBucket && ptInput) {
    var txt = ptBucket.querySelector('text');
    var tag = txt && txt.previousElementSibling;
    var def = ptBucket.getAttribute('data-default') || '';
    function render() {
      var v = ptInput.value.trim() || def;
      txt.textContent = v;
      txt.setAttribute('font-size', String(Math.max(5.5, Math.min(12, 84 / Math.max(5, v.length)))));
    }
    ptInput.addEventListener('input', render);
    document.querySelectorAll('[data-pt-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('[data-pt-color]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        if (tag) tag.setAttribute('fill', b.getAttribute('data-pt-color'));
        txt.setAttribute('fill', b.getAttribute('data-fg'));
      });
    });
    // الألوان بتروح لأداة الطباعة الكاملة مع الاسم
    var form = document.querySelector('[data-pt-form]');
    if (form) form.addEventListener('submit', function () {
      var on = document.querySelector('[data-pt-color].is-on');
      if (on && on.getAttribute('data-pt-color') !== '#B5321F') {
        var h = document.createElement('input');
        h.type = 'hidden'; h.name = 'bg'; h.value = on.getAttribute('data-pt-color'); form.appendChild(h);
      }
    });
  }
})();
