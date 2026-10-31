(function () {
  'use strict';
  var script = document.currentScript;
  if (!script || document.getElementById('rr-surgeon-offer')) return;
  var consultation = script.getAttribute('data-consultation');
  var doctor = script.getAttribute('data-doctor');
  if (!consultation || !doctor) return;

  var dialog = document.createElement('dialog');
  dialog.id = 'rr-surgeon-offer';
  dialog.setAttribute('aria-labelledby', 'rr-offer-title');
  dialog.setAttribute('aria-describedby', 'rr-offer-description');
  dialog.innerHTML = '<div class="rr-offer-layout">' +
    '<button type="button" class="rr-offer-close" aria-label="Закрыть предложение" autofocus>' +
      '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<div class="rr-offer-copy">' +
      '<h2 id="rr-offer-title" class="rr-offer-title">Консультация хирурга<span>+ 3 PDF в подарок</span></h2>' +
      '<p id="rr-offer-description" class="rr-offer-description">После консультации со мной вы получите материалы хирургов RR Clinic о подготовке к операции, наркозе и восстановлении</p>' +
      '<a class="rr-offer-link">Записаться на консультацию</a>' +
    '</div>' +
    '<img class="rr-offer-books" src="/assets/img/web/consultation-books.webp" width="1200" height="760" alt="Три PDF о подготовке к операции, наркозе и восстановлении" decoding="async">' +
  '</div>';
  var cta = dialog.querySelector('.rr-offer-link');
  cta.href = consultation;
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.setAttribute('aria-label', 'Записаться на консультацию: ' + doctor);
  document.body.appendChild(dialog);

  var root = document.documentElement;
  var oldOverflow;
  var returnFocus;
  var remaining = 10000;
  var started = 0;
  var timer;
  var shown = false;

  function restoreScroll() {
    if (oldOverflow !== undefined) root.style.overflow = oldOverflow;
    oldOverflow = undefined;
  }
  function close() {
    if (dialog.open) dialog.close();
    restoreScroll();
  }
  function show() {
    timer = undefined;
    if (shown || document.hidden) return;
    shown = true;
    returnFocus = document.activeElement;
    oldOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    dialog.showModal();
  }
  function resume() {
    if (shown || document.hidden || timer !== undefined) return;
    started = performance.now();
    timer = setTimeout(show, remaining);
  }
  function pause() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    remaining = Math.max(0, remaining - (performance.now() - started));
  }
  dialog.querySelector('.rr-offer-close').addEventListener('click', close);
  cta.addEventListener('click', close);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    // Safari can omit links from its default Tab order. Keep both controls reachable.
    var controls = [dialog.querySelector('.rr-offer-close'), cta];
    var index = controls.indexOf(document.activeElement);
    event.preventDefault();
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
  });
  dialog.addEventListener('close', function () {
    restoreScroll();
    if (returnFocus && returnFocus.isConnected && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  });
  // Native <dialog> contains keyboard focus and supports Escape, including in Safari.
  var downOnBackdrop = false;
  function outside(event) {
    var rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.addEventListener('pointerdown', function (event) { downOnBackdrop = outside(event); });
  dialog.addEventListener('click', function (event) { if (downOnBackdrop && outside(event)) close(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else resume(); });
  window.addEventListener('pagehide', function () { pause(); close(); restoreScroll(); });
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    shown = false;
    remaining = 10000;
    resume();
  });
  resume();

  // Framer hydration can restore a cloned block's old consultation URL. Correct it
  // at the window capture phase before either the browser or Framer follows it.
  window.addEventListener('click', function (event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    var url;
    try { url = new URL(anchor.href, location.href); } catch (_) { return; }
    if ((url.hostname === 'api.whatsapp.com' || url.hostname === 'wa.me') && /консультац/i.test(url.searchParams.get('text') || '')) {
      anchor.href = consultation;
      // Keep the native anchor action (new tabs/modifier keys included).
      // The offer CTA also needs to dismiss the modal because propagation stops here.
      if (anchor === cta) close();
      event.stopImmediatePropagation();
      return;
    }
    // Load our complete HTML on cross-page navigation, so each route gets its own
    // surgeon, timer and patches instead of Framer's unpatched client-side page.
    if ((url.origin === location.origin || url.hostname === 'rr-clinic.kz') && url.pathname !== location.pathname) {
      if (url.hostname === 'rr-clinic.kz') anchor.href = url.pathname + url.search + url.hash;
      event.stopImmediatePropagation();
    }
  }, true);
})();
