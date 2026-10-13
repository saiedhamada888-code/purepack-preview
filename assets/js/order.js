/* بيورباك — صفحة الطلب: ملخص السلة + الفورم + الإرسال */
(function () {
  'use strict';
  var root = document.querySelector('[data-order]');
  if (!root || !window.PPCart) return;

  var PP = window.PP || {};
  var L = PP.lang || 'ar';
  var T = JSON.parse(root.getAttribute('data-i18n') || '{}');
  var list = root.querySelector('[data-cart-list]');
  var emptyBox = root.querySelector('[data-cart-empty]');
  var totalRow = root.querySelector('[data-cart-total-row]');
  var totalEl = root.querySelector('[data-cart-total]');
  var form = root.querySelector('[data-order-form]');
  var alertBox = root.querySelector('[data-form-alert]');
  var submitBtn = root.querySelector('[data-submit-btn]');
  var fileInput = form.querySelector('#f-logo');
  var fileName = root.querySelector('[data-file-name]');
  var fileClear = root.querySelector('[data-file-clear]');
  var logoField = root.querySelector('[data-logo-field]');
  var fileLabelDefault = fileName.textContent;
  var MAX = 10 * 1024 * 1024;
  var EXT = ['png', 'jpg', 'jpeg', 'pdf', 'ai', 'svg'];
  var fmt = function (n) { return Number(n).toLocaleString('en-US'); };

  /* ---------------- رسمة جردل صغيرة بلون المنتج ---------------- */
  function bucketSVG(color) {
    var c = /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#F4F6F7';
    return '<svg viewBox="0 0 120 130" aria-hidden="true"><path d="M30 46 C 34 14, 86 14, 90 46" fill="none" stroke="#7B8794" stroke-width="3.2"/>' +
      '<path d="M24 50 L96 50 L88 122 Q87.5 126 83 126 L37 126 Q32.5 126 32 122 Z" fill="' + c + '" stroke="rgba(0,0,0,.15)"/>' +
      '<rect x="19" y="41" width="82" height="11" rx="3" fill="' + c + '" stroke="rgba(0,0,0,.18)"/></svg>';
  }

  /* ---------------- ملخص الطلب ---------------- */
  function render() {
    var items = PPCart.read();
    list.innerHTML = '';
    var total = 0;
    items.forEach(function (it, idx) {
      total += it.qty;
      var name = (L === 'ar' ? it.ar : it.en) || it.ar;
      var color = L === 'ar' ? it.colorAr : it.colorEn;
      var li = document.createElement('li');
      li.className = 'sum-item';
      li.innerHTML =
        '<div class="sum-thumb">' + (it.img ? '<img alt="" src="">' : bucketSVG(it.color)) + '</div>' +
        '<div class="sum-info"><a class="sum-name"></a><span class="sum-meta"></span></div>' +
        '<div class="sum-ctrl"><div class="qty qty-sm" data-qty>' +
          '<button type="button" class="qty-btn" data-qty-dec aria-label=""><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
          '<input class="qty-input mono" type="number" inputmode="numeric" step="1" data-qty-input>' +
          '<button type="button" class="qty-btn" data-qty-inc aria-label=""><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
        '</div><button type="button" class="sum-remove"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
      if (it.img) li.querySelector('img').src = it.img;
      var a = li.querySelector('.sum-name');
      a.textContent = name;
      a.href = (PP.base || '') + '/' + L + '/products/' + encodeURIComponent(it.slug);
      li.querySelector('.sum-meta').textContent = [it.cap + ' L', color].filter(Boolean).join(' · ');
      var input = li.querySelector('input');
      input.min = Math.max(1, it.min || 0);
      input.value = it.qty;
      input.setAttribute('aria-label', T.qty + ' — ' + name);
      li.querySelector('[data-qty-dec]').setAttribute('aria-label', T.dec);
      li.querySelector('[data-qty-inc]').setAttribute('aria-label', T.inc);
      input.addEventListener('change', function () {
        var all = PPCart.read();
        if (!all[idx]) return;
        all[idx].qty = Math.max(parseInt(input.min, 10), parseInt(input.value, 10) || 1);
        PPCart.write(all);
      });
      var rm = li.querySelector('.sum-remove');
      rm.setAttribute('aria-label', (T.remove || '').replace('{name}', name));
      rm.addEventListener('click', function () {
        var all = PPCart.read();
        all.splice(idx, 1);
        PPCart.write(all);
        var btns = list.querySelectorAll('.sum-remove');
        (btns[idx] || btns[idx - 1] || root.querySelector('.small-link')).focus();
      });
      list.appendChild(li);
    });
    totalEl.textContent = fmt(total);
    emptyBox.hidden = items.length > 0;
    totalRow.hidden = items.length === 0;
    setStep(items.length ? 2 : 1);
  }

  function setStep(n) {
    root.querySelectorAll('[data-stepper]').forEach(function (s) {
      var i = parseInt(s.getAttribute('data-stepper'), 10);
      s.classList.toggle('is-done', i < n);
      s.classList.toggle('is-current', i === n);
      if (i === n) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
  }

  document.addEventListener('pp:cart', render);
  render();

  /* ---------------- اختيارات أداة الطباعة (لو جاي منها) ---------------- */
  try {
    var pr = JSON.parse(localStorage.getItem('pp_print') || 'null');
    if (pr) {
      if (pr.method === 'iml' || pr.method === 'silk') {
        var r = form.querySelector('input[name="print_type"][value="' + pr.method + '"]');
        if (r) r.checked = true;
      }
      if (pr.hasLogo && !pr.brand) {
        var n2 = root.querySelector('[data-brand-note]');
        n2.textContent = T.logo_note || '';
        n2.hidden = false;
      }
      if (pr.brand) {
        form.querySelector('[data-brand-field]').value = pr.brand;
        var note = root.querySelector('[data-brand-note]');
        note.textContent = (T.brand || '{x}').replace('{x}', pr.brand);
        note.hidden = false;
      }
    }
  } catch (e) { /* مفيش */ }

  /* ---------------- حفظ بيانات العميل للمرة الجاية ---------------- */
  var KEEP = ['name', 'company', 'phone', 'governorate'];
  try {
    var saved = JSON.parse(localStorage.getItem('pp_customer') || '{}');
    KEEP.forEach(function (k) { if (saved[k] && form.elements[k]) form.elements[k].value = saved[k]; });
  } catch (e) { /* */ }

  /* ---------------- الطباعة واللوجو ---------------- */
  function syncPrint() {
    var v = (form.querySelector('input[name="print_type"]:checked') || {}).value;
    logoField.hidden = v === 'plain';
  }
  form.addEventListener('change', function (e) { if (e.target.name === 'print_type') syncPrint(); });
  syncPrint();

  function checkFile() {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return '';
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (EXT.indexOf(ext) < 0) return T.file_type;
    if (f.size > MAX) return T.file_size;
    return '';
  }
  function syncFile() {
    var f = fileInput.files && fileInput.files[0];
    fileName.textContent = f ? f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)' : fileLabelDefault;
    fileClear.hidden = !f;
    setErr('logo', checkFile());
  }
  fileInput.addEventListener('change', syncFile);
  fileClear.addEventListener('click', function () { fileInput.value = ''; syncFile(); fileInput.focus(); });

  var drop = root.querySelector('[data-drop]');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-drag'); }); });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; syncFile(); }
  });

  /* ---------------- التحقق ---------------- */
  function setErr(name, msg) {
    var p = root.querySelector('[data-err="' + name + '"]');
    var input = name === 'logo' ? fileInput : form.elements[name];
    if (p) p.textContent = msg || '';
    if (input && input.setAttribute) {
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    var fieldEl = p ? p.closest('.field') : null;
    if (fieldEl) fieldEl.classList.toggle('has-err', !!msg);
  }
  function normPhone(v) {
    v = String(v).replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); }).replace(/[^\d+]/g, '');
    return v.replace(/^(\+20|0020)/, '0');
  }
  function validate() {
    var errs = {};
    var name = form.elements.name.value.trim();
    if (!name) errs.name = T.required; else if (name.length < 2) errs.name = T.name;
    var ph = normPhone(form.elements.phone.value);
    if (!ph) errs.phone = T.required; else if (!/^01[0125]\d{8}$/.test(ph)) errs.phone = T.phone;
    if (!form.elements.governorate.value) errs.governorate = T.gov;
    var fe = checkFile(); if (fe) errs.logo = fe;
    ['name', 'phone', 'governorate', 'logo'].forEach(function (k) { setErr(k, errs[k] || ''); });
    return errs;
  }
  ['name', 'phone', 'governorate'].forEach(function (k) {
    form.elements[k].addEventListener('blur', function () {
      if (form.elements[k].getAttribute('aria-invalid')) validate();
    });
  });

  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.hidden = !msg;
    if (msg) alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- الإرسال ---------------- */
  var busy = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    showAlert('');
    var items = PPCart.read();
    if (!items.length) { showAlert(T.cart); return; }
    var errs = validate();
    var firstBad = Object.keys(errs)[0];
    if (firstBad) {
      showAlert(T.fix);
      var el = firstBad === 'logo' ? fileInput : form.elements[firstBad];
      if (el) el.focus();
      return;
    }

    // نسخة المعاينة الثابتة: مفيش سيرفر — بنفتح واتساب بالرسالة جاهزة
    if (PP.static) {
      var W = JSON.parse(root.getAttribute('data-wa') || '{}');
      var lines = ['*' + W.head + '*', '', W.items], tot = 0;
      items.forEach(function (it) {
        tot += it.qty;
        var nm = (L === 'ar' ? it.ar : it.en) || it.ar, col = L === 'ar' ? it.colorAr : it.colorEn;
        lines.push('• ' + nm + ' (' + it.cap + 'L)' + (col ? ' — ' + col : '') + ' × ' + it.qty);
      });
      lines.push(W.total.replace('{n}', tot), '', W.customer);
      lines.push(W.name + ': ' + form.elements.name.value.trim());
      var co = form.elements.company.value.trim(); if (co) lines.push(W.company + ': ' + co);
      lines.push(W.phone + ': ' + normPhone(form.elements.phone.value));
      var gv = form.elements.governorate; lines.push(W.gov + ': ' + gv.options[gv.selectedIndex].text);
      var pt = form.querySelector('input[name="print_type"]:checked'); if (pt) lines.push(W.print + ': ' + pt.parentElement.textContent.trim());
      var bt = form.querySelector('[data-brand-field]').value; if (bt) lines.push(W.brand + ': ' + bt);
      var nt = form.elements.notes.value.trim(); if (nt) lines.push('', W.notes + ': ' + nt);
      window.open('https://wa.me/' + PP.wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
      alertBox.className = 'form-alert form-ok'; alertBox.textContent = W.opened; alertBox.hidden = false;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    form.querySelector('[data-items-field]').value = JSON.stringify(items.map(function (i) {
      return { id: i.id, qty: i.qty, color: i.color, colorAr: i.colorAr, colorEn: i.colorEn };
    }));
    var data = new FormData(form);
    data.set('phone', normPhone(form.elements.phone.value));

    try {
      var keep = {}; KEEP.forEach(function (k) { keep[k] = form.elements[k].value; });
      localStorage.setItem('pp_customer', JSON.stringify(keep));
    } catch (err) { /* */ }

    // نفتح نافذة واتساب دلوقتي (جوه الضغطة) عشان المتصفح ميمنعهاش
    var waWin = null;
    try { waWin = window.open('', '_blank'); } catch (err) { waWin = null; }

    busy = true;
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = T.sending;
    setStep(3);

    fetch(root.getAttribute('data-submit'), { method: 'POST', body: data, headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
      .then(function (res) {
        if (!res.ok) throw res;
        PPCart.write([]);
        try { localStorage.removeItem('pp_print'); } catch (err) { /* */ }
        if (window.PPTrack) window.PPTrack('Lead', { content_name: res.order_no });
        if (waWin && !waWin.closed) waWin.location.href = res.wa_url;
        window.location.href = res.thanks_url + (waWin ? '' : '?open=1');
      })
      .catch(function (res) {
        if (waWin && !waWin.closed) waWin.close();
        busy = false;
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = T.submit;
        setStep(2);
        if (res && res.fields) {
          Object.keys(res.fields).forEach(function (k) { setErr(k, res.fields[k]); });
          showAlert(res.message || T.fix);
        } else {
          showAlert((res && res.message) || T.server);
        }
      });
  });
})();
