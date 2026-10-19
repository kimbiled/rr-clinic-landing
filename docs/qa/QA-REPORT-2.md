# QA report, round 2: RR Clinic Hero + Navbar (React 19 + TS + Tailwind 4 + antd 6, Vite 8)

Date: 2026-10-20 · Build: `npm run build` (dist served by `npx vite preview --port 5280`), dev server `npx vite --port 5281` for the React/StrictMode checks. Both servers were stopped at the end.
Browser: Chrome via chrome-devtools MCP (an isolated context). Reduced motion was checked in headless Chrome over CDP (puppeteer-core `emulateMediaFeatures`), because the MCP `emulate` tool has no `prefers-reduced-motion` option. **Safari and Firefox were not tested.**
Matrix: 1440×720 (DPR 1 and DPR 2), 1280×720, 1920×1080, 2560×1440, plus live viewport changes 1440 → 1920 → 2560 → 1280 → 1920 → 1440 without reload, and 1024×720 for m-7.
References: `docs/ref/anim-carousel-1713-3971.png`, `docs/ref/hover-amir-1715-4160.png`.
Evidence: screenshots in `docs/qa/round2/`, named in each row.

**How the checks were run.**
- **Scripted pointer:** hover, leave, B/A drag and the neighbour hand-over were run by dispatching `pointerover`/`pointerout`/`pointerdown`/`pointermove`/`pointerup` with `evaluate_script`. Synthetic events don't get real pointer capture, so the drag moves were sent to the lifted card itself.
- **Real input:** all keyboard input (`press_key`: Tab, Shift+Tab, arrows, Home/End, Enter, Escape), plus real clicks on the CTA, nav "Врачи" and a doctor option.
- **Scripted scroll and visibility:** scrolling used `scrollTo`. For the visual diff, the strip was frozen by overriding `document.hidden` and set to the reference offset (card 1 at x = −40).
- **Shared browser:** other agents had pages open in the same browser (ports 5180, 5301, 5302). Every call targeted my page id explicitly.

## Summary

| | Count |
|---|---|
| Round-1 bugs re-checked | 24: **18 Fixed**, 2 Partially fixed (M-3, P-1), 4 Not fixed (M-2 and M-5 client deps, m-7 not in scope of this round, P-2) |
| Of the 19 fixes expected this round | 16 Fixed, 2 Partially fixed (M-3, P-1), 1 Not fixed (P-2) |
| Acceptance (22 IDs) | **14 PASS · 7 PARTIAL · 0 FAIL · 1 NOT TESTED** |
| React-specific checks | 4 / 4 PASS |
| New bugs | 0 Blocker · **1 Major** · 5 Minor · 6 Polish |

---

## 1. Regression of round-1 bugs

