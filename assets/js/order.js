/* بيورباك — طلب عرض سعر: اختيار المنتجات + بيانات الشركة + لوجو الشركة (من غير كمية) */
(function () {
  'use strict';
  var root = document.querySelector('[data-order]');
  if (!root) return;

  var PP = window.PP || {};
  var L = PP.lang || 'ar';
  var T = JSON.parse(root.getAttribute('data-i18n') || '{}');
  var form = root.querySelector('[data-order-form]');
  var alertBox = root.querySelector('[data-form-alert]');
  var submitBtn = root.querySelector('[data-submit-btn]');
  var fileInput = form.querySelector('#f-logo');
  var fileName = root.querySelector('[data-file-name]');
  var fileClear = root.querySelector('[data-file-clear]');
  var fileLabelDefault = fileName.textContent;
  var MAX = 10 * 1024 * 1024;
  var EXT = ['png', 'jpg', 'jpeg', 'pdf', 'ai', 'svg'];
  var picks = Array.prototype.slice.call(form.querySelectorAll('[data-pick]'));

  /* ---------------- حفظ بيانات الشركة للمرة الجاية ---------------- */
  var KEEP = ['company', 'name', 'phone', 'email', 'governorate'];
  try {
    var saved = JSON.parse(localStorage.getItem('pp_customer') || '{}');
    KEEP.forEach(function (k) { if (saved[k] && form.elements[k]) form.elements[k].value = saved[k]; });
  } catch (e) { /* */ }

  /* ---------------- اللوجو ---------------- */
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
    if (input && input.setAttribute) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function normPhone(v) {
    v = String(v).replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); }).replace(/[^\d+]/g, '');
    return v.replace(/^(\+20|0020)/, '0');
  }
  function chosen() { return picks.filter(function (c) { return c.checked; }); }
  var otherToggle = form.querySelector('[data-other-toggle]');
  var otherBox = form.querySelector('[data-other]');
  function otherText() { return otherToggle.checked ? otherBox.value.trim() : ''; }
  otherToggle.addEventListener('change', function () {
    otherBox.hidden = !otherToggle.checked;
    if (otherToggle.checked) otherBox.focus(); else otherBox.value = '';
  });

  function validate() {
    var errs = {};
    if (!chosen().length && !otherText()) errs.pick = T.pick;
    var company = form.elements.company.value.trim();
    if (company.length < 2) errs.company = company ? T.company : T.required;
    var name = form.elements.name.value.trim();
    if (!name) errs.name = T.required; else if (name.length < 2) errs.name = T.name;
    var ph = normPhone(form.elements.phone.value);
    if (!ph) errs.phone = T.required; else if (!/^01[0125]\d{8}$/.test(ph)) errs.phone = T.phone;
    var em = form.elements.email.value.trim();
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) errs.email = T.email;
    if (!form.elements.governorate.value) errs.governorate = T.gov;
    var fe = checkFile(); if (fe) errs.logo = fe;
    ['pick', 'company', 'name', 'phone', 'email', 'governorate', 'logo'].forEach(function (k) { setErr(k, errs[k] || ''); });
    return errs;
  }
  picks.forEach(function (c) { c.addEventListener('change', function () { if (chosen().length) setErr('pick', ''); }); });

  function showAlert(msg, ok) {
    alertBox.className = 'form-alert' + (ok ? ' form-ok' : '');
    alertBox.textContent = msg;
    alertBox.hidden = !msg;
    if (msg) alertBox.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  }
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------------- الإرسال ---------------- */
  var busy = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    showAlert('');
    var errs = validate();
    var first = Object.keys(errs)[0];
    if (first) {
      showAlert(T.fix);
      var el = first === 'pick' ? picks[0] : first === 'logo' ? fileInput : form.elements[first];
      if (el && el.focus) el.focus();
      return;
    }

    var ids = chosen().map(function (c) { return parseInt(c.value, 10); });
    form.querySelector('[data-items-field]').value = JSON.stringify(ids);
    try {
      var keep = {}; KEEP.forEach(function (k) { keep[k] = form.elements[k].value; });
      localStorage.setItem('pp_customer', JSON.stringify(keep));
    } catch (err) { /* */ }

    // نسخة المعاينة الثابتة: مفيش سيرفر — بنفتح واتساب بالرسالة جاهزة
    if (PP.static) {
      var W = JSON.parse(root.getAttribute('data-wa') || '{}');
      var lines = ['*' + W.head + '*', '', W.items];
      chosen().forEach(function (c) {
        var box = c.closest('.pick');
        lines.push('• ' + box.querySelector('.pick-name').textContent.trim() + ' (' + box.querySelector('.pick-cap').textContent.trim() + ')');
      });
      if (otherText()) lines.push('• ' + otherText());
      lines.push('', W.customer, W.company + ': ' + form.elements.company.value.trim(), W.name + ': ' + form.elements.name.value.trim(), W.phone + ': ' + normPhone(form.elements.phone.value));
      var em = form.elements.email.value.trim(); if (em) lines.push(W.email + ': ' + em);
      var gv = form.elements.governorate; lines.push(W.gov + ': ' + gv.options[gv.selectedIndex].text);
      var nt = form.elements.notes.value.trim(); if (nt) lines.push('', W.notes + ': ' + nt);
      window.open('https://wa.me/' + PP.wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
      showAlert(W.opened, true);
      return;
    }

    var data = new FormData(form);
    data.set('phone', normPhone(form.elements.phone.value));
    // نفتح نافذة واتساب دلوقتي (جوه الضغطة) عشان المتصفح ميمنعهاش
    var waWin = null;
    try { waWin = window.open('', '_blank'); } catch (err) { waWin = null; }

    busy = true;
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = T.sending;

    fetch(root.getAttribute('data-submit'), { method: 'POST', body: data, headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
      .then(function (res) {
        if (!res.ok) throw res;
        if (window.PPTrack) window.PPTrack('Lead', { content_name: res.order_no });
        if (waWin && !waWin.closed) waWin.location.href = res.wa_url;
        window.location.href = res.thanks_url + (waWin ? '' : '?open=1');
      })
      .catch(function (res) {
        if (waWin && !waWin.closed) waWin.close();
        busy = false;
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = T.submit;
        if (res && res.fields) {
          Object.keys(res.fields).forEach(function (k) { setErr(k, res.fields[k]); });
          showAlert(res.message || T.fix);
        } else {
          showAlert((res && res.message) || T.server);
        }
      });
  });
})();
