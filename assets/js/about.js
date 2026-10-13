/* بيورباك — فيديوهات يوتيوب في المعرض بتتحمل لما العميل يدوس (من غير تتبع قبلها) */
document.querySelectorAll('[data-yt]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1&rel=0';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.title = btn.getAttribute('aria-label') || 'Video';
    f.className = 'gal-item gal-iframe';
    btn.replaceWith(f);
  });
});
