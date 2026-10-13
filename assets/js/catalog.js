/* بيورباك — فلاتر الكتالوج (بتتحفظ في الرابط عشان ينفع يتبعت) */
(function () {
  'use strict';
  var root = document.querySelector('[data-catalog]');
  if (!root) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i18n = JSON.parse(root.getAttribute('data-i18n') || '{}');
  var grid = root.querySelector('[data-results]');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.p-card'));
  var emptyEl = root.querySelector('[data-empty]');
  var countEl = root.querySelector('[data-count]');
  var countLabel = root.querySelector('[data-count-label]');
  var chipsEl = root.querySelector('[data-chips]');
  var badge = root.querySelector('[data-filter-badge]');
  var showBtn = root.querySelector('[data-show-label]');
  var qInput = root.querySelector('[data-f="q"]');
  var sortSel = root.querySelector('[data-f="sort"]');
  var panel = root.querySelector('[data-filters]');
  var scrim = root.querySelector('.filters-scrim');
  var openBtn = root.querySelector('[data-filters-open]');

  var MULTI = ['cap', 'use', 'shape', 'handle', 'color'];
  var state = { q: '', sort: '', print: false, cap: [], use: [], shape: [], handle: [], color: [] };

  /* ---------- قراءة/كتابة الرابط ---------- */
  function fromURL() {
    var u = new URLSearchParams(location.search);
    state.q = u.get('q') || '';
    state.sort = u.get('sort') || '';
    state.print = u.get('print') === '1';
    MULTI.forEach(function (k) { state[k] = (u.get(k) || '').split(',').filter(Boolean); });
  }
  function toURL() {
    var u = new URLSearchParams();
    if (state.q) u.set('q', state.q);
    MULTI.forEach(function (k) { if (state[k].length) u.set(k, state[k].join(',')); });
    if (state.print) u.set('print', '1');
    if (state.sort) u.set('sort', state.sort);
    var s = u.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  /* ---------- مزامنة شكل الفلاتر مع الحالة ---------- */
  function syncUI() {
    qInput.value = state.q;
    sortSel.value = state.sort;
    root.querySelectorAll('[data-toggle]').forEach(function (b) {
      var k = b.getAttribute('data-toggle') === 'color' ? 'color' : b.getAttribute('data-toggle');
      b.setAttribute('aria-pressed', String(state[k].indexOf(b.getAttribute('data-value')) > -1));
    });
    root.querySelectorAll('[data-check]').forEach(function (c) {
      var k = c.getAttribute('data-check');
      c.checked = k === 'print' ? state.print : state[k].indexOf(c.value) > -1;
    });
  }

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/لتر|liter|litre|ltr/g, 'l').replace(/\s+/g, ' ').trim();
  }

  function matches(c) {
    var d = c.dataset;
    if (state.cap.length && state.cap.indexOf(d.fCap) < 0) return false;
    if (state.use.length && state.use.indexOf(d.fUsage) < 0) return false;
    if (state.shape.length && state.shape.indexOf(d.fShape) < 0) return false;
    if (state.handle.length && state.handle.indexOf(d.fHandle) < 0) return false;
    if (state.color.length) {
      var cs = (d.fColors || '').split(',');
      if (!state.color.some(function (x) { return cs.indexOf(x) > -1; })) return false;
    }
    if (state.print && d.fPrint !== '1') return false;
    if (state.q) {
      var hay = norm(d.fSearch).replace(/\s/g, '');
      var words = norm(state.q).split(' ');
      if (!words.every(function (w) { return hay.indexOf(w.replace(/\s/g, '')) > -1; })) return false;
    }
    return true;
  }

  /* ---------- تطبيق الفلاتر ---------- */
  var first = true;
  function apply() {
    var list = cards.slice();
    if (state.sort === 'cap_asc') list.sort(function (a, b) { return a.dataset.fCap - b.dataset.fCap; });
    else if (state.sort === 'cap_desc') list.sort(function (a, b) { return b.dataset.fCap - a.dataset.fCap; });
    else list.sort(function (a, b) { return a.dataset.fSort - b.dataset.fSort; });

    var n = 0;
    list.forEach(function (c) {
      grid.appendChild(c);
      var ok = matches(c);
      c.hidden = !ok;
      if (ok) {
        // ظهور متتابع للكروت لما الفلتر يتغير
        if (!first && !reduced) {
          c.classList.remove('card-in');
          c.style.animationDelay = Math.min(n, 8) * 45 + 'ms';
          void c.offsetWidth;
          c.classList.add('card-in');
        }
        n++;
      }
    });
    first = false;

    countEl.textContent = n;
    countLabel.textContent = (i18n.count || '{n}').replace('{n}', '').trim();
    showBtn.textContent = (i18n.show || '{n}').replace('{n}', n);
    emptyEl.hidden = n > 0;
    renderChips();
    toURL();
  }

  /* ---------- الفلاتر المختارة كـ chips ---------- */
  function labelFor(k, v) {
    var el = root.querySelector('[data-toggle="' + k + '"][data-value="' + v + '"]');
    if (el) return el.getAttribute('data-label') || el.textContent.trim();
    var cb = root.querySelector('[data-check="' + k + '"][value="' + v + '"]');
    return cb ? cb.parentElement.querySelector('span').textContent.trim() : v;
  }
  function renderChips() {
    var items = [];
    MULTI.forEach(function (k) { state[k].forEach(function (v) { items.push({ k: k, v: v, t: labelFor(k, v) }); }); });
    if (state.print) items.push({ k: 'print', v: '1', t: labelFor('print', '1') });
    if (state.q) items.push({ k: 'q', v: state.q, t: '“' + state.q + '”' });

    chipsEl.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'active-chip';
      b.setAttribute('aria-label', (i18n.remove || '{x}').replace('{x}', it.t));
      b.innerHTML = '<span></span><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      b.firstChild.textContent = it.t;
      b.firstChild.dir = 'auto';
      b.addEventListener('click', function () {
        if (it.k === 'print') state.print = false;
        else if (it.k === 'q') state.q = '';
        else state[it.k] = state[it.k].filter(function (x) { return x !== it.v; });
        syncUI(); apply();
      });
      chipsEl.appendChild(b);
    });
    var total = items.filter(function (i) { return i.k !== 'q'; }).length;
    badge.hidden = total === 0;
    badge.textContent = total;
  }

  /* ---------- الأحداث ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle]');
    if (t) {
      var k = t.getAttribute('data-toggle'), v = t.getAttribute('data-value');
      var i = state[k].indexOf(v);
      if (i > -1) state[k].splice(i, 1); else state[k].push(v);
      syncUI(); apply();
      return;
    }
    if (e.target.closest('[data-clear]')) {
      state = { q: '', sort: state.sort, print: false, cap: [], use: [], shape: [], handle: [], color: [] };
      syncUI(); apply();
    }
  });
  root.addEventListener('change', function (e) {
    var c = e.target.closest('[data-check]');
    if (c) {
      var k = c.getAttribute('data-check');
      if (k === 'print') state.print = c.checked;
      else {
        state[k] = state[k].filter(function (x) { return x !== c.value; });
        if (c.checked) state[k].push(c.value);
      }
      apply();
    }
    if (e.target === sortSel) { state.sort = sortSel.value; apply(); }
  });
  var qTimer;
  qInput.addEventListener('input', function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = qInput.value.trim(); apply(); }, 200);
  });

  /* ---------- درج الفلاتر على الموبايل ---------- */
  var lastFocus = null;
  function openPanel() {
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    scrim.hidden = false;
    document.body.classList.add('nav-open');
    openBtn.setAttribute('aria-expanded', 'true');
    var f = panel.querySelector('button, input'); if (f) f.focus();
  }
  function closePanel() {
    if (!panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open');
    scrim.hidden = true;
    document.body.classList.remove('nav-open');
    openBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  openBtn.addEventListener('click', openPanel);
  root.querySelectorAll('[data-filters-close]').forEach(function (b) { b.addEventListener('click', closePanel); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', closePanel);

  fromURL();
  syncUI();
  apply();
})();
