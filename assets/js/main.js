/* بيورباك — سكريبت عام لكل الصفحات: القائمة، السلة، الكمية، الأنيميشن */
(function () {
  'use strict';
  var PP = window.PP || { lang: 'ar', i18n: {} };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- القائمة على الموبايل ---------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function () { setNav(false); });
  }

  /* ---------------- الهيدر عند السكرول + شريط تقدّم الصفحة ---------------- */
  var hdr = document.querySelector('[data-header]');
  var bar = document.createElement('div');
  bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<span></span>';
  document.body.appendChild(bar);
  var barFill = bar.firstChild, ticking = false;
  function onScroll() {
    var y = window.scrollY || 0, h = document.documentElement.scrollHeight - window.innerHeight;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 8);
    barFill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------------- جردل صغير بينزل مع السكرول على الجنب ---------------- */
  (function () {
    var wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'scroll-bucket';
    wrap.setAttribute('aria-label', (PP.i18n && PP.i18n.top) || 'Back to top');
    wrap.setAttribute('title', (PP.i18n && PP.i18n.top) || 'Back to top');
    wrap.innerHTML =
      '<span class="sb-rail" aria-hidden="true"><i></i></span>' +
      '<span class="sb-bucket" aria-hidden="true">' +
        '<svg viewBox="0 0 120 130" focusable="false">' +
          '<path d="M30 46C34 14 86 14 90 46" fill="none" stroke="#7B8794" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M24 50L96 50L88 122Q87.5 126 83 126L37 126Q32.5 126 32 122Z" fill="#fff" stroke="#014A6D" stroke-width="5"/>' +
          '<path d="M26.6 66L93.4 66L90.6 94L29.4 94Z" fill="#FFB600"/>' +
          '<rect x="18" y="40" width="84" height="13" rx="4" fill="#fff" stroke="#014A6D" stroke-width="5"/>' +
          '<g class="sb-check"><circle cx="92" cy="20" r="17" fill="#1FA855"/><path d="M83 20l7 7 12-14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '</svg>' +
      '</span>';
    document.body.appendChild(wrap);
    var rail = wrap.querySelector('.sb-rail i');
    var bucket = wrap.querySelector('.sb-bucket');
    var BH = 36, cur = 0, target = 0, tilt = 0, lastY = window.scrollY || 0, trackH = 0;
    function measure() {
      trackH = Math.max(0, wrap.clientHeight - BH);
      var scrollable = document.documentElement.scrollHeight - window.innerHeight > 120;
      wrap.hidden = !scrollable;
    }
    function readTarget() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      target = h > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / h)) : 0;
    }
    window.addEventListener('resize', function () { measure(); readTarget(); });
    window.addEventListener('scroll', readTarget, { passive: true });
    window.addEventListener('load', function () { measure(); readTarget(); });
    wrap.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    measure(); readTarget();
    (function frame() {
      requestAnimationFrame(frame);
      if (wrap.hidden) return;
      cur += (target - cur) * 0.14;
      var y = window.scrollY || 0;
      // الجردل بيميل ناحية اتجاه السكرول وبعدين يرجع
      tilt += ((Math.max(-1, Math.min(1, (y - lastY) / 40))) * 22 - tilt) * 0.2;
      lastY = y;
      var px = trackH * cur;
      bucket.style.transform = 'translate3d(0,' + px.toFixed(1) + 'px,0) rotate(' + (reduced ? 0 : tilt.toFixed(1)) + 'deg)';
      rail.style.height = (px + BH / 2).toFixed(1) + 'px';
      wrap.classList.toggle('is-end', target > 0.985);
      wrap.classList.toggle('is-top', target < 0.02);
    })();
  })();

  /* ---------------- ظهور العناصر عند النزول ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el, i) {
      // تأخير بسيط متتابع للعناصر اللي جنب بعض
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
      io.observe(el);
    });
    // أمان: لو حاجة فضلت مخفية بعد ٣ ثواني تظهر
    setTimeout(function () { revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); }); }, 3000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- السلة (localStorage) ---------------- */
  var KEY = 'pp_cart_v1';
  var Cart = {
    read: function () {
      try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
      catch (e) { return []; }
    },
    write: function (items) {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* التخزين مقفول */ }
      Cart.render();
      document.dispatchEvent(new CustomEvent('pp:cart', { detail: items }));
    },
    add: function (p, qty) {
      var items = Cart.read();
      var key = p.id + '|' + (p.color || '');
      var found = items.find(function (i) { return i.key === key; });
      if (found) found.qty += qty;
      else items.push({ key: key, id: p.id, slug: p.slug, ar: p.ar, en: p.en, cap: p.cap, min: p.min || 0, img: p.img || '', color: p.color || '', colorAr: p.colorAr || '', colorEn: p.colorEn || '', qty: qty });
      Cart.write(items);
    },
    count: function () { return Cart.read().length; },
    render: function () {
      var n = Cart.count();
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = n;
        el.hidden = n === 0;
        el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      });
    }
  };
  window.PPCart = Cart;
  Cart.render();
  window.addEventListener('storage', function (e) { if (e.key === KEY) Cart.render(); });

  /* ---------------- اختيار الكمية ---------------- */
  function clampQty(input) {
    var min = parseInt(input.min, 10) || 1;
    var v = parseInt(String(input.value).replace(/[^\d]/g, ''), 10);
    if (!v || v < min) v = min;
    input.value = v;
    return v;
  }
  function stepFor(v) { return v >= 1000 ? 100 : v >= 100 ? 50 : 10; }

  document.addEventListener('click', function (e) {
    var dec = e.target.closest('[data-qty-dec]');
    var inc = e.target.closest('[data-qty-inc]');
    if (dec || inc) {
      var input = (dec || inc).closest('[data-qty]').querySelector('[data-qty-input]');
      var v = parseInt(input.value, 10) || 0;
      var min = parseInt(input.min, 10) || 1;
      var s = stepFor(inc ? v : Math.max(v - 1, 0));
      input.value = inc ? (Math.floor(v / s) + 1) * s : Math.max(min, (Math.ceil(v / s) - 1) * s);
      clampQty(input);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    var addBtn = e.target.closest('[data-add-cart]');
    var orderBtn = e.target.closest('[data-order-now]');
    if (addBtn || orderBtn) {
      var card = (addBtn || orderBtn).closest('[data-product]');
      if (!card) return;
      var p; try { p = JSON.parse(card.getAttribute('data-product')); } catch (err) { return; }
      var q = card.querySelector('[data-qty-input]');
      var qty = q ? clampQty(q) : (p.min || 1);
      var sel = card.querySelector('[data-color-selected]');
      if (sel) { p.color = sel.getAttribute('data-hex'); p.colorAr = sel.getAttribute('data-name-ar'); p.colorEn = sel.getAttribute('data-name-en'); }
      Cart.add(p, qty);
      track(orderBtn ? 'InitiateCheckout' : 'AddToCart', { content_name: p.en, content_ids: [String(p.id)], num_items: qty });
      if (orderBtn) { window.location.href = PP.orderUrl; }
      else toast(PP.i18n.added || 'Added');
    }
  });
  document.addEventListener('change', function (e) { if (e.target.matches('[data-qty-input]')) clampQty(e.target); });

  /* ---------------- Meta Pixel ---------------- */
  function track(ev, data) { if (PP.pixel && typeof window.fbq === 'function') window.fbq('track', ev, data || {}); }
  window.PPTrack = track;

  /* ---------------- رسالة صغيرة (toast) ---------------- */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5l5 5 10-11"/></svg>';
    toastEl.appendChild(document.createTextNode(msg));
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2400);
  }
  window.PPToast = toast;
})();
