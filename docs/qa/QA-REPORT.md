# QA report: RR Clinic Hero + Navbar (desktop), integrated build

Date: 2026-10-19 · Build: working tree in `/Users/admin/Desktop/medical` (served by `python3 -m http.server 5180`)
Browser: Chrome (chrome-devtools MCP) plus headless Chrome over CDP for reduced-motion emulation. **Safari and Firefox were not tested.**
Primary viewport: 1440×720 DPR1. Also tested: 1280×720, 1760/1300 (live resize), 1920×1080, 2560×1440, 1024×720, and 1440×720 at DPR3.
References: `assets/ref/anim-carousel-1713-3971.png` (idle), `assets/ref/hover-amir-1715-4160.png` (hover), `assets/ref/hero-figma-1024.png` (v1).
Evidence: screenshots in `docs/qa/*.png`, named in each row.

**How the checks were run.** The pointer was **scripted**: the hover tool refuses moving elements, so `pointerover`/`pointerout`/`pointerdown`/`pointermove`/`pointerup` were dispatched at `document.elementFromPoint` coordinates. Keyboard input was **real** (`press_key`: Tab, Shift+Tab, arrows, Enter, Esc). CTA and nav "Врачи" were opened with **real** clicks. Scrolling was **scripted** (`scrollTo`). Tab hide/show was **scripted** by overriding `document.hidden` and dispatching `visibilitychange`; this harness does not fire `visibilitychange` on a real tab switch. For deterministic visual diffs the strip was frozen (hidden-tab override) and set to the reference offset (card 1 at x = −40).

## Summary

| Result | Count |
|---|---|
| PASS | 12 |
| PARTIAL | 7 |
| FAIL | 2 |
| NOT TESTED | 1 |

Bugs found: 0 Blocker · 5 Major · 13 Minor · 6 Polish.

---

## 1. Acceptance checklist (PLAN.md §2)

