/* بيورباك — فورم التواصل */
(function () {
  'use strict';
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var T = JSON.parse(form.getAttribute('data-i18n') || '{}');
  var alertBox = document.querySelector('[data-cf-alert]');
  var okBox = document.querySelector('[data-cf-ok]');
  var btn = form.querySelector('[data-cf-submit]');
  var busy = false;

  function setErr(k, msg) {
    var p = form.querySelector('[data-err="' + k + '"]');
    if (p) p.textContent = msg || '';
    var el = form.elements[k];
    if (el && el.setAttribute) { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  }
  function normPhone(v) {
    v = String(v).replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); }).replace(/[^\d+]/g, '');
    return v.replace(/^(\+20|0020)/, '0');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    alertBox.hidden = true; okBox.hidden = true;
    var f = form.elements, errs = {};
    var name = f.name.value.trim(), msg = f.message.value.trim(), ph = normPhone(f.phone.value), em = f.email.value.trim();
    if (name.length < 2) errs.name = T.name;
    if (msg.length < 5) errs.message = T.message;
    if (!ph && !em) errs.contact = T.contact;
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) errs.email = T.email;
    if (ph && !/^\+?\d{8,15}$/.test(ph)) errs.phone = T.phone;
    ['name', 'phone', 'email', 'message', 'contact'].forEach(function (k) { setErr(k, errs[k] || ''); });
    var first = Object.keys(errs)[0];
    if (first) { var el = f[first]; if (el && el.focus) el.focus(); return; }

    if (window.PP && PP.static) {
      var txt = name + '\n' + (ph ? ph + '\n' : '') + (em ? em + '\n' : '') + '\n' + msg;
      window.open('https://wa.me/' + PP.wa + '?text=' + encodeURIComponent(txt), '_blank');
      okBox.lastChild.textContent = T.static_ok || okBox.textContent;
      form.hidden = true; okBox.hidden = false;
      return;
    }

    var data = new FormData(form);
    data.set('phone', ph);
    busy = true; btn.disabled = true; btn.textContent = T.sending;
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
      .then(function (res) {
        if (!res.ok) throw res;
        form.reset();
        form.hidden = true;
        okBox.hidden = false;
        okBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.PPTrack) window.PPTrack('Contact');
      })
      .catch(function (res) {
        if (res && res.fields) Object.keys(res.fields).forEach(function (k) { setErr(k, res.fields[k]); });
        else { alertBox.textContent = (res && res.message) || T.server; alertBox.hidden = false; }
      })
      .then(function () { busy = false; btn.disabled = false; btn.textContent = T.send; });
  });
})();
