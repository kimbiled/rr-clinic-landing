// Surgeon selection menu ("Меню выбора хирурга") — owner FE-3. design-spec §7.2 (layout PROPOSED, Figma 1565:3926).
//
// Triggers: every [data-surgeon-trigger] (hero CTA "Подобрать специалиста", nav "Врачи").
// Native modal <dialog> (top layer, background inert) + our own focus trap/return, Esc, click-outside,
// listbox with roving tabindex (arrows / Home / End, Enter/Space selects).
// Bus: selecting emits 'surgeon:select' { doctorId }; "Сбросить" emits { doctorId: null }.

const MENU_ID = 'surgeon-menu';
const ICON_ARROW = 'assets/icons/arrow-down-right.svg';
const ICON_WA = 'assets/icons/whatsapp.svg';
const ICON_LOGO = 'assets/icons/logo.svg';
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export async function init(ctx) {
  const doctors = Array.isArray(ctx.data?.doctors) ? ctx.data.doctors : [];
  const triggers = [...document.querySelectorAll('[data-surgeon-trigger]')];
  if (!doctors.length || !triggers.length) return;

  const caseCount = countCases(ctx.data?.cases);
  const ui = buildDialog(ctx.data, doctors, caseCount);
  document.body.append(ui.dialog);

  let selectedId = null;
  let returnFocus = null;
  let closing = null;
  let lockedScrollbar = 0;

  // ---------- triggers ----------
  triggers.forEach((t) => {
    t.setAttribute('aria-haspopup', 'dialog');
    t.setAttribute('aria-expanded', 'false');
    t.setAttribute('aria-controls', MENU_ID);
    if (t.tagName === 'A') t.setAttribute('role', 'button');
    t.addEventListener('click', (e) => {
      e.preventDefault();
      open(t);
    });
    // role=button links must also activate on Space
    t.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        open(t);
      }
    });
  });

  // ---------- reset chip in the hero chips row ----------
  const chipsRow = ctx.root?.querySelector('[data-hero-chips]');
  const filterChip = document.createElement('button');
  filterChip.type = 'button';
  filterChip.className = 'hero-chip hero-chip--filter';
  filterChip.hidden = true;
  const filterLabel = document.createElement('span');
  const filterX = document.createElement('span');
  filterX.className = 'hero-chip__x';
  filterX.setAttribute('aria-hidden', 'true');
  filterX.textContent = '×';
  filterChip.append(filterLabel, filterX);
  filterChip.addEventListener('click', () => select(null));
  chipsRow?.append(filterChip);

  // ---------- open / close ----------
  function open(trigger) {
    if (ui.dialog.open && !closing) return;
    if (closing) finishClose();
    returnFocus = trigger ?? document.activeElement;
    lockScroll();
    ui.dialog.showModal();
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'true'));

    const focusTarget = ui.options.find((o) => o.dataset.doctorId === selectedId) ?? ui.options[0];
    setRoving(focusTarget);
    focusTarget.focus({ preventScroll: true });

    if (!ctx.reducedMotion) {
      ui.dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'linear' });
      ui.frame.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 480, easing: EASE_OUT },
      );
      ui.options.forEach((o, i) =>
        o.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 420, delay: 120 + i * 40, easing: EASE_OUT, fill: 'backwards' },
        ),
      );
    }
  }

  function close() {
    if (!ui.dialog.open || closing) return;
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    if (ctx.reducedMotion) {
      finishClose();
      return;
    }
    const a = ui.dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
    ui.frame.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(16px)' },
      ],
      { duration: 240, easing: 'ease-in', fill: 'forwards' },
    );
    closing = a;
    a.finished.then(() => closing === a && finishClose()).catch(() => {});
  }

  function finishClose() {
    closing = null;
    ui.dialog.getAnimations().forEach((x) => x.cancel());
    ui.frame.getAnimations().forEach((x) => x.cancel());
    if (ui.dialog.open) ui.dialog.close();
    unlockScroll();
    const back = returnFocus && returnFocus.isConnected ? returnFocus : triggers[0];
    back?.focus({ preventScroll: true });
    returnFocus = null;
  }

  // Esc: native 'cancel' → our animated close
  ui.dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  // Click outside any surface (the dialog itself is the full-screen backdrop)
  ui.dialog.addEventListener('click', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('[data-smenu-surface]')) close();
  });
  ui.close.addEventListener('click', close);

  // Section links: close, then let the anchor navigate
  ui.sections.forEach((a) => a.addEventListener('click', () => close()));

  // ---------- focus trap (Tab cycles inside the dialog) ----------
  ui.dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = getFocusables(ui.dialog);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ---------- listbox: roving tabindex + arrows ----------
  const COLS = 2;
  ui.list.addEventListener('keydown', (e) => {
    const current = e.target.closest('[role="option"]');
    if (!current) return;
    const i = ui.options.indexOf(current);
    const n = ui.options.length;
    let next = -1;
    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(n - 1, i + 1);
        break;
      case 'ArrowLeft':
        next = Math.max(0, i - 1);
        break;
      case 'ArrowDown':
        next = i + COLS < n ? i + COLS : i;
        break;
      case 'ArrowUp':
        next = i - COLS >= 0 ? i - COLS : i;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(current.dataset.doctorId, { close: true });
        return;
      default:
        return;
    }
    e.preventDefault();
    setRoving(ui.options[next]);
    ui.options[next].focus();
  });

  ui.list.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (!option) return;
    setRoving(option);
    select(option.dataset.doctorId, { close: true });
  });

  ui.reset.addEventListener('click', () => {
    select(null);
    const first = ui.options[0];
    setRoving(first);
    first.focus();
  });

  function setRoving(active) {
    ui.options.forEach((o) => (o.tabIndex = o === active ? 0 : -1));
  }

  // ---------- selection ----------
  function select(doctorId, { close: shouldClose = false, emit = true } = {}) {
    const id = doctorId && doctors.some((d) => d.id === doctorId) ? doctorId : null;
    const changed = id !== selectedId;
    selectedId = id;
    render();
    if (emit && changed) ctx.emit('surgeon:select', { doctorId: id });
    if (shouldClose) close();
  }

  function render() {
    ui.options.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.doctorId === selectedId)));
    ui.reset.hidden = !selectedId;
    const doc = doctors.find((d) => d.id === selectedId);
    filterChip.hidden = !doc;
    if (doc) {
      const name = `${doc.firstName} ${doc.lastName}`;
      filterLabel.textContent = name;
      filterChip.setAttribute('aria-label', `Показаны кейсы врача ${name}. Сбросить выбор`);
    }
  }

  // Keep in sync if another module selects / resets
  ctx.on('surgeon:select', (detail) => {
    const id = detail?.doctorId ?? null;
    if (id !== selectedId) select(id, { emit: false });
  });

  // ---------- scroll lock ----------
  function lockScroll() {
    const root = document.documentElement;
    lockedScrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    if (lockedScrollbar > 0) document.body.style.paddingRight = `${lockedScrollbar}px`;
  }
  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  render();
}

