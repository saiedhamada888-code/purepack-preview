/* بيورباك — الرئيسية: الترحيب، العدّادات، رأيك يهمنا */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PP = window.PP || {};

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
      var h = document.querySelector('.hv-title');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }, reduced ? 0 : 700);
  }

  if (intro && html.classList.contains('intro-open')) {
    setTimeout(function () { if (enterBtn) enterBtn.focus({ preventScroll: true }); }, reduced ? 0 : 1500);
    enterBtn.addEventListener('click', closeIntro);
    document.addEventListener('keydown', function (e) {
      if (!html.classList.contains('intro-open')) return;
      if (e.key === 'Enter' && document.activeElement !== intro.querySelector('.intro-lang')) { e.preventDefault(); closeIntro(); }
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
    var t0 = null, dur = 1600;
    function fmt(v) {
      var s = v.toFixed(dec);
      return useComma ? Number(s).toLocaleString('en-US', { minimumFractionDigits: dec }) : s;
    }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = pre + fmt(num * (1 - Math.pow(1 - p, 3))) + post;
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

  /* ---------------- رأيك يهمنا ---------------- */
  var form = document.querySelector('[data-feedback]');
  if (form) {
    var T = JSON.parse(form.getAttribute('data-i18n') || '{}');
    var btn = form.querySelector('[data-fb-btn]');
    var err = form.querySelector('[data-fb-err]');
    var done = form.querySelector('[data-fb-done]');
    var busy = false;
    var finish = function (msg) {
      done.textContent = msg; done.hidden = false;
      form.elements.message.value = '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      err.textContent = ''; done.hidden = true;
      var msg = form.elements.message.value.trim();
      if (msg.length < 5) { err.textContent = T.err; form.elements.message.focus(); return; }

      // نسخة المعاينة الثابتة: بنفتح واتساب والرأي جاهز
      if (PP.static) {
        var checked = form.querySelector('input[name="rating"]:checked');
        var rating = checked ? parseInt(checked.value, 10) : 5;
        var lines = ['*' + T.head + '* ' + new Array(rating + 1).join('★'), '', msg];
        var nm = form.elements.name.value.trim(), co = form.elements.company.value.trim();
        if (nm) lines.push('', T.name + ': ' + nm);
        if (co) lines.push(T.company + ': ' + co);
        window.open('https://wa.me/' + PP.wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
        finish(T.static);
        return;
      }

      busy = true; btn.disabled = true; btn.firstElementChild.textContent = T.sending;
      fetch(form.getAttribute('action'), { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res.ok) finish(res.message || T.thanks);
          else err.textContent = res.message || T.server;
        })
        .catch(function () { err.textContent = T.server; })
        .then(function () { busy = false; btn.disabled = false; btn.firstElementChild.textContent = T.send; });
    });
  }
})();