| ID | Status | Evidence |
|---|---|---|
| M-1 Card order / doctor mapping | **Fixed** | `hero.json` order is case-1 (Темирханов) · 2 (Тулепбергенова) · 3 (Муса) · 4 (Кодзоева) · 6 (Тулепбергенова) · 7 (Савельев) · 8 (Романовская) · 5 (Аэлита, last). Томирис has been added. With the strip frozen at the reference offset, the card regions match `anim-carousel-1713-3971.png` at best shift dx = dy = 0 for cards 2, 3, 5 and 7 (`round2/1440-idle-aligned.png`). Card 6 differs only by its in-image title (N2-12). |
| M-2 Statue/bg upscaled | Not fixed (client dependency) | `statue.webp` is 1024×572 and renders at 1289×720 (1.26×). At 1920 it renders at 1719×960 (1.68×), at 2560 at 2062×1152 (2.0×), and at DPR 2 at 2.5×. `bg-columns.webp` is 1678×937. |
| M-3 Island hides focus / nav contrast | **Partially fixed** | (a) **Fixed:** the scroll was set to 562 (it settled at 486), then Shift+Tab was pressed onto "Подобрать специалиста". The CTA sits at y 96–156, below the island (12–68), and `elementFromPoint` at its centre hits the CTA. `scroll-padding-top: 96px` is present, plus a `focusin` guard in `Navbar.tsx`. (b) **Not fixed:** white 13 px nav links on the expanded pill measure a **median of 3.78:1** (mean 4.13, p05 3.16), against 2.87 in the Figma render. That is better, but still below 4.5:1. The location/rating chips measure a median of 3.26:1. |
| M-4 Composition breaks above 720 px | **Fixed** | The stage scales as a unit. At 1920×1080 the scale is 1.333 (hero 1920×960, strip top 165 = 124×1.333, statue head over the middle card). At 2560×1440 the scale is 1.6 (hero 2560×1152). Strip, statue and text keep the 1440 relationship (`round2/1920x1080.png`, `round2/2560x1440.png`). Remaining first-screen gaps are covered in N2-5. |
| M-5 No videos | Not fixed (client dependency) | `video: null` for case-2, case-5 and case-8. Hovering shows the poster only, with 0 console errors. |
| m-1 B/A clamp 0–100 % | **Fixed** | A scripted drag far left gives `aria-valuenow` 4 with the knob 2 px inside the left edge. Far right gives 96 with the knob 2 px inside. End → 96 (real key). The drag also maps correctly at scale 1.333: dragging to 25 % of the card width gives 25 (knob centre at 0.250). |
| m-2 Focus lost after chip reset | **Fixed** | Selected Темирханов, Shift+Tab to the chip, Enter (real keys): `activeElement` becomes "Подобрать специалиста". The hidden chip gets `visibility:hidden`, so it is out of the Tab order. |
| m-3 Chips row off-centre | **Fixed** | With the filter chip shown, the group spans 465–965 (centre 715 = column centre − 5 px design offset), via `translateX` with no layout shift (`round2/1440-filter-amir.png`). |
| m-4 Panel 94 px / shadow over H1 | **Fixed** | The panel is 200×82 at y 328–410 (Савельев, 1 case). The H1 box starts at 411. The shadow is clipped to the panel box (`round2/1440-hover-savelyev-scripted.png`). Doctors with 2 cases get the PROPOSED 130 px panel with thumbs, which overlaps the H1 by design (spec §5.3). |
| m-5 Doctor without cases dims strip | **Fixed** | Picked "Рустам Курманбаев" with a real click: 0/24 cards dimmed. The chip reads "Рустам Курманбаев · Кейсы скоро ×", and the live region says "Врач … кейсы скоро появятся". The menu tile also shows "Кейсы скоро" (`round2/1440-filter-no-cases-kurmanbaev.png`). |
| m-6 Island morph CLS | **Fixed** | 0 layout-shift entries over 9 hysteresis steps and 6 full morphs. The surface morph is transform + opacity only. Frame p95 is 17.5 ms during the morphs. |
| m-7 No static fallback < 1280 | Not fixed (not in this round's scope) | At 1024×720: `scrollWidth` 1280 and 120 rAF callbacks/s (both loops running). `useStageScale` measures `clientWidth` 1024 while the hero box is 1280 wide (`body min-width`), so the strip is centred for 1024 and the statue for 1280. |
| m-8 favicon 404 | **Fixed** | 39 requests on load, all 200. `favicon.svg` is served. The console is empty. |
| m-9 Google Fonts CDN | **Fixed** | Jost and Manrope load from `/assets/fonts/*.woff2` (latin + cyrillic), and the Manrope cyrillic subset is preloaded. There are no third-party requests. |
| m-10 Cards before CTAs in Tab order | **Fixed** | Real Tab from the page start: logo, 6 links, phone, Связаться, WA, **CTA primary (11th), CTA secondary (12th)**, then the cards. |
| m-11 Reveal incomplete | **Fixed** | `useHeroReveal` now animates `bg` (t 0, scale 1.04 → 1) and `statue` (t 150, y 16 → 0). Measured reveal t0 = 79 ms after navigation, and both canvases switch to visible at 1482 ms, i.e. **+1403 ms** (spec: 1400). |
| m-12 Pixel deviations > 2 px | **Fixed** | Chips: location 548.7–782.2, rating 780.2–881.2 (101 px vs 101.6). Menu pill 388.0 px. Statue best-shift dy = 0. Panel 82 px. Phone x 1078.8 vs 1077 (+1.8). The subtitle best shift is dx −4, but that is the Jost-for-Futura substitution, not layout. |
| m-13 Lazy strip images / blank cards | **Fixed** | All 48 strip images have `loading="eager"` (0 lazy) and are complete with natural sizes. No blank cards appeared during the live viewport changes. |
| P-1 Brightness jump on hand-over | **Partially fixed** | `.cc-lift__dim` replays the radial vignette. Measured at hand-over (lift transitions slowed to 600 s, left 120 px of the card, clear of the statue): mean RGB (192.6, 141.8, 118.9) → (203.0, 149.4, 125.7), **+5.4 %** (round 1: +9 %). The residual is probably the `.hero__glow` blur (gold-950, blur 200 px) that the strip card sits under and the clone does not (`round2/p1-handover-before-left-after-right.png`). |
| P-2 file:// mode | **Not fixed** (now worse) | `dist/index.html` opened over `file://` is a fully **blank white page**: `#root` has 0 children, and there is no `<noscript>` or static fallback (`round2/file-protocol-1440.png`). Assets use absolute `/assets/...` paths. README does point to `npm run preview`, so this is a dev-only scenario. |
| P-3 Placeholder text contrast | **Fixed** | Lighthouse Accessibility is 100 (the placeholder text is now `#5c5752`). |
| P-4 Sequential module imports | **Fixed** | Not applicable after the migration: one entry chunk plus a lazy `SurgeonMenu` chunk, prefetched on idle. |
| P-5 0.35 px snap on stop | **Fixed** | Code rounds only when \|x − round(x)\| < 0.05 (`motion.ts`). The hover stop settled 4.06 px past entry with no step > 0.71 px over 2761 sampled frames. |
| P-6 Same case twice at 2560 | **Fixed** | Through the scaling: the stage is 1600 px wide at 2560, less than the 1760 px loop period. The 8 visible cards are 8 distinct cases. |

---

## 2. Acceptance checklist (PLAN.md §2), React build

| ID | Result | Evidence |
|---|---|---|
| H-01 Particles | PASS | One shared FX rAF loop: 60 callbacks/s next to the strip's 60/s, in both prod and StrictMode dev. Idle: 181 frames in 3 s, p95 17.3 ms, 0 frames > 20 ms. Off-screen (scrollY 1150): **0 rAF in 2 s**, and back to 60/s on return. Particle backing store: 1440×720 at DPR1, **2880×1440 at DPR 2**, 1920×960 at scale 1.333 and 2560×1152 at scale 1.6, i.e. 1:1 with device px, so sharp. At DPR 2 × scale 1.333 the cap of 2 gives 0.75× (by design). Not measured on an M1. |
| H-02 Light shimmer | PASS | Runs at a 30 fps throttle and pauses with the particles. The backing store is half resolution by design (720×360 at 1440, 960×480 at 1920). Checked by eye only. |
| H-03 Carousel L→R | PASS | **40.00 px/s**, translateX increasing, 0 negative steps. A 46 s sample covered one full wrap at t 4.9 s: x −1760.25 → −3519.58, a frame step of exactly 0.67 px, so seamless. 0 frames > 20 ms. Copies cover −257…2063 at 1920 and −69…2715 at 2560. |
| H-04 Hover pause | PASS | Below 0.02 px/frame at **273 ms** after `pointerover` (scripted), settling 4.06 px past entry. On release outside, the strip is back at 40 px/s within 2.4 s, with no jump. |
| H-05 Doctor card slides up | PASS | Lift −16 px (body y 108). Panel at 328–410 (82 px), or 130 px with thumbs. The lift is portalled into `.hero__overlay`. The neighbour hand-over (scripted) runs `12:leaving → 12:leaving,13:on → 13:on` with **0.00 px strip drift** and never a frame without the card. A pass-through hover of 40 ms creates no lift (80 ms intent). Thumb swap works (`round2/1440-filter-no-cases-kurmanbaev.png`). |
| H-06 Video cases | PARTIAL | No video sources (M-5), so only the poster path is verifiable: 0 errors. |
| H-07 Before/After | PASS | Clamp 4–96 (m-1). ←/→/Shift+→/End were real keys, and `aria-valuenow` updates on both the strip copy and the lift. Releasing outside the card removes the lift, eases the divider back to 50 and resumes the strip. A11y gap: N2-6. |
| H-08 Card above heading | PASS | `elementFromPoint` hit the card at all **34/34** probe points over the 7 visible cards, including the card behind the statue (x 563). The lift and panel sit above the chips/H1, and the H1 does not catch the pointer. |
| H-09 Text reveal | PASS | WAAPI with `fill: backwards`, transform + opacity only. The `rr-reveal` pre-state is dropped in the same frame. CLS 0.0037 on load (from the content block at 128 ms, while it is still hidden). The reveal does not replay on live viewport changes. |
| H-10 Surgeon menu | PARTIAL | Working: antd Modal (`aria-modal`), 8 doctors. Opens from the CTA and nav "Врачи" with real clicks. Arrow keys rove (→, ↓ to Амир with a visible gold ring, `round2/1440-surgeon-menu-keyboard-focus.png`), and Enter selects. 18/24 cards dim with a gold hairline on the 6 matches. Esc closes, and focus returns to the trigger (CTA, then "Врачи"). "Сбросить" and the chip reset work, and so does "Кейсы скоро". **Fails:** the focus trap leaks in both directions (**N2-1**), and the first open while the lazy chunk is still loading gives no feedback for 4.6 s on Slow 3G (**N2-3**). |
| H-11 CTA light | PASS | `rr-cta-glint-idle` runs (6 s, infinite). The focus ring is visible (`round2/1440-filter-amir.png`). No layout shift. |
| H-12 Frame reference | PARTIAL | No frame recording exists, so the ±50 ms overlay check is impossible. The code timeline matches spec §9.5 (bg 0, statue 150, nav 250, chips 450, lines 550/650, subtitle 820, CTAs 950/1030), and FX measured +1403 ms. |
| H-13 Reduced motion | PASS | Headless Chrome with CDP `prefers-reduced-motion: reduce`: html has no `rr-reveal`, and H1/CTA are at opacity 1 from the start. **0 rAF in 2 s.** The strip is static with the first case at x = 24. Canvases show one static frame at opacity 1. The hover lift appears 98 ms after `pointerover` (80 ms intent) with transitions at 0 s, and the panel is fully shown. Island swap is a single 150 ms opacity animation. Leftovers: N2-10 (`round2/1440-reduced-motion.png`, `round2/1440-reduced-motion-hover.png`). |
| H-14 Hero data | PARTIAL | `hero.json` order and mapping are fixed (M-1), with unconfirmed items recorded in `_meta.notes`. M-2 and M-5 remain open. |
| N-01 Navbar expanded | PASS | Logo (101, 24, 35×32), pill (165, 20) 388×40, phone x 1078.8, Связаться x 1214.8 (88×40), WA (1299, 20). |
| N-02 Island collapse | PASS | 79 → expanded, 81 → island, 60/41 → island, 40 → expanded, 120 → island, 30 → expanded, 100 → island. Island at (405, 12) 631×56, phone `visibility:hidden`. CLS 0. Scroll is read in rAF (passive listener). |
| N-03 Back at top | PASS | `position:fixed`, no content jump, 0 layout shifts. |
| N-04 Navbar a11y | PARTIAL | Keyboard order and gold `:focus-visible` work in both states, and focus is never under the island (M-3a). **Contrast below 4.5:1** (M-3b): pill links at a median of 3.78:1. Both triggers report `aria-expanded="true"` at once (N2-8). |
| N-05 Island reference | NOT TESTED | Designer item; the reference landing has not been received. |
| G-01 Skeleton/tokens | PASS | Tailwind `@theme` tokens, the z-scale in `:root`, local fonts. Layer order `theme, base, antd, components, utilities`. StrictMode-safe engines (see §3). |
| G-02 Performance | PARTIAL | Console clean, 0 errors, 0 404s, 0 long frames over 46 s, 60 fps with the menu open. Local: FCP 0.04 s DCL, **LCP 1.19 s** (a case image; LCP now waits for the reveal/intro). **Fast 4G + 4× CPU: FCP 0.85 s, LCP 2.15 s** (round 1: 0.29 s), with one 137 ms long task (React boot). Slow 3G: FCP 9.6 s, LCP 14.3 s. First screen **628 KB transferred**: JS 196 KB (main 162 KB gz / **488 KB raw**, SurgeonMenu 32 KB gz, prefetched), images 344 KB, fonts 77 KB, CSS 11 KB. All are within PLAN budgets (LCP ≤ 2.5 s, ≤ 2 MB), but the margin is thin; see N2-4. Safari not tested. |
| G-03 Figma diff | PARTIAL | At 1440 (best-shift search against the reference): logo, contact/WA, chips, H1, CTAs, statue and cards 2/3/5/7 all at 0/0. Menu pill dx +2 (text), phone +4 (font), subtitle −4 (font substitution). The H1 box is 96 px tall vs 88 (Manrope line box). Card 6 shows an in-image title that Figma hides (N2-12). No Figma frames exist for 1280 or 1920, so those were checked for layout only. |

### React-specific checks

| Check | Result | Evidence |
|---|---|---|
| StrictMode: no duplicate rAF loops | PASS | Dev server, `requestAnimationFrame` patched to count by callback identity: exactly **2 distinct callbacks at 120/2 s each**, the FX `loop.ts step` and `StripMotion.step`. One `.cc-root`, 2 canvases. (The `useState` initialiser builds a second `CarouselController` under StrictMode, but only the connected one runs.) |
| No memory growth | PASS | Prod, heap snapshots before and after **20 hover cycles (with thumb swap) and 10 menu open/close cycles**: retained self size +951 KB, of which ≈ 900 KB is V8 code (`InstructionStream`, `TrustedByteArray`, `FeedbackVector`) from JIT warm-up. 0 → 0 detached DOM nodes. `FiberNode` 1164 → 1164, `CarouselController` 1 → 1, DOM nodes 448 → 448. `usedJSHeapSize` 49.3 → 51.8 MB before GC. |
| No React warnings (dev console) | PASS | 0 warn/error messages after load, 5 hover/thumb cycles, 2 keyboard selections in the menu and an Esc close. Only Vite/HMR debug and the React DevTools info line. |
| antd styles don't override the hero | PASS | All antd component CSS is emitted inside `@layer antd` (Modal, Button, Tag, Avatar, Tooltip, wave, icons). Unlayered antd CSS is limited to `.css-var-*`-scoped custom properties and `@keyframes`. Tailwind wins on antd parts: "Сбросить" `.ant-btn` is bg white/10, h 36, border 0; `.ant-modal-close` is bg white/20, 48×48, top 30; the modal container is transparent with no shadow or radius; `.ant-tag` is transparent at padding 0. Hero body/H1 fonts and the nav link colour are unaffected. |

### Responsiveness inside the desktop scope

| Size | Result |
|---|---|
| 1280×720 | Scale 1 (clamped), stage 1280 wide, statue centred (−4…1285). Cards cover −43…1477. No horizontal scroll (`round2/1280x720.png`). |
| 1440×720 / DPR 2 | Reference composition. Particles 2880×1440 at DPR 2. |
| 1920×1080 | Scale 1.333, composition preserved. 120 px of the light placeholder is visible below the hero, and the navbar is not scaled (N2-5). |
| 2560×1440 | Scale 1.6 (clamp), composition preserved, 288 px of placeholder below (N2-5). |
| Live changes 1440 → 1920 → 2560 → 1280 → 1920 → 1440 | 0 console messages. The reveal did not replay. Strip coverage, canvases and lifts were rebuilt. A B/A drag at 1.333 maps correctly. |

---

## 3. New bugs

### Blocker
None.

### Major

**N2-1. Surgeon menu focus trap leaks to the page behind the modal (H-10 regression)**
- Steps:
  1. Open the menu (CTA or nav "Врачи"; real click).
  2. **Forward:** Tab through the dialog. Its order is options → "Помощь с выбором" → "Написать в WhatsApp" → Tab.
  3. **Backward:** from the first option, Shift+Tab ×6 to "Закрыть меню", then Shift+Tab again.
- Expected: focus wraps inside the `aria-modal` dialog (spec §7.2: "focus trap"; round 1: PASS).
- Actual:
  - Forward: focus lands on the **page logo "RR Clinic — на главную" behind the modal**, and only the next Tab returns it to "Закрыть меню".
  - Backward: focus lands on the **last case card "Кейс: 1,5 месяца после операции"** behind the modal before being pulled back to "Написать в WhatsApp". That focus runs the carousel's `onFocusIn`, which lifts the card and glides the strip.
  - Screen readers announce the background elements, and sighted keyboard users lose the focus ring for one step.
- Owner: `src/components/surgeon-menu/SurgeonMenu.tsx` (the Modal config; the `modalRender` wrapper `<div className="contents">` sits around antd's panel and probably defeats its tab sentinels).
- Suggested fix: while the menu is open, set `inert` on the app root. Toggle `document.getElementById('root')!.inert = surgeonMenuOpen` in an effect, or render the page under a wrapper that receives `inert`. That makes the leak impossible regardless of antd internals. Alternatively, drop the `modalRender` wrapper and handle the backdrop click via `onClick` on `classNames.wrapper`, then re-test antd's `focusable.trap`.

### Minor

**N2-2. Keyboard focus on the first case card whips the strip up to ~1,400 px in 520 ms**
- Steps: let the strip run until card 1's focusable copy (k = 8) is off-screen left (`x + 1760 < −600`). Focus "Смотреть работы" and press Tab (real key).
- Expected: the focused case comes into view calmly (spec §9.3: "focus = hover"; WCAG 2.3.3 intent).
- Actual: `ensureVisible` tweens x −2998 → −1739.5 (**1,258 px over 27 frames, peak 124 px/frame ≈ 7,400 px/s**), so about six cards blur past. Only copy #1 (k 8–15) is focusable, and it can sit anywhere in [−1760, 0).
- Owner: `src/components/carousel/controller.ts` (`onFocusIn`), `src/components/carousel/motion.ts` (`ensureVisible`), `src/components/carousel/CasesCarousel.tsx` (`primary` copy choice).
- Suggested fix: make the tabbable copy the one nearest the viewport. Recompute `primary` per case on wrap or at focus time, and move focus to the visible duplicate (`k ± N`) in `onFocusIn` before calling `ensureVisible`. Alternatively, cap the glide at one pitch and otherwise jump with a short crossfade.

**N2-3. First menu open while the lazy chunk is still loading gives no feedback**
- Steps: throttle the network to Slow 3G, hard reload, and press "Подобрать специалиста" as soon as the hero shows (scripted `click()` at ≈ 17 s, while the `SurgeonMenu` chunk was in flight from 9.5 s to 21.7 s).
- Expected: immediate feedback (a busy state or skeleton), and `aria-expanded` that reflects what is on screen.
- Actual: **4.6 s with nothing on screen.** The CTA reports `aria-expanded="true"` the whole time with no `aria-busy`, and the cursor stays `pointer`. Then the menu opens and focuses the first option (correct). Two causes: the prefetch waits for `requestIdleCallback` (timeout 4000), which on Slow 3G started 9.5 s after navigation, and `Suspense fallback={null}`.
- Owner: `src/App.tsx` (`DeferredSurgeonMenu`), the trigger buttons in `src/components/hero/HeroContent.tsx` / `CtaButton.tsx` and `src/components/nav/Navbar.tsx`.
- Suggested fix:
  - Start `loadSurgeonMenu()` on `pointerenter`/`focus` of either trigger, in addition to idle.
  - Use a lightweight fallback: the same backdrop colour/blur, plus a spinner with `role="status"` "Загрузка…".
  - Set `aria-busy="true"` on the trigger until the chunk resolves.

**N2-4. The main bundle is 488 KB raw / 162 KB gz before first paint; LCP under throttling went from 0.29 s to 2.15 s**
- Steps: `npm run build`. Load under Fast 4G + 4× CPU.
- Expected: the hero paints quickly; PLAN LCP ≤ 2.5 s with headroom (round 1 measured 0.29 s on the same profile).
- Actual:
  - FCP is 0.85 s and LCP **2.15 s**, with one 137 ms boot long task. `#root` is empty until JS runs (blank page without JS; see also P-2).
  - The main chunk contains antd `ConfigProvider` + cssinjs + the **full `ru_RU` locale (DatePicker, Calendar, Pagination, Transfer, Upload strings)** + `Tooltip`/rc-trigger, although the first paint uses no antd UI except a hover-only tooltip on the WhatsApp button.
- Owner: `src/main.tsx` (ConfigProvider/locale at root), `src/components/nav/Navbar.tsx` (antd `Tooltip`).
- Suggested fix:
  - Replace the navbar `Tooltip` with a CSS/`title` tooltip.
  - Move `ConfigProvider`/`StyleProvider` + `ru_RU` into the lazy `SurgeonMenu` chunk (wrap `<SurgeonMenu/>` there).
  - Prerender the static hero HTML (H1, chips, CTAs, bg/statue `<img>`) at build time so text and LCP paint before hydration.
  - Target a main chunk ≤ 80 KB gz.

**N2-5. At 16:9 desktops the hero does not fill the first screen, and the navbar does not scale with the stage**
- Steps: open at 1920×1080 and 2560×1440.
- Expected: a first screen fully in the hero look, with nav proportions consistent with the scaled composition.
- Actual:
  - The hero is `720 × scale`: 960 px at 1080 and 1152 px at 1440. The light `#f6f3f0` placeholder therefore fills the bottom **120 px (11 %)** and **288 px (20 %)** of the first screen (`round2/1920x1080.png`, `round2/2560x1440.png`).
  - The navbar stays at 1440 px metrics (logo at x 101, pill 388×40) while the hero content is ×1.33 / ×1.6, so the nav reads undersized and the nav-to-strip gap grows from 64 to 105 / 138 px.
- Owner: `src/hooks/useStageScale.ts`, `src/styles/index.css` (`.hero`, `.hero__stage`), `src/components/nav/Navbar.tsx` + designer.
- Suggested fix (designer to choose):
  - Make `.hero` `min-height: 100vh` and let `.hero__bg` and `.hero__shade` bleed to the full hero height while the stage stays anchored. Either vertically centre the stage, or bottom-anchor the shade so the extra band reads as the brown overlay.
  - Scale the nav row by the same `--stage-scale` (padding, height, font size), or cap it at 1.25.

**N2-6. The before/after `role="slider"` is not focusable; keyboard focus sits on the parent group**
- Steps: Tab to a B/A card and inspect `document.activeElement`.
- Expected: the element with `role="slider"` receives focus, so assistive tech slider commands and announcements of `aria-valuenow` changes work (ARIA APG slider).
- Actual: focus is on `div[role=group][tabindex=0]`, and the knob has `role="slider"` with `tabIndex = -1`. Arrow keys work only because the group handles them. Value changes are not announced, because the focused element is not the slider. Lighthouse does not flag this.
- Owner: `src/components/carousel/BeforeAfter.tsx`, `src/components/carousel/CaseCard.tsx`.
- Suggested fix: put `role="slider"` + `aria-value*` on the focusable card element of B/A cases (keep the group label as `aria-roledescription`/`aria-label`). Alternatively, make the knob the tab stop and keep the card as a non-focusable group.

### Polish

- **N2-7.** The doctor panel is 96 % opaque, so the H1 glyphs ("Ком…") ghost through the 130 px panel (`round2/panel-h1-bleed-zoom.png`). Spec §5.4 says "full opaque background". Owner: `src/styles/index.css` (`--color-panel`), `src/components/carousel/DoctorPanel.tsx`. Fix: use an opaque `#2b1f12` (or keep .96 on top of an opaque underlay).
- **N2-8.** Both triggers ("Врачи" and "Подобрать специалиста") report `aria-expanded="true"` and `aria-controls` whichever one opened the menu. Owner: `src/components/nav/Navbar.tsx`, `src/components/hero/HeroContent.tsx`. Fix: expose `lastTrigger` from `menuTrigger.ts` and set `aria-expanded` only on that element.
- **N2-9.** While the full-screen menu is open (backdrop blur 24 px), the FX loop and the strip keep running at 60 rAF/s each behind it. This is wasted GPU work for the backdrop re-blur (frame p95 was still 17.5 ms on this machine). Owner: `src/components/fx/engine/fx.ts`, `src/components/carousel/controller.ts`. Fix: pause both while `surgeonMenuOpen`, the same way as for a hidden tab.
- **N2-10.** Reduced-motion leftovers in the doctor panel: the "Все кейсы →" arrow keeps `transition: transform 200ms` (3 px nudge), and the thumbs keep an opacity transition. Owner: `src/components/carousel/DoctorPanel.tsx`. Fix: add `motion-reduce:transition-none` to both.
- **N2-11.** Build hygiene: `public/assets/.ruff_cache/` is copied into `dist/assets/.ruff_cache/`. Also, `/robots.txt` returns the SPA `index.html` (Lighthouse SEO 92: "robots.txt is not valid"). Owner: lead (`public/`). Fix: delete the cache folder and add `.ruff_cache` to `.gitignore`; add `public/robots.txt`.
- **N2-12.** Card titles differ from the idle frame. Card 6 (case-7) shows the in-image title "Подтяжка груди с круглыми имплантами", which Figma frame 1713:3971 does not show on that card (region error 34 vs ≤ 11 for the other cards). Card 1's title is one line where Figma wraps "Увеличение / молочных желез" to two. Owner: `src/data/hero.json` (`showTitle`), `src/components/carousel/BeforeAfter.tsx` (title width). Fix: set `showTitle:false` on case-7 to match the idle frame (keep it in the panel), and constrain the title width to ≈ 120 px.

---

## 4. Notes

- **Not reproduced:** once, after a real click on nav "Врачи" followed by an a11y snapshot, the menu closed by itself and focus returned to "Врачи". Three later attempts with the same sequence did not reproduce it, so it is not filed. Watch for it in manual testing.
- **Tools:** `elementFromPoint`, the visibility override and the frozen-strip visual diff are scripted. Every keyboard result above came from real `press_key` input.
- **Scratch files:** the heap snapshots, the Lighthouse report (`report.html`/`.json`) and the reduced-motion script (`rm.mjs`) are in the session scratchpad, not in the repo.
