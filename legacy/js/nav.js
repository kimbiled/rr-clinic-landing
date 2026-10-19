// Navbar — owner FE-3. Expanded bar (Figma 1610:466) ⇄ centered "island" on scroll (design-spec §2.2, §9.6).
//
// Morph: FLIP. Before toggling .is-island we measure every [data-flip] element, toggle the class (layout
// changes once), measure again and play the inverse transform back to identity with WAAPI. The dark-glass
// surface is a separate childless leaf whose box is tweened via CSS vars, so the page never reflows.
// Scroll: one passive listener → rAF → hysteresis (collapse at y > 80, expand at y <= 40).

const COLLAPSE_AT = 80;
const EXPAND_AT = 40;
const DUR_COLLAPSE = 420;
const DUR_EXPAND = 360;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export async function init(ctx) {
  const nav = document.querySelector('[data-nav]');
  const inner = nav?.querySelector('.nav__inner');
  if (!nav || !inner) return;

  syncFromData(nav, ctx.data);

  const flipEls = [...nav.querySelectorAll('[data-flip]')];
  let island = false;
  let ticking = false;
  let morphTimer = 0;

  function placeSurface() {
    const r = inner.getBoundingClientRect();
    nav.style.setProperty('--sx', `${r.left}px`);
    nav.style.setProperty('--sy', `${r.top}px`);
    nav.style.setProperty('--sw', `${r.width}px`);
    nav.style.setProperty('--sh', `${r.height}px`);
  }

  function setIsland(next, animate) {
    if (next === island) return;
    island = next;

    const reduced = ctx.reducedMotion;
    const morph = animate && !reduced;
    const duration = next ? DUR_COLLAPSE : DUR_EXPAND;

    // FIRST (includes any in-flight transform, so interrupted morphs stay continuous)
    const first = morph ? flipEls.map((el) => el.getBoundingClientRect()) : null;
    if (morph) flipEls.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

    clearTimeout(morphTimer);
    nav.classList.toggle('is-morphing', morph);
    nav.style.setProperty('--nav-morph', `${duration}ms`);
    nav.classList.toggle('is-island', next);
    placeSurface();

    if (morph) {
      // LAST + INVERT + PLAY
      flipEls.forEach((el, i) => {
        const f = first[i];
        const l = el.getBoundingClientRect();
        if (!l.width && !l.height) return;
        if (!f.width && !f.height) {
          // Appears only in the new state (e.g. the island divider): fade in once things have moved.
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: duration * 0.45, easing: 'linear', fill: 'backwards' });
          return;
        }
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        const scale = el.dataset.flip === 'scale';
        const sx = scale && l.width ? f.width / l.width : 1;
        const sy = scale && l.height ? f.height / l.height : 1;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && sx === 1 && sy === 1) return;
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transform: 'translate(0, 0) scale(1, 1)' },
          ],
          { duration, easing: EASE_OUT },
        );
      });
      morphTimer = setTimeout(() => nav.classList.remove('is-morphing'), duration + 60);
    } else if (animate && reduced) {
      // Reduced motion: instant swap with a short crossfade (opacity only, §9.7)
      inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' });
    }

    nav.dataset.state = next ? 'island' : 'expanded';
  }

  function update() {
    ticking = false;
    const y = window.scrollY;
    if (!island && y > COLLAPSE_AT) setIsland(true, true);
    else if (island && y <= EXPAND_AT) setIsland(false, true);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );

  window.addEventListener('resize', () => {
    nav.classList.remove('is-morphing');
    placeSurface();
  });

  // Initial state without animation (e.g. reload while scrolled down)
  placeSurface();
  nav.dataset.state = 'expanded';
  if (window.scrollY > COLLAPSE_AT) setIsland(true, false);

  // Fonts change link widths → re-measure the surface once they are in
  document.fonts?.ready.then(placeSurface).catch(() => {});

  trackActiveSection(nav);
}

/** Keep the static markup in line with hero.json (only touches text that differs). */
function syncFromData(nav, data) {
  if (!data) return;
  const { clinic, nav: items } = data;

  if (Array.isArray(items)) {
    const links = [...nav.querySelectorAll('.nav__link')];
    items.forEach((item, i) => {
      const a = links[i];
      if (!a) return;
      if (a.textContent.trim() !== item.label) a.textContent = item.label;
      if (a.getAttribute('href') !== item.href) a.setAttribute('href', item.href);
    });
  }

  if (clinic) {
    const phone = nav.querySelector('.nav__phone');
    if (phone && clinic.phone && phone.textContent.trim() !== clinic.phone) phone.textContent = clinic.phone;
    if (phone && clinic.phoneHref) phone.setAttribute('href', clinic.phoneHref);
    const wa = nav.querySelector('.nav__wa');
    if (wa && clinic.whatsappHref) wa.setAttribute('href', clinic.whatsappHref);
  }
}

/** aria-current + gold dot for the section in view (only for anchors whose target exists). */
function trackActiveSection(nav) {
  if (!('IntersectionObserver' in window)) return;
  const links = [...nav.querySelectorAll('.nav__link')];
  const byId = new Map();
  links.forEach((a) => {
    const id = a.getAttribute('href')?.slice(1);
    const target = id && document.getElementById(id);
    if (target) byId.set(target, a);
  });
  if (!byId.size) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target);
        if (entry.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  byId.forEach((_, target) => io.observe(target));
}