// ======================================================================
// DOM
// ======================================================================

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...[].concat(children).filter(Boolean));
  return el;
}

function buildDialog(data, doctors, caseCount) {
  const clinic = data?.clinic ?? {};
  const sectionsNav = (data?.nav ?? []).filter((item) => item.id !== 'doctors');

  const close = h('button', { type: 'button', class: 'smenu__close', 'aria-label': 'Закрыть меню' });
  close.innerHTML =
    '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';

  const head = h('div', { class: 'smenu__head' }, [
    h('div', { class: 'smenu__brand', 'data-smenu-surface': true }, [
      h('img', { src: ICON_LOGO, alt: '', width: 35, height: 32 }),
      h('h2', { class: 'smenu__title', id: `${MENU_ID}-title`, text: 'Подбор хирурга' }),
    ]),
    h('div', { 'data-smenu-surface': true }, [close]),
  ]);

  const sections = sectionsNav.map((item) => h('a', { href: item.href, text: item.label }));
  const left = h('nav', { class: 'smenu__col smenu__sections', 'aria-label': 'Разделы клиники', 'data-smenu-surface': true }, [
    h('div', { class: 'smenu__eyebrow', text: 'Клиника' }),
    h('ul', {}, sections.map((a) => h('li', {}, [a]))),
  ]);

  const reset = h('button', { type: 'button', class: 'smenu__reset', hidden: true }, [
    h('span', { text: 'Сбросить' }),
    h('span', { 'aria-hidden': 'true', text: '×' }),
  ]);

  const options = doctors.map((d) => doctorOption(d, caseCount.get(d.id) ?? 0));
  const list = h(
    'ul',
    { class: 'smenu__list', role: 'listbox', 'aria-labelledby': `${MENU_ID}-doctors`, 'aria-orientation': 'vertical' },
    options,
  );

  const right = h('section', { class: 'smenu__col smenu__doctors', 'data-smenu-surface': true }, [
    h('div', { class: 'smenu__eyebrow' }, [
      h('span', { id: `${MENU_ID}-doctors`, text: 'Врачи · выберите специалиста' }),
      reset,
    ]),
    list,
  ]);

  const help = h('div', { class: 'smenu__help', 'data-smenu-surface': true }, [
    h('p', { class: 'smenu__help-text' }, [
      document.createTextNode('Не знаете, к кому обратиться?'),
      h('span', { text: 'Поможем выбрать врача под вашу задачу — бесплатно и без обязательств.' }),
    ]),
    h('a', { class: 'cta cta--primary', href: clinic.phoneHref || '#contacts' }, [
      h('span', { class: 'cta__glint', 'aria-hidden': 'true' }),
      h('span', { class: 'cta__label', text: 'Помощь с выбором' }),
      h('img', { class: 'cta__icon', src: ICON_ARROW, alt: '', width: 20, height: 20 }),
    ]),
    h('a', { class: 'smenu__wa', href: clinic.whatsappHref || '#contacts', target: '_blank', rel: 'noopener' }, [
      h('span', { class: 'smenu__wa-icon' }, [h('img', { src: ICON_WA, alt: '', width: 16, height: 16 })]),
      h('span', { text: 'Написать в WhatsApp' }),
    ]),
  ]);

  const frame = h('div', { class: 'smenu__frame' }, [head, h('div', { class: 'smenu__body' }, [left, right]), help]);

  const dialog = h('dialog', { class: 'smenu', id: MENU_ID, 'aria-labelledby': `${MENU_ID}-title`, 'aria-modal': 'true' }, [frame]);

  return { dialog, frame, close, list, options, reset, sections };
}

