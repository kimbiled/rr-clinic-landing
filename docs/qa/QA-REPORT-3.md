# QA report, round 3 (final): RR Clinic landing (React 19 + TS + Tailwind 4 + antd 6, Vite 8)

Date: 2026-10-20 · Build: `npm run build` (clean, 274 ms), served by `npx vite preview --port 5580 --strictPort`. The server was stopped at the end.
Browser: Chrome via chrome-devtools MCP in an isolated context, DPR 1 unless noted. **Safari and Firefox were not tested.**
Matrix: 1440×720, 1440×900, 1512×982 (MacBook Pro 14" default, added), 1920×1080, 2560×1440.
References: `docs/ref/sections/01-stats.png` … `04-team.png` and `docs/ref/main-page-1440.png` for the new sections; `docs/ref/anim-carousel-1713-3971.png` and `hover-amir-1715-4160.png` for the hero.
Evidence: `docs/qa/round3/` (file names are given in each row). Partial files from the interrupted attempt were deleted and regenerated.

**How the checks were run**
- **Real input:**
  - Keyboard (`press_key`): Tab, Shift+Tab, Enter, Escape and arrows in the menu, the Team tabs, the Team scroller, the case strip and the B/A slider.
  - Clicks: the hero CTA, Team "Next", a Team tab and "Подробнее" (Амир).
  - Hover: About CTAs.
- **Scripted (`evaluate_script`):**
  - Hover lift and B/A drag on the moving strip (synthetic `pointerover`/`pointerdown`/`pointermove`/`pointerup`).
  - Team mouse drag (synthetic `PointerEvent`s with `pointerType: 'mouse'`).
  - Scrolling (`scrollTo`) for reveals and anchors.
  - The rAF counter (`requestAnimationFrame` wrapped by an init script).
  - CLS/LCP `PerformanceObserver`s and resource timing.
- **Visual diff:** element screenshots at 1440×900 and DPR 1 vs the 1:1 crops. The sizes match exactly, so no rescale was needed. Mean absolute error and best-shift search use a Pillow script; bounding boxes come from thresholded crops. Composites: `round3/1440-0N-*-ref-top-ours-bottom.png`.

## Summary

| | Count |
|---|---|
| Round-2 bugs re-checked (N2-1…N2-12) | **10 Fixed**, **2 Partial** (N2-4, N2-5), 0 Not fixed |
| New sections | 4/4 match Figma within ±1–4 px; all interactive checks pass except the a11y items below |
| New bugs | **0 Blocker · 2 Major · 5 Minor · 4 Polish** |
| Console | Clean: 0 errors, 0 warnings across load, full scroll, tab switches, and menu open/close |

**Verdict: demo-ready at 1440×720 and 16:9 screens, with caveats.** Before showing the page on a 16:10 laptop (MacBook), fix R3-2: the first screen there ends with the stats figures cut in half. R3-1 is a budget/architecture issue with no visible symptom. LCP is fine.

## 1. Regression: N2-1…N2-12

| Bug | Status | Evidence |
|---|---|---|
| N2-1 Focus trap leaks behind the modal | **Fixed** | `#root.inert = true` while the menu is open. Real keys: 7× Tab + 5× Shift+Tab gave 12/12 `focusin` events inside `[role=dialog]`, with a clean wrap "Написать в WhatsApp" ↔ "Закрыть меню" in both directions. Esc closes the menu, `inert` is cleared and focus returns to "Подобрать специалиста". |
| N2-2 Strip whip on first-card focus | **Fixed** | Waited until the tabbable copy of case 1 was at x = −1734. A real Tab from "Смотреть работы" put the card at x = 152 on the first frame (an invisible whole-period jump), and it then glided 5 px in 1.5 s (max 1 px/frame). Before the fix: 1,258 px in 520 ms. |
| N2-3 No feedback while the menu chunk loads | **Fixed** (code-verified) | `SurgeonMenuFallback` renders a dark-glass backdrop with `role="status"` "Загрузка…" and sets `inert`. Triggers get `aria-busy` until the chunk loads, and they prefetch on `pointerenter`/`focus` (`menuTrigger.ts:79-81`). Not re-run on Slow 3G this round. |
| N2-4 Main bundle / throttled LCP | **Partial** | Main chunk **309 KB raw / 99.8 KB gz** (was 488/162). antd is split into `AntdProvider` (68 KB gz). **LCP on Fast 4G + 4× CPU: 0.72 s** (was 2.15 s); 0.20 s unthrottled. Still open: the ≤ 80 KB gz target, prerendered hero HTML (`#root` is still empty in `index.html`), and antd is still downloaded at boot (**R3-1**). |
| N2-5 Hero does not fill 16:9 / nav does not scale | **Partial** | Hero = viewport at 1440×720 (720), 1920×1080 (1080) and 2560×1440 (1440): no light band (`round3/1920x1080-first-screen.png`, `2560x1440-first-screen.jpeg`). Not at 16:10 (**R3-2**). The navbar still uses 1440 metrics at every size (logo x 101, pill 388×40 at 1920 and 2560), so it reads small next to a ×1.5 / ×2 hero. |
| N2-6 B/A slider not focusable | **Fixed** | The focused card itself is `role="slider"`, `aria-roledescription="сравнение до и после"`, min 4 / max 96. A real ArrowRight changes `aria-valuenow` 50 → 55 and `aria-valuetext` to "До 55%, после 45%". |
| N2-7 Panel 96 % opaque | **Fixed** | The panel uses `bg-[#2b1f12]`; computed background `rgb(43, 31, 18)` with no alpha (`round3/1440x720-hover-lift-scripted.png`). |
| N2-8 Both triggers `aria-expanded` | **Fixed** | Opened from the CTA: CTA `true`, "Врачи" `false`. After Esc, both are `false`. |
| N2-9 FX + strip run behind the open menu | **Fixed** | **0 rAF callbacks in 2 s** with the menu open, and 120/s again after closing (`fx.setPaused`, `ctrl.setMenuOpen`). |
| N2-10 Reduced-motion leftovers in the panel | **Fixed** (code) | `motion-reduce:transition-none` on the thumbs and the "Все кейсы →" arrow (`DoctorPanel.tsx:61,76`). |
| N2-11 `.ruff_cache` in dist / robots.txt | **Fixed** | No `.ruff_cache` in `dist/`. `dist/robots.txt` contains `User-agent: * / Allow: /`. Lighthouse SEO is **100** (was 92). |
| N2-12 Card titles vs idle frame | **Fixed** | `case-7` has `showTitle:false`. The card-1 title is `w-[108px] line-clamp-2` and wraps to "Увеличение / молочных желез" as in Figma (`round3/1440x720-hero-ref-top-ours-bottom.png`). |

## 2. New sections

Positions at 1440×720 match Figma exactly: stats y 720, h 148 · about y 868, h 731 · trust y 1599, h 314 · team y 1913, h 1011. At 1440×900 the same offsets are +144 because the hero is 864 tall.

### Visual diff at 1440 (Futura PT)

| Section | Size ours / ref | Mean abs err (best shift) | Findings |
|---|---|---|---|
| StatsBand | 1440×148 / 1440×148 | 3.09 (2.2 at dy −1) | Labels match to the pixel (x 269/506/745/983). Figures "15" and "1000+" are shifted **+4 px**, and "15" is 38 px wide vs 33 (tabular figures, R3-8). "4.9" and "50+" match within 1 px. `round3/1440-01-stats-ref-top-ours-bottom.png` |
| About `#about` | 1440×731 / 1440×731 | 3.23 (0/0) | H2 lines within ±1–2 px (x 103, widths 408/334/335 vs 406/333/334). List, photo, caption and CTAs match within 1 px. `round3/1440-02-about-ref-top-ours-bottom.png` |
| Trust `#trust` | 1440×314 / 1440×314 | 5.36 (3.66 at dy −1) | H2 and lines 1–2 match within 1 px. Line 3 breaks differently: Figma runs points 3 and 4 into one line, while ours renders them as two list items (R3-9, designer to confirm). `round3/1440-03-trust-ref-top-ours-bottom.png` |
| Team `#doctors` | 1440×1011 / 1440×1010 | 1.74 (0/0) | Header, Segmented capsule (587 px: 190/200/179), subtitle, cards (232 px, pitch 252, x 132…) and controls all match. The only difference is the "→" glyph vs Figma's arrow. `round3/1440-04-team-ref-top-ours-bottom.png` |

At 1920×1080 the sections are centred in a 1440 column. The Team card row bleeds to the right edge by design, and nothing overflows (`round3/1920x1080-full-page.jpeg`). Fonts: Futura PT 400/500 and Manrope 400–500 are all `loaded`, and there are no Jost requests or references in `dist/`.

### Behaviour

| Check | Result | Evidence / notes |
|---|---|---|
| Scroll reveals (About, Trust, Team) | PASS | `data-rv` goes `out → in` while scrolling. A fade plus 16 px `translate` causes no layout shift (CLS 0 during a full scroll). A deep link to `/#doctors` lands with the section top at 96 and the content revealed. |
| Stats count-up: final values | PASS | Visible `15 · 1000+ · 4.9 · 50+`. The `sr-only` copy has the final values. Item widths stay at 190 px throughout, so CLS is 0. |
| Stats count-up: is it seen? | **FAIL (R3-3)** | The band is already `data-rv="in"` at load at 1440×720, 1440×900 and 1920×1080, so the count finishes before the user scrolls to it. |
| Team tabs (antd Segmented) | PASS, a11y gap | Real click and real ←/→ switch tabs. Section height stays at 1011 on every tab, and the capsule stays at 587 px. No visible keyboard focus indicator (R3-4a). |
| Team prev/next + disabled states | PASS, a11y gap | Real click on Next, then Next ×5: scrollLeft 252 → 504 → 756 → 820. Next becomes disabled at the end, and Prev is disabled at 0. Focus drops to `<body>` when the focused button becomes disabled (R3-4b). |
| Team keyboard on the scroller | PASS | The `role=region` carousel is focusable with a gold ring, and ArrowRight scrolls 252. Tab into the "Подробнее" links scrolls the card into view natively. |
| Team drag (scripted) | PASS | A 300 px mouse drag gives `is-dragging`, then a snap to 252 on release. The trailing click on a link is swallowed. |
| "Подробнее" (Амир, real click) | PASS, a11y gap | Smooth-scrolls to the hero, the "Амир Темирханов ×" chip appears, and the other cases dim (`round3/1440-team-more-amir-filter.png`). Focus stays on the off-screen Team link (R3-7). Курманбаев and Чатинян have no cases, so their links go to `#doctors`, which just jumps to the section top (R3-5). |
| Empty tabs | PASS | "Операционная бригада" / "Палатные медсестры": ghost cards, a `role="status"` note ("Скоро здесь появится команда"), both controls disabled, and no height change (`round3/1440-team-empty-tab.png`). |
| About CTAs | PASS, but "Лицензии" is dead | Hover shows the arrow and a lift. Focus shows a gold double ring (`round3/1440-about-ctas-hover-focus.png`). "Узнать больше" → `#trust` (OK). "Лицензии" → `#licenses`, which does not exist (R3-5). |

## 3. Whole page

### Metrics

| Metric | Value |
|---|---|
| Lighthouse desktop (navigation) | **Accessibility 96 · Best Practices 100 · SEO 100.** Performance: the MCP Lighthouse tool excludes that category, so a trace was used instead (next rows). The failing a11y audit is `color-contrast` (24 nodes, R3-6). |
| LCP / CLS, unthrottled (1440×900) | **LCP 203 ms** (`bg-columns.webp`; render delay 187 ms) · **CLS 0.00** |
| LCP / CLS, Fast 4G + 4× CPU | **LCP 720 ms** (load delay 179, load 182, render delay 356) · **CLS 0.00**. Only one shift was observed: 0.00037 on `.rr-chips` at the font swap. |
| First load, cold, 1440×900, no interaction | ≈ **689 KB** transferred: JS **208 KB** gz (main 99.2 + **AntdProvider 68.2 + SurgeonMenu 32.8 + Team 8.0**), CSS 14.8 KB, fonts 89.3 KB (4 woff2), images 376 KB. Round 2 was 628 KB. |
| antd gating | **FAIL (R3-1).** `Team` + `AntdProvider` are requested at **44 ms** (local) / **469 ms** (Fast 4G, before LCP) while Team is 1,150 px below the fold. `SurgeonMenu` is idle-prefetched at about 190 ms. |
| Fonts | Futura PT 400 (preloaded) and 500 (CSS-discovered at 488 ms on Fast 4G), plus Manrope cyrillic (preloaded) and latin. All four are loaded by 1.15 s throttled. `font-display: swap`, so there is no FOIT, and the swap shift is 0.0004. **No Jost.** |
| Console | Clean (checked after a full scroll, a tab switch, and menu open/close) |
| Nav anchors | `#about`, `#trust` and `#doctors` land at section top = **96 px**, with the island bottom at about 80, so nothing is hidden under the island. `#cases` stops at 360 because the page ends. `#services`, `#prices`, `#contacts` and `#licenses` do not exist (R3-5). |
| Island over light sections | Legible: dark glass with white text over white About/Team, and an active dot under "О клинике" (`round3/1440-about-ctas-hover-focus.png`, `1440-team-empty-tab.png`). The M-3b contrast is unchanged (known). |

### Hero matrix

| Viewport | Scale | Hero / viewport | Composition | Evidence |
|---|---|---|---|---|
| 1440×720 | 1 | 720 / 720 | Chips, H1, subtitle, CTAs and the strip (y 124–344, 200 px cards, pitch 220) match `anim-carousel-1713-3971` at 0/0. The 8 px chip and contact gaps are intended. | `1440x720-first-screen.png`, `1440x720-hero-ref-top-ours-bottom.png` |
| 1440×900 | 1.2 (capped by vw/1200) | **864 / 900** | Holds. A 36 px gold band shows below (R3-2). | `1440x900-first-screen.png` (DPR 2) |
| 1512×982 | 1.26 (cap) | **907 / 982** | Holds, but a 75 px band shows the stats figures **cut at the fold** (R3-2). | `1512x982-first-screen.jpeg` |
| 1920×1080 | 1.5 | 1080 / 1080 | Holds; the navbar is unscaled (N2-5). | `1920x1080-first-screen.png` |
| 2560×1440 | 2 | 1440 / 1440 | Holds; the navbar is tiny relative to the hero (N2-5). | `2560x1440-first-screen.jpeg` |

Spot checks:
- **Hover lift (scripted):** the card lifts and the opaque panel appears with "Омоложение лица · Бауржан Муса" (`1440x720-hover-lift-scripted.png`).
- **B/A drag (scripted):** the first synthetic drag moved the lifted divider to 20 % (release at +40 px). Repeated synthetic drags were inconclusive because there is no real pointer capture. This is not counted as a bug, since keyboard B/A works.
- **Menu:** the focus trap passes (N2-1).
- **Filter:** works via the menu and via Team "Подробнее".

Reference note: the hero in `docs/ref/main-page-1440.png` differs from frame 1713:3971 (smaller 165 px cards with the strip at y 165, and a smaller H1). The implementation follows 1713:3971 (R3-11).

## 4. New bugs

### Major

**R3-1. antd and the Team chunk download at boot, before LCP, regardless of scroll position**
- Steps: cold load at 1440×900, with no scrolling and no interaction.
- Expected: no antd until the menu opens (or its trigger is hovered or focused) or Team nears the viewport.
- Actual:
  - `Team-*.js` (8 KB gz) and `AntdProvider-*.js` (**68 KB gz / 191 KB raw**) start at 44 ms (on Fast 4G + 4× CPU: 469 ms, before LCP at 720 ms). They compete with `futura-pt-medium.woff2`, which starts after them at 488 ms.
  - `SurgeonMenu-*.js` (33 KB gz) is also idle-prefetched at about 190 ms.
  - Together that is **109 KB gz of JS not needed for the first screen.**
  - Cause: `React.lazy` fetches as soon as `<Team/>` renders, and App renders it immediately inside `<Suspense>`.
- Owner: `src/App.tsx` (Team mount and the `DeferredSurgeonMenu` idle prefetch).
- Suggested fix:
  - Keep `TEAM_FALLBACK` and mount `<Team/>` only when an `IntersectionObserver` on the fallback fires with `rootMargin: '1200px 0px'`. Also mount on `hashchange` to `#doctors`, or when the initial hash is `#doctors`.
  - Drop the idle prefetch, or delay it until after `load` plus the first scroll or pointer move. The hover/focus prefetch on the triggers already covers the menu.
  - Optionally add `<link rel="preload">` for `futura-pt-medium.woff2`, which is used above the fold.

**R3-2. The hero does not fill the first screen on 16:10 desktops; at 1512×982 the stats figures are cut at the fold**
- Steps: open at 1440×900 or 1512×982 (MacBook Pro 14" default). By the formula, 1728×1117 is about 80 px.
- Expected: the hero fills the first screen (this round's requirement).
- Actual:
  - The hero is `720 × scale`, and the scale is capped at `vw/1200`. That gives 864/900 (a 36 px gold band) and 907/982 (75 px).
  - At 1512×982 the tops of "15 · 1000+ · 4.9 · 50+" are sliced by the fold (`round3/1512x982-first-screen.jpeg`). The count-up also plays there half-hidden.
- Owner: `src/styles/index.css` (`.hero`, `.hero__bg`, `.hero__shade`), `src/hooks/useStageScale.ts`.
- Suggested fix:
  - Keep the cap, but make `.hero` `min-height: 100svh`.
  - Let the background and the bottom shade extend to the full hero height while the stage stays anchored at the top.
  - Optionally centre the stage vertically within the extra space (≤ 80 px). The stats band then starts exactly at the fold.

### Minor

**R3-3. The stats count-up finishes before anyone sees it**
- Steps: load at 1440×720, 1440×900 or 1920×1080, wait 2 s, then scroll down.
- Expected: the figures count up when the band comes into view.
- Actual: `useInView({ rootMargin: '0px' })` with `threshold 0` fires on load, because the band is edge-adjacent or 36 px into the viewport. The band is `in` at load, and the values are final before the scroll.
- Owner: `src/components/sections/StatsBand.tsx`.
- Suggested fix: use `threshold: 0.6`, or the shared default `rootMargin: '0px 0px -12% 0px'`, and observe the `<ul>`.

**R3-4. Team keyboard accessibility**
- (a) **Tabs have no focus indicator.** The focused radio's label has `outline: none` and no box-shadow (WCAG 2.4.7).
- (b) **Focus is lost when Prev/Next becomes disabled.** Pressing Enter on Prev at the first card, or Next at the end, sets `disabled` on the focused button, and `document.activeElement` becomes `<body>` (2.4.3).
- (c) **The focus ring is too faint on white.** The gold ring `#d7a561` (scroller, "Подробнее") is about 2.0:1 on white, below the 3:1 for non-text contrast (1.4.11).
- Owner: `src/components/team/team.css`, `CarouselControls.tsx`, `TeamTabs.tsx`.
- Suggested fix:
  - Add `.ant-segmented-item:has(input:focus-visible) { outline: 2px solid #8f6526; outline-offset: 2px }`.
  - Use `aria-disabled="true"` with a no-op handler instead of `disabled`, or move focus to the opposite button when an edge is reached.
  - Use a darker ring colour (for example `#8f6526`, about 5:1) on light sections.

**R3-5. Dead and self-referencing links**
- The header "Связаться" and nav "Контакты" → `#contacts`; "Услуги" → `#services`; "Цены" → `#prices`; About "Лицензии" → `#licenses`. None of these targets exist, so the clicks do nothing.
- Team "Подробнее" for Курманбаев and Чатинян → `#doctors`, which jumps to the section top.
- "Связаться" is the most-clicked CTA in a demo.
- Owner: `src/data/hero.json` / `src/data/landing.ts` (hrefs), `src/components/nav/Navbar.tsx`, `src/components/sections/About.tsx`, `src/components/team/DoctorCard.tsx`.
- Suggested fix: until the sections exist:
  - Point "Связаться"/"Контакты" to `https://wa.me/77475696969` or `tel:`.
  - Render "Лицензии" as disabled with a "скоро" hint, or open a simple modal.
  - For doctors without cases, open the surgeon menu or hide "Подробнее".

**R3-6. Text contrast in the new sections (Lighthouse Accessibility 96, 24 nodes)**

| Element | Colour on background | Ratio |
|---|---|---|
| Eyebrows "О КЛИНИКЕ" / "КОМАНДА" | `#baab9b` on white | 2.23:1 |
| Gold accents "RR Clinic", "14 стран" | `#c3914d` on white | 2.8:1 (large text needs 3:1) |
| List numerals | `#ababab` on white | 2.29:1 |
| "Узнать больше" | white on `#d9b272` | 1.98:1 |
| "Лицензии" | `#96918e` on white | 3.11:1 |
| Selected tab | white on `#c3914d` | 2.8:1 |
| Inactive tabs | `#a97b39` | 3.76:1 |
| Team subtitles and bios | `#97897d` / `#7c7876` | 3.39 / 4.37:1 |

- These are Figma colours, the same class of issue as M-3b.
- Owner: designer + `src/components/sections/sections.css`, `src/components/team/team.css`, `src/components/team/Team.tsx` (Segmented tokens).
- Suggested fix: use darker text variants of the golds (for example `#8f6526` for small text and the CTA label on a darker fill) and greys at or above `#767676`. Get designer sign-off.

**R3-7. "Подробнее" leaves keyboard focus in Team after scrolling to the filtered hero**
- After the jump, the next Tab continues from the Team card 2,000 px below, and screen readers get no announcement.
- Owner: `src/components/team/Team.tsx` (`onMore`).
- Suggested fix: after `selectDoctor`, focus the filter chip (or the first matching case) with `preventScroll: true`. The chip could also announce "Показаны работы: Амир Темирханов" via `role="status"`.

### Polish

- **R3-8.** Stats figures sit 4 px right of Figma, and "15" is 5 px wider, because `tabular-nums` widens Futura's "1". Owner: `src/components/sections/StatsBand.tsx`. Fix: apply `tabular-nums` only while counting and switch to proportional figures at the end. The invisible sizer already prevents shifts.
- **R3-9.** The Trust list has 4 lines where Figma has 3: Figma runs points 3 and 4 together on one line, which is probably a typo in the mock-up. Our version reads better. Designer to confirm; no code change proposed. Owner: `src/data/landing.ts`.
- **R3-10.** Futura PT licence: the client's OTFs are embed-restricted (fsType 4, see `src/styles/fonts.css`). A ParaType web licence is needed before public launch. This does not block a private demo. Owner: lead/client.
- **R3-11.** The references disagree. `docs/ref/main-page-1440.png` shows a different hero (165 px cards, strip at y 165, smaller H1) than frame 1713:3971, which the build follows exactly. The designer should name the canonical frame before the next hero change. Owner: designer.
