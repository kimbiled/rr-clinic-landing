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
      '<h2 id="rr-offer-title" class="rr-offer-title"></h2>' +
      '<p id="rr-offer-description" class="rr-offer-description"></p>' +
      '<form class="rr-offer-form" novalidate>' +
        '<div class="rr-offer-step" data-step="name">' +
          '<label class="rr-offer-label" for="rr-offer-name">Как вас зовут?</label>' +
          '<input id="rr-offer-name" class="rr-offer-input" type="text" name="name" placeholder="Ваше имя" autocomplete="name" maxlength="80" aria-describedby="rr-offer-name-error">' +
          '<p id="rr-offer-name-error" class="rr-offer-error" hidden></p>' +
          '<div class="rr-offer-actions"><button type="submit" class="rr-offer-button">Продолжить</button></div>' +
        '</div>' +
        '<div class="rr-offer-step" data-step="phone" hidden>' +
          '<label class="rr-offer-label" for="rr-offer-phone">Номер телефона</label>' +
          '<input id="rr-offer-phone" class="rr-offer-input" type="tel" name="phone" placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel" aria-describedby="rr-offer-phone-error">' +
          '<p id="rr-offer-phone-error" class="rr-offer-error" hidden></p>' +
          '<p class="rr-offer-error rr-offer-send-error" role="alert" hidden></p>' +
          '<div class="rr-offer-actions">' +
            '<button type="button" class="rr-offer-back">Назад</button>' +
            '<button type="submit" class="rr-offer-button rr-offer-send">Записаться на консультацию</button>' +
          '</div>' +
          '<p class="rr-offer-consent">Нажимая кнопку, вы соглашаетесь с <a href="/privacy-policy/" target="_blank" rel="noopener">обработкой персональных данных</a></p>' +
          '<div class="rr-offer-progress">' +
            '<div class="rr-offer-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="95" aria-label="Почти готово"><span></span></div>' +
            '<p class="rr-offer-progress-label">Почти готово — 95%</p>' +
            '<p class="rr-offer-progress-gift">3 PDF в подарок после консультации</p>' +
          '</div>' +
        '</div>' +
      '</form>' +
      '<div class="rr-offer-step" data-step="success" hidden>' +
        '<div class="rr-offer-actions"><button type="button" class="rr-offer-button rr-offer-done">Хорошо</button></div>' +
      '</div>' +
    '</div>' +
    '<img class="rr-offer-books" src="/assets/img/web/consultation-books.webp" width="1200" height="760" alt="Три PDF о подготовке к операции, наркозе и восстановлении" decoding="async" loading="lazy">' +
  '</div>';
  document.body.appendChild(dialog);
  // The illustration waits in the closed dialog: fetch it after the page, so it never competes with the first screen.
  window.addEventListener('load', function () {
    setTimeout(function () { new Image().src = dialog.querySelector('.rr-offer-books').src; }, 2000);
  });

  var SCREENS = {
    name: {
      title: 'Получите личную консультацию хирурга <span>+ 3 PDF в подарок</span>',
      text: 'Узнайте, какая коррекция подойдёт вам. После консультации получите материалы RR Clinic о подготовке к операции, наркозе и восстановлении',
    },
    phone: { title: 'Ваш WhatsApp для связи', text: 'Ответим на вопросы и подберём удобное время консультации' },
    success: { title: 'Заявка отправлена', text: 'Напишем вам в WhatsApp, чтобы согласовать время консультации' },
  };
  var SEND_LABEL = 'Записаться на консультацию';
  var SEND_TIMEOUT = 12000;
  var form = dialog.querySelector('.rr-offer-form');
  var nameInput = dialog.querySelector('#rr-offer-name');
  var nameError = dialog.querySelector('#rr-offer-name-error');
  var phoneInput = dialog.querySelector('#rr-offer-phone');
  var phoneError = dialog.querySelector('#rr-offer-phone-error');
  var sendError = dialog.querySelector('.rr-offer-send-error');
  var sendButton = dialog.querySelector('.rr-offer-send');
  var backButton = dialog.querySelector('.rr-offer-back');
  var doneButton = dialog.querySelector('.rr-offer-done');
  var step = 'name';
  var phoneNumber = '';
  var sending = false;
  var sent = false;

  function setError(input, element, message) {
    element.textContent = message;
    element.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  function clearSendError() {
    sendError.textContent = '';
    sendError.hidden = true;
    sendButton.textContent = SEND_LABEL;
  }
  function setStep(next) {
    step = next;
    dialog.querySelector('.rr-offer-title').innerHTML = SCREENS[next].title;
    dialog.querySelector('.rr-offer-description').textContent = SCREENS[next].text;
    dialog.querySelectorAll('.rr-offer-step').forEach(function (element) {
      element.hidden = element.getAttribute('data-step') !== next;
    });
    form.hidden = next === 'success';
  }

  // The field shows the mask; phoneNumber keeps the ten digits after +7.
  function phoneDigits(value) {
    var digits = value.replace(/\D/g, '');
    if (/^\s*\+?7\s*\(|^\s*\+7|^8/.test(value) || digits.length > 10) digits = digits.slice(1);
    return digits.slice(0, 10);
  }
  function formatPhone(digits) {
    if (!digits) return '';
    var value = '+7 (' + digits.slice(0, 3);
    if (digits.length > 3) value += ') ' + digits.slice(3, 6);
    if (digits.length > 6) value += '-' + digits.slice(6, 8);
    if (digits.length > 8) value += '-' + digits.slice(8, 10);
    return value;
  }
  phoneInput.addEventListener('input', function (event) {
    var atEnd = phoneInput.selectionStart === phoneInput.value.length;
    var digits = phoneDigits(phoneInput.value);
    var beforeCaret = phoneDigits(phoneInput.value.slice(0, phoneInput.selectionStart)).length;
    // Backspace over a bracket or dash removes the digit behind it.
    if (event.inputType === 'deleteContentBackward' && digits === phoneNumber && beforeCaret) {
      digits = digits.slice(0, beforeCaret - 1) + digits.slice(beforeCaret);
      beforeCaret -= 1;
    }
    phoneNumber = digits;
    phoneInput.value = formatPhone(digits);
    if (!atEnd) {
      var caret = phoneInput.value ? 4 : 0;
      while (beforeCaret > 0 && caret < phoneInput.value.length) {
        if (/\d/.test(phoneInput.value.charAt(caret))) beforeCaret -= 1;
        caret += 1;
      }
      phoneInput.setSelectionRange(caret, caret);
    }
    setError(phoneInput, phoneError, '');
    clearSendError();
  });
  nameInput.addEventListener('input', function () { setError(nameInput, nameError, ''); });

  function setSending(value) {
    sending = value;
    sendButton.disabled = value;
    backButton.disabled = value;
    phoneInput.readOnly = value;
    if (value) sendButton.textContent = 'Отправляем…';
  }
  function send() {
    if (sending) return;
    sendError.hidden = true;
    setSending(true);
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, SEND_TIMEOUT);
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value.trim(), phone: '+7' + phoneNumber, doctor: doctor, page: location.pathname }),
      signal: controller.signal,
    }).then(function (response) {
      return response.ok ? response.json() : null;
    }).then(function (result) {
      if (!result || result.ok !== true) throw new Error('Lead was not accepted');
      clearTimeout(timeout);
      sent = true;
      setSending(false);
      setStep('success');
      doneButton.focus();
    }).catch(function () {
      clearTimeout(timeout);
      setSending(false);
      sendError.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз';
      sendError.hidden = false;
      sendButton.textContent = 'Повторить';
      sendButton.focus();
    });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (step === 'name') {
      if (!nameInput.value.trim()) {
        setError(nameInput, nameError, 'Введите имя');
        nameInput.focus();
        return;
      }
      setStep('phone');
      phoneInput.focus();
      return;
    }
    if (phoneNumber.length !== 10) {
      setError(phoneInput, phoneError, 'Проверьте номер телефона');
      phoneInput.focus();
      return;
    }
    send();
  });
  backButton.addEventListener('click', function () {
    setStep('name');
    nameInput.focus();
  });
  setStep('name');

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
  function hide() {
    if (dialog.open) dialog.close();
    restoreScroll();
  }
  // Stay open during sending: a failed request has to reach the visitor.
  function close() {
    if (!sending) hide();
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
  doneButton.addEventListener('click', close);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    // Safari can omit links from its default Tab order. Keep every visible control reachable.
    var controls = [].filter.call(dialog.querySelectorAll('a[href], button, input'), function (control) {
      return !control.disabled && control.offsetParent !== null;
    });
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
  window.addEventListener('pagehide', function () { pause(); hide(); });
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted || sent) return;
    shown = false;
    remaining = 10000;
    resume();
  });
  resume();

  // Framer's bundles wait for this promise before the case galleries start their timers,
  // so a visitor sees the first case of this page instead of a later slide.
  window.rrCasesVisible = new Promise(function (resolve) {
    function check() {
      var cases = document.getElementById('cases');
      if (cases && cases.getBoundingClientRect().top > window.innerHeight * 0.65) return;
      window.removeEventListener('scroll', check);
      resolve();
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  });

  // Procedure pages open the operations block on their own tab. Framer has no such option per page,
  // and changing its variant in the bundle would break hydration, so press the tab once it is hydrated.
  var OPENING_TABS = {
    '/kurmanbayev-rustam/mammoplasty': { label: 'Увеличение груди', index: 1 },
    '/temirkhanov-amir/mammoplasty': { label: 'Увеличение груди', index: 1 },
    '/kodzoeva-leila/mammoplasty': { label: 'Увеличение груди', index: 1 },
    '/mussa-baurzhan/mammoplasty': { label: 'Увеличение груди', index: 1 },
    '/chatinyan-garik/facelift': { label: 'Подтяжка лица', index: 1 },
    '/savelyev-evgeniy/abdominoplasty': { label: 'Восстановление фигуры', index: 2 },
  };
  function isVisible(element) {
    return element.getBoundingClientRect().width > 0;
  }
  function findTab(opening) {
    // Phones show inactive tabs as icons without text, so only their order identifies them.
    var row = [].filter.call(document.querySelectorAll('#main [data-framer-name="kjk"]'), isVisible)[0];
    if (row) return row.children[opening.index];
    var anchor = document.getElementById('operations');
    if (!anchor) return null;
    var top = anchor.getBoundingClientRect().top;
    return [].filter.call(document.querySelectorAll('#main [data-framer-name^="Frame"]'), function (element) {
      var rect = element.getBoundingClientRect();
      return rect.width && rect.top >= top && rect.top < top + 400 && element.textContent.replace(/\s+/g, ' ').trim() === opening.label;
    })[0];
  }
  function isHydrated(element) {
    return Object.keys(element).some(function (key) { return key.indexOf('__reactProps') === 0; });
  }
  function pressTab(tab) {
    var rect = tab.getBoundingClientRect();
    var point = { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: rect.left + 1, clientY: rect.top + 1 };
    tab.dispatchEvent(new PointerEvent('pointerdown', point));
    tab.dispatchEvent(new PointerEvent('pointerup', point));
    tab.dispatchEvent(new MouseEvent('click', point));
  }
  var openingTab = OPENING_TABS[location.pathname.replace(/\/$/, '')];
  if (openingTab) {
    var tabChecks = 0;
    var tabTimer = setInterval(function () {
      var tab = findTab(openingTab);
      tabChecks += 1;
      if (tab && isHydrated(tab)) pressTab(tab);
      if ((tab && isHydrated(tab)) || tabChecks > 200) clearInterval(tabTimer);
    }, 300);
  }

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
