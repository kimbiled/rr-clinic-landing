// DOM builders for the case strip (owner: FE-2). Pure functions: data in, elements out.
// Geometry and card anatomy follow docs/design-spec.md §4.2 (before/after), §4.3 (video), §5.3 (panel).

export const GEOM = Object.freeze({
  W: 200, // card width (Animation frame 1713:3971)
  H: 220, // card height
  PITCH: 220, // width + 20 gap
  TOP: 124, // strip top inside the 720 frame
  DESIGN_W: 1440,
});

const ARROW_LEFT = 'M5.37931 6.2069L4.13793 4.96552L5.37931 3.72414'; // assets/icons/arrow-left.svg
const ARROW_RIGHT = 'M4.55172 3.72414L5.7931 4.96552L4.55172 6.2069'; // assets/icons/arrow-right.svg
const PLAY_ICON = 'assets/icons/play-circle.svg';

/** Small element factory. `attrs` values of null/undefined/false are skipped. */
export function h(tag, className, attrs, children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'text') el.textContent = value;
      else if (key === 'style') el.style.cssText = value;
      else el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  if (children) el.append(...children.filter(Boolean));
  return el;
}

function arrowSvg(d, side) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 9.93104 9.93104');
  svg.setAttribute('class', `cc-ba__arrow cc-ba__arrow--${side}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '0.9');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

/**
 * Inline style that places `image.framing` (normalized rect of the source) onto a slot of the card.
 * slot = { x, w } as fractions of the card width (full height). Same math as docs/data-schema.md.
 */
export function framingStyle(framing, slot = { x: 0, w: 1 }) {
  if (!framing) return null;
  const width = (slot.w * 100) / framing.w;
  const height = 100 / framing.h;
  const left = slot.x * 100 - width * framing.x;
  const top = -height * framing.y;
  const r = (n) => Math.round(n * 1000) / 1000;
  return `left:${r(left)}%;top:${r(top)}%;width:${r(width)}%;height:${r(height)}%`;
}

export function img(image, { alt = '', eager = false, className = '', style = null } = {}) {
  return h('img', className, {
    src: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt ?? alt,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    draggable: 'false',
    style,
  });
}

/**
 * Shrinks `rect` (normalized, of an image w×h px) around its center so it has the aspect of the
 * slot — a uniform "cover" crop, never a stretch.
 */
function coverRect(rect, w, h, slotAspect) {
  const rw = rect.w * w;
  const rh = rect.h * h;
  if (rw / rh > slotAspect) {
    const nw = (rh * slotAspect) / w;
    return { x: rect.x + (rect.w - nw) / 2, y: rect.y, w: nw, h: rect.h };
  }
  const nh = rw / slotAspect / h;
  return { x: rect.x, y: rect.y + (rect.h - nh) / 2, w: rect.w, h: nh };
}

/** Fallback when a case only has the side-by-side `pair` source (left half = before, right = after). */
function fromPair(pair, side) {
  const halfAspect = GEOM.W / 2 / GEOM.H;
  return { src: pair.src, width: pair.width, height: pair.height, framing: coverRect(pair[side], pair.width, pair.height, halfAspect) };
}

/** Before/after media. `clip` mode when both images carry framing (aligned full shots), else `split`. */
function buildBeforeAfter(item, eager) {
  const before = item.before ?? (item.pair && fromPair(item.pair, 'before'));
  const after = item.after ?? (item.pair && fromPair(item.pair, 'after'));
  if (!before || !after) return buildPosterOnly(item, eager);

  const clip = Boolean(before.framing && after.framing);
  const beforeImg = img(before, {
    alt: `До: ${item.title}`,
    eager,
    className: clip ? 'cc-ba__img cc-ba__img--framed' : 'cc-ba__img cc-ba__img--cover',
    style: clip ? framingStyle(before.framing, { x: 0, w: 0.5 }) : null,
  });
  const afterImg = img(after, {
    alt: `После: ${item.title}`,
    eager,
    className: clip ? 'cc-ba__img cc-ba__img--framed' : 'cc-ba__img cc-ba__img--cover',
    style: clip ? framingStyle(after.framing, { x: 0.5, w: 0.5 }) : null,
  });

  const knob = h('span', 'cc-ba__knob', {
    role: 'slider',
    'aria-label': 'Сравнение до и после',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': 50,
    'aria-valuetext': 'До 50%, после 50%',
  }, [arrowSvg(ARROW_LEFT, 'left'), arrowSvg(ARROW_RIGHT, 'right')]);

  return h('div', `cc-media cc-ba ${clip ? 'cc-ba--clip' : 'cc-ba--split'}`, {
    'data-case-media': item.id,
    style: '--pos:50%',
  }, [
    h('div', 'cc-ba__pane cc-ba__pane--after', null, [afterImg]),
    h('div', 'cc-ba__pane cc-ba__pane--before', null, [beforeImg]),
    h('div', 'cc-shade cc-shade--bottom', { 'aria-hidden': 'true' }),
    h('span', 'cc-ba__label cc-ba__label--before', { 'aria-hidden': 'true', text: 'До' }),
    h('span', 'cc-ba__label cc-ba__label--after', { 'aria-hidden': 'true', text: 'После' }),
    h('span', 'cc-ba__line', { 'aria-hidden': 'true' }),
    knob,
    item.showTitle ? h('p', 'cc-title', { text: item.title }) : null,
  ]);
}

function buildVideo(item, eager) {
  const poster = item.poster;
  return h('div', 'cc-media cc-vid', {
    'data-case-media': item.id,
    'data-has-video': item.video?.src ? 'true' : 'false',
  }, [
    poster
      ? img(poster, {
        alt: item.caption ? `${item.caption}. ${item.title}` : item.title,
        eager,
        className: poster.framing ? 'cc-vid__poster cc-vid__poster--framed' : 'cc-vid__poster',
        style: framingStyle(poster.framing),
      })
      : null,
    h('div', 'cc-shade cc-shade--top', { 'aria-hidden': 'true' }),
    h('div', 'cc-shade cc-shade--bottom', { 'aria-hidden': 'true' }),
    item.showTitle ? h('p', 'cc-vid__title', { text: item.title }) : null,
    h('img', 'cc-vid__play', { src: PLAY_ICON, alt: '', width: 22, height: 22, draggable: 'false', 'aria-hidden': 'true' }),
    item.caption ? h('p', 'cc-vid__caption', { text: item.caption }) : null,
  ]);
}

function buildPosterOnly(item, eager) {
  const image = item.poster ?? item.after ?? item.before;
  return h('div', 'cc-media cc-vid', { 'data-case-media': item.id, 'data-has-video': 'false' }, [
    image ? img(image, { alt: item.title, eager, className: 'cc-vid__poster', style: framingStyle(image.framing) }) : null,
    h('div', 'cc-shade cc-shade--bottom', { 'aria-hidden': 'true' }),
    item.showTitle ? h('p', 'cc-title', { text: item.title }) : null,
  ]);
}

export function buildMedia(item, { eager = false } = {}) {
  if (item.type === 'beforeAfter') return buildBeforeAfter(item, eager);
  if (item.type === 'video') return buildVideo(item, eager);
  return buildPosterOnly(item, eager);
}

export function doctorName(doctor) {
  if (!doctor) return '';
  const full = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
  return full || doctor.name || '';
}

/**
 * One card of the strip. `primary` = the single focusable copy; duplicates are aria-hidden.
 * `k` = index inside the track (left = k * PITCH).
 */
export function buildCard(item, doctor, { k, primary, eager }) {
  const card = h('div', 'cc-card', {
    'data-case': item.id,
    'data-doctor': item.doctorId ?? '',
    'data-k': k,
    style: `left:${k * GEOM.PITCH}px`,
  }, [buildMedia(item, { eager })]);

  if (primary) {
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Кейс: ${item.title}`);
    const hints = [];
    const name = doctorName(doctor);
    if (name) hints.push(`Хирург: ${name}.`);
    if (item.type === 'beforeAfter') hints.push('Стрелки влево и вправо сдвигают границу «до/после».');
    if (hints.length) card.append(h('span', 'visually-hidden', { text: hints.join(' ') }));
  } else {
    card.setAttribute('aria-hidden', 'true');
  }
  return card;
}