| ID | Result | Evidence |
|---|---|---|
| H-01 Particles | PASS | Canvas `pointer-events:none`, z 5. At DPR3 the canvas is 2880×1440 (DPR capped at 2). Idle: 60.0 fps over 5 s, p95 frame interval 17.6 ms, 0 frames > 20 ms. FX + carousel JS cost on the main thread: mean 0.056 ms/frame (`FireAnimationFrame`, 13.5 s trace). GPU process ≈ 2.0 s over 13.5 s (≈ 1.8 ms/frame, whole page). The rAF loop stops when the hero is off-screen (0 rAF calls in 2 s at scrollY 1150) and resumes on return (60/s). Resize to 1760/1300 re-sizes the canvases with no errors. Not measured on an M1 specifically. |
| H-02 Light shimmer | PASS | Subtle warm light visible behind the statue (`1440-idle-aligned.png`). Runs at a 30 fps throttle and stops off-screen, as the particles do. Flicker frequency was checked by eye only, not instrumented. |
| H-03 Carousel L→R | PASS | Measured 40.13 px/s with `translateX` increasing (left→right). 0 negative steps over 3 s. `translate3d` only, no layout. Loop maths: x stays in [−2P, −P) and copies = ceil(vw/P) + 2. The track covered the viewport at 1280, 1300, 1440, 1760, 1920 and 2560. A 5-minute soak was not run; seamlessness was checked by the invariant plus per-frame sampling. |
| H-04 Hover pause | PASS | Under 0.02 px/frame at about 292 ms after `pointerover`. The strip settles 4.3 px past the entry point. Resume: 0 px/s for about 270 ms, then 40 px/s by about 950 ms with no position jump. Minor note: a 0.35 px snap when it stops (Polish P-5). |
| H-05 Doctor card slides up | PASS | Lift −16 px (y 124 → 108). Panel attached at y 328 with procedure + doctor (+ avatar, + "his cases" thumbs when the doctor has more than 1 case). Moving from image to panel keeps the hover. Moving to the adjacent card switches with no strip motion (0.00 px drift). Old lift `is-leaving` → removed at 360 ms. Thumb hover swaps the media (`1440-hover-panel-thumbs-swap.png`). Panel is 94 px tall (Figma 82, see m-4). |
| H-06 Video cases | PARTIAL | **No video sources in data**: all 3 video cases have `video: null`, and the placeholder clips promised in PLAN §1 do not exist. Poster-only path verified: hovering a video card raises no errors and the poster stays. Play / pause / `currentTime=0` / one-at-a-time / `play().catch` were reviewed in code only (`js/carousel/index.js` `playVideo`/`stopVideo`). See M-5. |
| H-07 Before/After slider | FAIL | Working: drag with pointer capture, release outside the card (no sticking, lift released, `--pos` eases back to 50%), ← → steps of 5% and Shift+arrow 10%, `aria-valuenow` updates. **Fails "ручка не выходит за границы"**: the clamp is 0–100%, so at the edges the 22 px knob sits 11 px outside the card (knob left −11 px at 0%, right −11 px at 100%). Spec §6 says 4–96%. See m-1. |
| H-08 Card rises above heading | PASS | `document.elementFromPoint` at centre, top, bottom-left, bottom-mid and bottom-right of all 7 visible cards hits the card (35/35), including the card behind the statue and the band next to the chips/H1. The lift is portalled into the overlay at z 7 and covers statue, chips and H1 (`1440-keyboard-focus-case4-behind-statue.png`). The H1 does not catch the pointer (content layer `pointer-events:none`). Polish: a ≈10% brightness jump on hand-over (P-1). |
| H-09 Text reveal | PASS | WAAPI stagger with transform + opacity only. Sampled from the first frame: every `[data-reveal]` element is at opacity 0 until the reveal, with no FOUC. The font swap (H1 width 662 → 699 px) happens **while hidden**. 0 reveal animations replayed on 4 live resizes. Reduced motion: shown at once. |
| H-10 Surgeon menu | PARTIAL | Working: 7 doctors from hero.json. Opens from the CTA and from nav "Врачи" (real clicks). The modal `<dialog>` is the top element across the viewport. Arrows move the roving focus (box-shadow ring), Enter selects, Esc closes, and focus returns to the trigger (CTA, then nav link). The Tab trap stays inside the dialog. `surgeon:select` → the strip dims the other doctors (21/24 cards `.is-dim`), and the reset chip / "Сбросить" clears it. Problems: focus is lost to `<body>` when the reset chip is activated by keyboard (m-2); the chip row goes off-centre (m-3); a doctor with 0 cases dims the whole strip (m-5). |
| H-11 CTA light | PASS | Primary `.cta__glint` runs `cta-glint-idle` 6 s infinite (2.6 s delay), plus the hover sweep. Focus ring visible (`1440-filter-amir.png`). No layout shift. |
| H-12 Frame reference | PARTIAL | There is no frame-by-frame recording, so the ±50 ms overlay check could not be done. §9.5 deviations: there is no bg-columns scale-in at t=0 and no statue rise at 150 ms. FX fade-in starts about 300 ms **before** the text reveal (the spec says 1400 ms after t0). See m-11. |
| H-13 prefers-reduced-motion | PASS | Checked in headless Chrome with CDP `Emulation.setEmulatedMedia` (prefers-reduced-motion: reduce). Strip static with card 1 at x = 24; 0 rAF calls in 2 s; canvases show one static frame; no reveal animations; hover lift appears at once (transitions 0 s); island swap is a single 150 ms opacity crossfade; the computed transition-duration is 0 s on every element sampled except the CTAs, which keep 0.26 s on filter, background-color, box-shadow and opacity only (allowed by spec §8.1). Screenshot: `1440-reduced-motion.png`. |
| H-14 Hero data | PARTIAL | hero.json parses and the embedded fallback in `hero-data.js` is byte-identical (checked). Images are well under budget (largest is bg 55 KB). **But:** card order and doctor mapping deviate from Figma (M-1), there are no videos (M-5), and statue/bg resolution is below render size (M-2). |
| N-01 Navbar expanded | PASS | Logo (101, 24, 35×32) ✓. Menu pill (165, 20) is 392×40 vs Figma 388 (+4.2 px, m-12). Phone x 1077.8 ✓. "Связаться" x 1213.8 vs 1215 ✓. WhatsApp (1299, 20) ✓. |
| N-02 Island collapse | PASS | Scroll states: 79 → expanded, 81 → island, 60 → island, 41 → island, 40 → expanded (hysteresis 80/40, spec §2.2). Passive scroll listener feeding rAF. Collapse 420 ms / expand 360 ms FLIP. Island centred (402–1037, y 12–68), phone hidden. Over 6 morphs: p95 17.6 ms, no long tasks. CLS 0.013 per toggle (m-6). |
| N-03 Back at top | PASS | `position:fixed`, no content jump. Reload at scrollY 400 → island applied at 49 ms with no morph animation. Note: PLAN says "раскрыт при ≤ 80" while the spec and build expand at ≤ 40 (intended hysteresis; update the PLAN text). |
| N-04 Navbar a11y | FAIL | Keyboard order and `:focus-visible` (2 px Gold-400) work in both states, and the aria-labels are present. **Fails:** (a) white 14 px links on the glass pill measure ≈ 2.6–3.3:1 against the 4.5:1 target (the Figma render measures 2.7–3.3:1, so this is inherited from the design); (b) the island hides keyboard focus: with the CTA at y 20–80, `elementFromPoint` at the focused CTA's centre returns the island. See M-3. |
| N-05 Island reference | NOT TESTED | Designer item. The reference landing has still not been received, and the island is PROPOSED in design-spec §2.2. |
| G-01 Skeleton/tokens | PARTIAL | Tokens and z-scale are present. `main.js` isolates each module with try/catch, and data loading falls back to the embedded data (file://, fetch error). Deviations: fonts come from the Google Fonts CDN, but PLAN §1 says "подключить локально, без CDN" (m-9); modules are imported one after another with `await`, a waterfall (Polish P-4). |
| G-02 Performance | PARTIAL | Chrome: 60 fps idle and during hover sweeps (p95 17.6 ms). LCP 104 ms (local), 291 ms (Fast 4G + 4× CPU). CLS 0.00 on load (0.0017 with throttling). Transferred 530 KB for the first screen. 0 JS exceptions. **Console is not clean:** `favicon.ico` 404 (m-8). Safari not tested. |
| G-03 Figma diff | PARTIAL | At 1440 most items are within 2 px (H1 0/0 shift, CTAs 0/0, cards 2–3 0/0 by best-shift search). Above 2 px: strip content/order (M-1), chips +6 px right of the render, statue +5 px lower, menu pill +4.2 px wider, hover panel +12 px taller, rating chip −2.6 px narrower (m-12). There is no Figma frame for 1280 or 1920, so those widths were checked for layout sanity only. |

---

## 2. Bugs (by severity)

### Blocker
None.

### Major

**M-1. Card order and doctor mapping don't match Figma (hover shows the wrong surgeon)**
- Steps: load at 1440, freeze the strip with card 1 at x = −40, compare with `anim-carousel-1713-3971.png`, then hover card 1.
- Expected (design-spec §4.1 and frame 1715:4160): sequence B/A breast (**Амир Темирханов**) · video blepharo (**Томирис Тулепбергенова**) · B/A face (Бауржан Муса) · behind statue (Лейла Кодзоева) · B/A young woman face (Томирис) · B/A breast (Савельев) · video "Интервью с Ольгой" (Романовская). The extra v1 card comes **before** card 1.
- Actual (`data/hero.json`): case-1 → `musa-baurzhan`, case-2 → `musa-baurzhan`, case-3 → `romanovskaya-tatyana`, … The extra video "Интервью с Аэлитой" (case-5, `temirkhanov-amir`) is inserted at slot 5, so the cards at x 840/1060/1280 show Аэлита / young-woman face / breast where Figma shows young-woman face / breast / Ольга (`1440-idle-aligned.png` vs the reference). Томирис Тулепбергенова does not exist in `doctors`. Hovering card 1 shows "Бауржан Муса", while Figma shows "Амир Темирханов".
- Owner: Backend, `data/hero.json` (then `scripts/sync-hero-data.sh` → `js/data/hero-data.js`).
- Fix: re-order `cases` to the Figma order with the extra video last (just before case-1 in the loop). Set case-1 → `temirkhanov-amir`. Add Томирис (or record the client decision from spec §11 Q7). Keep the doctor of cases 3–5 marked "to confirm".

**M-2. Statue and background are upscaled (soft on every screen, blurry on Retina)**
- Steps: compare `naturalWidth`/`naturalHeight` with the rendered size.
- Expected: 2× assets for the hero (the statue is the LCP-adjacent focal image).
- Actual: `statue.webp` is 1024×572 and renders at 1289×720, a 1.26× upscale at DPR1 and 2.5× at DPR2. `bg-columns.webp` is 1678×937 and renders at 1440×804 (1.7× at DPR2) and 2560×984 at 2560 wide. The source PNGs in `assets/img/` have the same small size, so re-encoding will not help.
- Owner: Backend (`scripts/optimize-images.sh`, assets) + Designer (re-export).
- Fix: re-export Figma nodes 1610:427 (statue) at ≥ 2578×1440 and 1610:269 (bg) at ≥ 2880 wide. Serve them with `srcset` 1x/2x (webp/avif). The budget allows it (current total 530 KB).

**M-3. Navbar a11y: the island hides focused elements, and link contrast is below 4.5:1 (N-04)**
- Steps: (a) scroll to 562 so the CTAs sit at y 20–80, Tab or Shift+Tab to "Подобрать специалиста", and read `elementFromPoint` at its centre; (b) measure white nav text against the pill background.
- Expected: the focused element is never under the island, and text contrast is ≥ 4.5:1.
- Actual: (a) the island covers the focused CTA (`elementFromPoint` returns `[data-nav]`), and there is no `scroll-padding-top`. (b) Nav links measure ≈ 2.6:1 (95th percentile of background) to 3.3:1 (mean). Chips measure 2.8–3.2:1. The Figma render gives 2.7–3.3 for the nav, so this is inherited from the design.
- Owner: FE-3 `css/nav.css` (contrast), Lead `css/base.css` (scroll padding); Designer for the contrast decision.
- Fix: `html { scroll-padding-top: 88px; }`. For the expanded pill, darken the glass behind the text (e.g. `rgba(41,29,16,.28)` under `--glass-light`, or a subtle text-shadow) and re-measure. The island already uses .74 dark glass and passes.

**M-4. At viewports taller than 720 the composition breaks (1920×1080 is the most common desktop size)**
- Steps: open at 1920×1080 and at 2560×1440 (`1920x1080.png`, `2560x1440.png`).
- Expected: the hero keeps the Figma relationship: the statue head sits in the card band (it covers the middle card), and the chips/H1 sit just under the strip.
- Actual: the hero becomes 900 px tall. The strip stays pinned at y 124 while the statue and content are bottom-anchored. The result is an empty band from y 344 to 543 between strip and chips, and the statue no longer sits behind the strip (only its hair overlaps one card). At 2560×1440 the hero is capped at 900 px, so 540 px of the first screen shows the light placeholder section.
- Owner: Lead `css/base.css` (`.hero` height, `.hero__statue img`) + Designer (spec §1.1 prescribes this anchoring).
- Fix (designer to choose): (a) keep a 720-tall composition and centre it vertically inside the taller hero (offset the strip, statue and content by `(heroH − 720)/2`); or (b) scale the whole stage with `--stage-scale = min(vw/1440, vh/720)`; or (c) cap the hero at 720–780 px. In every option, move the strip top together with the statue.

**M-5. No video for any video case: H-06 can't be accepted or demoed**
- Steps: hover one of the 3 video cards.
- Expected: a muted placeholder clip plays on hover (PLAN §1: "постер + placeholder-ролики 3–5 с").
- Actual: `video: null` for case-2, case-5 and case-8. Only the poster shows, so play/pause/reset and one-at-a-time can't be verified at runtime.
- Owner: Backend `data/hero.json` + assets.
- Fix: add 3–5 s muted mp4/webm placeholders (≤ 1 MB, loaded on hover only, as the code does) and fill `video.src`/`type`. Re-run H-06.

### Minor

**m-1. B/A divider clamp 0–100% puts the knob 11 px outside the card (H-07 FAIL)**
- Steps: hover a B/A card, drag far left or right; or focus it and press Home/End.
- Expected: clamp 4–96% (spec §6); the knob stays inside the card.
- Actual: `--pos` reaches 0% and 100%; knob offset −11 px, so half of it is clipped. Home/End also go to 0/100.
- Owner: FE-2 `js/carousel/index.js` (`dragTo` `clamp(..., 0, 100)`, `onKey` Home/End and `clamp(next, 0, 100)`).
- Fix: `const POS_MIN = 4, POS_MAX = 96`, used in all three places.

**m-2. Keyboard focus is lost after resetting the surgeon filter from the chip**
- Steps: select a doctor, Tab to the "Имя ×" chip, press Enter.
- Expected: focus moves to a sensible target (the CTA "Подобрать специалиста" or the location chip).
- Actual: the chip hides itself and `document.activeElement` becomes `<body>`.
- Owner: FE-3 `js/surgeon-menu.js` (`filterChip` click handler).
- Fix: before `select(null)`, if the chip has focus, call `triggers.find(t => t.matches('.cta')).focus()`.

**m-3. The filter chip pushes the chips row off-centre**
- Steps: select "Амир Темирханов" (`1440-filter-amir.png`).
- Expected: the chips row stays centred above the H1.
- Actual: the row keeps its 2-chip box (555–885) and the 3rd chip hangs to the right at x 893–1052, so the group is visibly right-heavy.
- Owner: FE-3 `css/hero.css` (`.hero-chips` / `.hero-chip--filter`).
- Fix: let the row size to its content and centre it (`display:flex; justify-content:center; width:max-content; margin-inline:auto`), or place the filter chip absolutely so the row doesn't shift.

**m-4. Hover panel is 94 px tall (Figma 82); it touches the H1 and its shadow greys part of the headline**
- Steps: hover a card that sits above the H1 (x 359–559, `1440-hover-case7-scripted.png`).
- Expected: panel 200×82 (y 328–410, spec §5.1).
- Actual: 200×94 (y 328–422; 140 with thumbs). The bottom edge reaches the H1 glyph band (~421), and the 18/40 px drop shadow dims "Комплекс".
- Owner: FE-2 `css/carousel.css` (`.cc-panel`, `.cc-lift__shadow`).
- Fix: tighten the panel to 82 px when there are no thumbs (avatar 18 px as in v1, or name without avatar). Keep the shadow within the panel's own box, or lower its spread over the content.

**m-5. Choosing a doctor with no cases dims the whole strip with no feedback**
- Steps: menu → "Рустам Курманбаев" ("Кейсы скоро").
- Expected: no dead state. Either the option is disabled or flagged, or the strip doesn't dim.
- Actual: all 24 cards get `.is-dim` (opacity .35).
- Owner: FE-3 `js/surgeon-menu.js` (selection) / FE-2 `applyFilter`.
- Fix: in `applyFilter`, if the doctor has no cases, skip dimming and show a small "Кейсы скоро" note in the chip. Alternatively, open the doctor's landing for such options.

**m-6. The island morph animates width/height and causes layout shift (CLS 0.013 per toggle)**
- Steps: scroll 0 → 400 → 0 three times with a performance trace running.
- Expected: compositor-only morph (spec: "page never reflows").
- Actual: the trace flags a non-composited animation of `width`/`height` on `.nav__surface`, and `.nav__inner` changes box at once on the class toggle, which is recorded as a layout shift. CLS sums to 0.078 after 6 toggles. The nav FLIP measure costs ≈ 9 ms on the main thread at each toggle.
- Owner: FE-3 `css/nav.css` (`.nav.is-morphing .nav__surface` transition), `js/nav.js`.
- Fix: morph the surface with `transform: scale()` from a fixed-size box (or `clip-path: inset(... round 999px)`, which is composited), and give `.nav__inner` a FLIP transform too (or `contain: layout` on `.nav`).

**m-7. Below 1280 px there is no static fallback (PLAN §1 assumption)**
- Steps: 1024×720.
- Expected: a static hero without effects.
- Actual: all effects run, `min-width:1280px` on the body, and the page scrolls horizontally (scrollWidth 1280).
- Owner: Lead `css/base.css` + FE-1/FE-2 (gate `init` on `matchMedia('(min-width:1280px)')`).
- Fix: add a `(max-width:1279px)` static mode and skip the FX/carousel loops there.

**m-8. Console error on every load: `favicon.ico` 404 (G-02 "0 ошибок в консоли")**
- Owner: Lead `index.html`.
- Fix: add `<link rel="icon" href="assets/icons/logo.svg" type="image/svg+xml">`.

**m-9. Fonts come from the Google Fonts CDN**
- Expected: PLAN §1 says fonts load locally, without a CDN.
- Actual: fonts load from fonts.googleapis.com and fonts.gstatic.com. This adds a third-party dependency and a privacy cost, and the reveal waits up to 1.2 s for them.
- Owner: Lead `index.html`.
- Fix: self-host Jost/Manrope woff2 (latin + cyrillic subsets) with `font-display: swap` and preload the two weights in use.

**m-10. 8 case cards come before the H1 and CTAs in the Tab order**
- Steps: Tab from the page start.
- Actual: logo, 6 links, phone, Связаться, WA, **8 cards**, then the CTAs. The primary CTA is the 19th tab stop.
- Owner: FE-2 / Lead (DOM order of `[data-carousel]` vs content).
- Fix: move the carousel after the content in the DOM (z-index already handles the visual order), or add a "Перейти к кейсам" skip control. Re-check that `elementFromPoint` still hits the cards afterwards.

**m-11. Reveal is incomplete compared with spec §9.5 (H-12)**
- Actual: no bg scale-in at t=0, no statue rise at 150 ms, and the particles/light fade starts about 300 ms before the text reveal (spec: 1400 ms after t0).
- Owner: FE-3 `js/hero.js` (timeline), Lead (bg/statue layers), FE-1 `js/fx/index.js` (wait for `hero:reveal`, add 1400 ms).
- Fix: add `bg` and `statue` entries to `TIMELINE` (both are static layers, so mark them `data-reveal`), and start the FX fade from the `hero:reveal` event.

**m-12. Pixel deviations above 2 px at 1440 (G-03)**
- Measured by best-shift search of our screenshot against `anim-carousel-1713-3971.png`:
  - Chips row is **+6 px** right of the render (ours: location chip 554.7–788.2, rating 786.2–885.2; render ≈ 549–780 / 780–881). Rating chip is 99 px wide vs 101.6 in Figma. "4,9" renders lighter than the bold weight in Figma.
  - Statue is **+5 px** lower (head region best match dy = +5).
  - Menu pill is **392.2** px wide vs 388 (the Jost 13 px fallback). Each link sits about 3 px to the right by the end of the row.
  - Hover panel is +12 px taller (m-4).
- Owners: FE-3 `css/hero.css` (chips), Lead `css/base.css` (statue `bottom`), FE-3 `css/nav.css` (pill; re-check once Futura PT arrives).

**m-13. Several visible cards rendered without images (seen once)**
- Steps: after a series of live viewport changes (2560 → 1024 → 1440 → 1760 → 1300 → 1440), hover a card and swap a thumb.
- Actual: 4 of 7 visible cards showed only the dark placeholder with labels, and the lift was missing from that frame (`1440-transient-blank-cards.png`). This was not reproduced on fresh loads or later attempts. 26 of the 48 strip images are `loading="lazy"` and load only on entering the clipped hero (copy 0 never loads).
- Owner: FE-2 `js/carousel/render.js` (`buildCard` → `eager` only for cards visible at build time; `relayout` → `buildTrack`).
- Fix: load all strip images eagerly with `decoding="async"`. There are only 8 unique URLs, already cached, so it costs 0 extra bytes. Keep lazy only for the panel avatars.

### Polish

- **P-1.** Brightness jump on lift hand-over. The original card sits under the shade layer; the overlay clone does not. Mean RGB goes from (160,119,100) to (175,130,109), about +9%. Fix: apply a matching dim to `.cc-lift__media` that fades out over the 320 ms lift. Owner: FE-2 `css/carousel.css`.
- **P-2.** In `file://` mode content is invisible for 4 s. ES modules are blocked by CORS (as expected); the inline `js-reveal` class then hides all text until the 4 s CSS failsafe. After that the static hero renders without the strip (`file-protocol-1440.png`). Fix: add the `js-reveal` class only if `location.protocol !== 'file:'`, or cut the failsafe to about 1.5 s. Owner: FE-3 `index.html` inline script / `css/hero.css`.
- **P-3.** Lighthouse a11y score is 96. The only failure is the placeholder section text: `#7e7c7a` on `#f6f3f0` is 3.76:1. Owner: Lead `css/base.css`.
- **P-4.** `main.js` imports modules one after another (`await import` in a loop), so `surgeon-menu.js` arrives last. Fix: `Promise.allSettled(MODULES.map(([p]) => import(p)))`, then init in order. Owner: Lead.
- **P-5.** The strip snaps 0.35 px when it stops (`Math.round` on settle); this can show on 1x screens as a 1-px jump of the card edges. Fix: don't round, or round only when `|x − round(x)| < 0.05`. Owner: FE-2.
- **P-6.** At 2560 px wide the 8-case loop (1760 px period) shows the same case twice at once (`2560x1440.png`). This is data/design rather than code: more cases, or wider spacing above 1760 px.

---

## 3. Notes and measurements

- **Load (1440, local):** 51 resources, 530 KB transferred. DOMContentLoaded 155 ms, load 515 ms. LCP 104 ms (bg image); render delay 79 ms. With Fast 4G + 4× CPU: LCP 291 ms, CLS 0.0017 (font swap on the hidden H1).
- **Reveal timeline (cold headless):** the text reveal starts about 1.4 s after navigation because it waits for the fonts; the CTAs are fully in by about 2.4 s.
- **Off-screen and hidden tab:** with scrollY > 720, the rAF calls from `fx/loop.js` and the carousel drop from 60/s to 0, and resume on return. The hidden-tab override also stops the carousel.
- **Live resize** (1440 → 1760 → 1300 → 1440): no errors, the strip is rebuilt and covers the viewport, canvases are re-sized, and the reveal does not replay.
- **Other tabs:** the shared browser had other tabs open (a localhost:5174 copy of this page and a GitHub page). They appear in the traces, and the single 266 ms frame during the scroll test came from tracing start-up and those tabs, not from this page (its own main-thread tasks were all < 50 ms).