function doctorOption(doc, count) {
  const name = `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim() || doc.name;
  const image = doc.avatar ?? doc.photo;
  const avatar = h('span', { class: 'smenu-doc__avatar', 'aria-hidden': 'true' }, [
    image
      ? h('img', { src: image.src, alt: '', width: 64, height: 64, loading: 'lazy', decoding: 'async' })
      : h('span', { class: 'smenu-doc__mono', text: initials(doc) }),
  ]);

  const countLabel = count ? `${count} ${plural(count, 'кейс', 'кейса', 'кейсов')}` : 'Кейсы скоро';

  return h(
    'li',
    {
      class: 'smenu-doc',
      role: 'option',
      tabindex: -1,
      'aria-selected': 'false',
      'aria-label': `${name}. ${doc.specialty || doc.role || ''}. ${countLabel}`,
      dataset: { doctorId: doc.id },
    },
    [
      avatar,
      h('span', { class: 'smenu-doc__text' }, [
        h('span', { class: 'smenu-doc__name', text: name }),
        h('span', { class: 'smenu-doc__spec', text: doc.specialty || doc.role || '' }),
      ]),
      h('span', { class: 'smenu-doc__meta', 'aria-hidden': 'true' }, [
        h('span', { class: 'smenu-doc__count', text: countLabel }),
        h('span', { class: 'smenu-doc__badge', text: 'Выбран' }),
        h('span', { class: 'smenu-doc__arrow' }, [h('img', { src: ICON_ARROW, alt: '', width: 16, height: 16 })]),
      ]),
    ],
  );
}

function initials(doc) {
  const a = (doc.firstName || doc.name || '?').trim()[0] ?? '';
  const b = (doc.lastName || '').trim()[0] ?? '';
  return (a + b).toUpperCase();
}

function countCases(cases) {
  const map = new Map();
  (cases ?? []).forEach((c) => map.set(c.doctorId, (map.get(c.doctorId) ?? 0) + 1));
  return map;
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function getFocusables(root) {
  return [
    ...root.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'),
  ].filter((el) => !el.hidden && el.offsetParent !== null);
}