export function pluralRu(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function thumbImage(item) {
  return item.after ?? item.poster ?? item.before ?? null;
}

/** Dark info panel under the lifted card (§5.1 + §5.3). */
export function buildPanel(item, doctor, doctorCases) {
  const avatarImage = doctor?.avatar ?? doctor?.photo ?? null;
  const initials = doctor ? `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}` : '';

  const rows = [h('p', 'cc-panel__title', { text: item.title })];

  if (doctor) {
    rows.push(h('div', 'cc-panel__doctor', null, [
      avatarImage
        ? h('span', 'cc-avatar', null, [img(avatarImage, { eager: true, className: 'cc-avatar__img' })])
        : h('span', 'cc-avatar cc-avatar--initials', { text: initials }),
      h('span', 'cc-panel__name', { text: doctorName(doctor) }),
    ]));
  }

  if (doctor && doctorCases.length > 1) {
    const shown = doctorCases.slice(0, 3);
    const rest = doctorCases.length - shown.length;
    const thumbs = shown.map((c) => {
      const image = thumbImage(c);
      return h('span', `cc-thumb${c.id === item.id ? ' is-current' : ''}`, { 'data-thumb': c.id, title: c.title }, [
        image ? img(image, { eager: true, className: 'cc-thumb__img' }) : null,
      ]);
    });
    const label = rest > 0 ? `Ещё ${rest} ${pluralRu(rest, 'кейс', 'кейса', 'кейсов')}` : 'Все кейсы';
    const href = doctor.href ?? doctor.url ?? '#doctors';
    rows.push(h('div', 'cc-panel__cases', null, [
      ...thumbs,
      h('a', 'cc-panel__more', { href, tabindex: -1, 'data-doctor-link': doctor.id }, [
        document.createTextNode(`${label} `),
        h('span', 'cc-panel__arrow', { 'aria-hidden': 'true', text: '→' }),
      ]),
    ]));
  }

  return h('div', 'cc-panel', null, [h('div', 'cc-panel__inner', null, rows)]);
}

/** Static measuring grid (§4.4): two horizontals on the card band + verticals every 220 px. */
export function buildGrid(viewportWidth) {
  const grid = h('div', 'cc-grid', { 'aria-hidden': 'true' });
  grid.append(
    h('span', 'cc-grid__h', { style: `top:${GEOM.TOP}px` }),
    h('span', 'cc-grid__h', { style: `top:${GEOM.TOP + GEOM.H}px` }),
  );
  const center = viewportWidth / 2;
  const first = center - GEOM.DESIGN_W / 2 + 360; // x = 360, 580, 800, 1020, 1240 in the 1440 frame
  const start = first - Math.ceil(first / GEOM.PITCH) * GEOM.PITCH;
  for (let x = start; x <= viewportWidth; x += GEOM.PITCH) {
    if (x < 0) continue;
    grid.append(h('span', 'cc-grid__v', { style: `left:${Math.round(x)}px` }));
  }
  return grid;
}
