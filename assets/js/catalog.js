/* بيورباك — الكتالوج: تبويبات (الكل / مطبوعة / سادة) + بحث بالاسم، بانتقال ناعم */
(function () {
  'use strict';
  var root = document.querySelector('[data-catalog]');
  if (!root) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups = [].slice.call(root.querySelectorAll('[data-group]'));
  var btns = [].slice.call(root.querySelectorAll('.seg-btn'));
  var thumb = root.querySelector('.seg-thumb');
  var none = root.querySelector('[data-none]');
  var q = root.querySelector('[data-q]');
  var tab = root.getAttribute('data-tab') || 'all';

  function moveThumb() {
    var on = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0];
    if (!on || !thumb) return;
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }

  function apply(animate) {
    var term = (q.value || '').trim().toLowerCase();
    var shown = 0;
    groups.forEach(function (g) {
      var inTab = tab === 'all' || g.getAttribute('data-group') === tab;
      var vis = 0;
      [].forEach.call(g.querySelectorAll('.p-cell'), function (c) {
        var card = c.firstElementChild;
        var hit = !term || (card.getAttribute('data-f-search') || '').indexOf(term) > -1;
        c.hidden = !hit;
        if (hit) vis++;
      });
      g.hidden = !inTab || !vis;
      if (!g.hidden) {
        shown += vis;
        if (animate && !reduced) {
          [].forEach.call(g.querySelectorAll('.p-cell:not([hidden])'), function (c, i) {
            c.classList.remove('cell-pop');
            void c.offsetWidth;
            c.classList.add('is-in');
            c.style.setProperty('--i', Math.min(i, 10));
            c.classList.add('cell-pop');
          });
        }
      }
    });
    none.hidden = shown > 0;
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-tab');
      btns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      moveThumb(); apply(true);
      try { history.replaceState(null, '', tab === 'all' ? location.pathname : '?type=' + tab); } catch (e) { /* */ }
    });
  });
  q.addEventListener('input', function () { apply(false); });
  window.addEventListener('resize', moveThumb);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveThumb);
  moveThumb(); apply(false);
})();
