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

  function visibleCells() { return [].slice.call(root.querySelectorAll('.p-cell')).filter(function (c) { return !c.hidden && c.offsetParent !== null; }); }

  function apply(animate) {
    var before = new Map();
    if (animate && !reduced) visibleCells().forEach(function (c) { before.set(c, c.getBoundingClientRect()); });
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
      }
    });
    none.hidden = shown > 0;
    if (animate && !reduced) flip(before);
  }

  // FLIP: اللي كان ظاهر بيتحرك لمكانه الجديد، واللي جديد بيدخل بحركة
  function flip(before) {
    var i = 0;
    visibleCells().forEach(function (c) {
      var now = c.getBoundingClientRect(), was = before.get(c), card = c.firstElementChild;
      c.classList.add('is-in');
      var delay = Math.min(i++, 14) * 40;
      if (was) {
        var dx = was.left - now.left, dy = was.top - now.top;
        if (Math.abs(dx) + Math.abs(dy) < 2) return;
        c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 650, delay: delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      } else {
        c.animate([{ opacity: 0, transform: 'translateY(34px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      }
    });
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
