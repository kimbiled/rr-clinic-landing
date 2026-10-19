# RR Clinic: Hero + Navbar design spec (desktop, 1440 base)

Owner: Designer / UI-UX lead · Date: 2026-10-19 · Figma file `i0lxHphgDIACH19ZkD95WY`

Legend:
- **FIGMA**: taken from Figma node data (metadata or annotation).
- **MEASURED**: measured from a Figma render at 1:1 (±1–2 px; colors ±3 per channel). These are close enough to build from. Re-check them once Figma access is back (see §11).
- **PROPOSED**: not in Figma. This is my design decision, consistent with the existing visual language. Build it as written unless the client objects.

> **Data-access caveat.** The Figma MCP account is on the **Starter plan** and hit its tool-call cap partway through this research. I did get the full page tree and the hero / Main Page metadata, plus 1:1 renders of `1713:3971` (carousel) and `1715:4160` (hover state). I did **not** get `get_design_context`, `get_motion_context`, or screenshots of the navbar component set, the menu frame, the loop endpoint or hover frames 2–7. §11 lists the exact node IDs to pull once quota resets. The plan is shared, so teammates using the same Figma account will hit the same wall.

---

## 0. Where things live in Figma (important: the hero is NOT on the two pages named in the brief)

The file has 18 pages. The hero sits on the page **"Main Page" `1370:3677`**. That page is not `236:6` "Лендинги" or `2:2` "Archive".

| What | Node | Notes |
|---|---|---|
| Main Page (full landing) | `1704:5392` (1440×2924) | Contains hero `v1` `1610:268`, stats, about, team block |
| Hero v1 (static layout) | `1610:268` (1440×720) | Older layout: cards 165.5×182, grid guide lines, content at y=386 |
| **Section "Анимация"** (frame-by-frame reference) | `1704:5403` | **Source of truth for motion + revised layout** |
| ↳ Annotation | `1716:4724` | "1440 × 720 · Кнопки до Y=642 / Кейсы: движение 40 px/s · Подъём при наведении 16 px / Figma: эскиз цикла и состояния наведения. Точная пауза в текущей позиции — в рабочем просмотре." |
| ↳ Frame A: carousel idle | `1713:3971` "RR / Hero — Carousel / 1440 × 720" | ref: `assets/ref/anim-carousel-1713-3971.png` |
| ↳ Frame B: loop endpoint | `1716:4359` "RR / Hero — Loop endpoint" | not rendered (quota) |
| ↳ Hover 1: Амир Темирханов | `1715:4160` | ref: `assets/ref/hover-amir-1715-4160.png` |
| ↳ Hover 2: Томирис Тулепбергенова | `1715:4521` | not rendered |
| ↳ Hover 3: Бауржан Муса | `1715:4876` | not rendered |
| ↳ Hover 4: Лейла Кодзоева | `1715:5245` | not rendered |
| ↳ Hover 5: Томирис Тулепбергенова | `1715:5610` | not rendered |
| ↳ Hover 6: Евгений Савельев | `1715:5978` | not rendered |
| ↳ Hover 7: Татьяна Романовская | `1715:6344` | not rendered |
| Navbar component set "RR / Navigation — Клиника и врачи" | `1498:4061` | Variants `State=Collapsed` `1498:3960` (1440×112), `State=Expanded` `1498:3988` (1440×818) |
| Navbar preview board | `1498:4062` | "Свёрнутая шапка" + "Раскрытое меню" instances |
| WhatsApp CTA component | `1498:3954` "RR / Navigation / WhatsApp CTA" (238×50) | |
| **Surgeon / clinic menu (full-screen)** | `1565:3926` "Menu" (1440×1000) | children: Header `1568:4783` (1280×60), "Клиника / разделы" `1568:4798` (340×720), "Врачи / персональные лендинги" `1568:4809` (860×650), "Помощь с выбором" `1568:4865` (1280×90) |
| Team block (doctor list, tabs) | `1748:6964` "04 / Наша команда" | Tabs capsule `1748:6968` (587×50); doctor cards 232×504, photo 232×300. Reuse its doctor photos for the hover card and menu |
| Older hero variants (archive) | `1465:3704` "Main v2", `1618:532` "v2", `1477:5560`/`1539:228` "Main v1" | Section "Archive Done" `1580:6570`. Ignore them. |
| Alt hero concept (not ours) | `1504:4127` "Hero / Mishuta — RR Clinic" | 3 slides, auto-advance 7 s. Not used. |

**Decision:** build the layout from the **Animation-section frames** (`1713:3971`, `1715:*`), which are newer than `1610:268` and carry the motion annotation. Use v1 `1610:268` only for details the animation frames don't show: card internals, nav, the grid lines and the CTA shine vectors. The Animation frames scale every case card ×1.2083 from v1 (165.517 → 200).

---

## 1. Layout & Tokens

### 1.1 Canvas
- Hero: 1440×720 design frame (FIGMA). Implementation: `height: max(720px, min(100vh, 900px))` (already in base.css). All y-values below are for the 720 frame. Keep the bottom-anchored group (content) pinned to the **bottom** and the carousel pinned to the **top**.
- Horizontal content gutter: 100 px (nav logo at x=101).

### 1.2 Vertical map of the 720 frame (Animation frames, MEASURED)
| Band | y-range | Source |
|---|---|---|
| Navbar row | 20 → 60 (container 0 → 80) | FIGMA v1 `1610:466` |
| Case strip (idle) | 124 → 344 (cards 200×220) | MEASURED `1713:3971` |
| Hovered case | 108 → 328 image + 328 → 410 info panel | MEASURED `1715:4160` (lift 16 px, FIGMA note) |
| Chips row (location + 2GIS rating) | 362 → 410 (h 48) | MEASURED |
| H1 (2 lines) | 412 → 500 (h 88) | MEASURED (glyph band 421–509) |
| Subtitle (2 lines) | 512 → 558 (h 46) | MEASURED |
| CTAs | 582 → 642 (h 60) | FIGMA note "Кнопки до Y=642" + MEASURED |
| Bottom breathing | 642 → 720 (78 px) | |

Content column: centered, width 650 (FIGMA `1610:432`), text-align center.

### 1.3 Colour tokens (FIGMA styles, already in `css/tokens.css`)
| Token | Hex | Use |
|---|---|---|
| White | #FFFFFF | headline, subtitle, labels on images |
| Neutral/100 | #F1EFED | "Связаться" pill, WhatsApp circle |
| Neutral/200 | #E3E0DE | secondary text on dark |
| Neutral/900 | #2E2C2C | text on light pills |
| Taupe/50 | #F6F3F0 | light surfaces below hero |
| Taupe/400 | #BAAB9B | outline-CTA border, muted labels |
| Gold/950 | #291D10 | darkest brown (hover info panel, glow) |
| gold-400 / gold-600 | #D7A561 / #B98743 | CTA gradient ends |

New tokens to add (PROPOSED names, MEASURED values):
```css
--c-panel: rgba(41, 29, 16, 0.96);          /* hover info panel, renders ≈ #2D1F12 */
--c-cta-top: #DDB37B;                        /* gold CTA top highlight */
--c-cta-bottom: #C19457;                     /* gold CTA bottom */
--c-outline: rgba(186, 171, 155, 0.9);       /* Taupe/400, outline CTA 1px border */
--shadow-card-lift: 0 18px 40px rgba(20, 13, 6, 0.45);
--ease-lift: cubic-bezier(0.22, 1, 0.36, 1); /* = --ease-out */
--ease-carousel: cubic-bezier(0.33, 0, 0.2, 1);
```

### 1.4 Typography
| Role | Family / weight | Size / line-height | Status |
|---|---|---|---|
| H1 | Manrope Regular (400) | 40 / 44 (1.1), ls 0 | FIGMA (via brief; render shows a light/regular weight) |
| Subtitle | Futura PT Book | 18 / ~23 (1.28) | FIGMA (via brief) |
| Nav links, phone, chips | Futura PT Book/Medium | 14 / 14 (text box h=14) | box sizes FIGMA; weight NOT re-verified |
| Case labels "ДО / ПОСЛЕ" | Futura PT Book, uppercase | 12 / 12 (v1 10 × 1.208) | MEASURED / scaled |
| Case title on card | Futura PT Book | 12 / 14 | scaled from v1 |
| Hover panel: procedure | Futura PT Book | 16 / 18, #FFFFFF | MEASURED (2 lines, "Увеличение молочных / желез") |
| Hover panel: doctor | Futura PT Book | 13 / 16, Neutral/200 @ 80% | MEASURED |
| CTA label | Futura PT Book | 18 / 24 (text box 24) | FIGMA box |

Futura PT (Book 400 / Medium 500) is self-hosted from the client-supplied files (public/assets/fonts/futura-pt-*.woff2, subset latin+cyrillic); Jost is no longer used. I couldn't re-confirm weights in Figma (quota), so see §11.

### 1.5 Radii / glass
- Glass pill: `rgba(255,255,255,.2)` + `backdrop-filter: blur(12px)`, radius 14 (FIGMA). Nav menu pill, chips.
- CTAs: full pill (radius 30 = h/2) (MEASURED).
- Case cards: **radius 0**, square corners (MEASURED in both frames).
- Hover info panel: radius 0, flush under the card (MEASURED).

---

## 2. Navbar (expanded + island)

### 2.1 Expanded (FIGMA `1610:466`, 1440×80, transparent bg)
| Element | Position (x, y, w×h) | Style |
|---|---|---|
| Logo "RR CLINIC" `1610:468` | 101, 24, 34.9×32 | `assets/icons/logo.svg`, white |
| Menu pill `1610:477` | 165, 20, 388×40 | glass pill (see 1.5), padding 0 16, gap 16, 6 links: О клинике · Услуги · Врачи · До/после · Цены · Контакты |
| Phone `1610:485` | 1077, 33, 114×14 | "+7 (747) 569-69-69", white 14 |
| "Связаться" pill `1610:487` | 1215, 20, 88×40 | bg Neutral/100 #F1EFED, text Neutral/900 14, radius 99, padding 0 16 |
| WhatsApp circle `1610:489` | 1299, 20, 40×40 | bg #F1EFED, icon 16×16 `whatsapp.svg`; overlaps pill by 4 px (sits on top) |

Link states (PROPOSED, nothing in Figma):
- hover: text opacity .72 → 1. Underline = 1 px line, `currentColor` at 60%, 4 px below baseline, grows `scaleX(0→1)` from the left over 240 ms `--ease-out`.
- active (current section): text white 100% + a 4×4 Gold-400 dot centered 6 px below.
- "Связаться" hover: bg #FFFFFF, `translateY(-1px)`, 200 ms. WhatsApp hover: bg #FFFFFF, icon `rotate(-8deg)` 200 ms.
- focus-visible: 2 px Gold-400 outline, offset 3 (base.css).

### 2.2 Island (collapsed on scroll)
Figma has a component-set variant `State=Collapsed` (`1498:3960`, 1440×112) and `State=Expanded` (`1498:3988`, 1440×818, the mega-menu). I couldn't render or inspect them (quota). Their sizes say "Collapsed" is a compact header bar and "Expanded" is the open mega-menu. Neither is the floating island the client describes. **The island below is PROPOSED.** Reconcile it with `1498:3960` once Figma is back.

PROPOSED island:
- Position: `position: fixed; top: 12px; left: 50%; transform: translateX(-50%)`.
- Size: auto width (≈ 720 px at 1440), height 56, padding 8 8 8 20, radius 99. Inner pills keep radius 14 → 99 at h=40.
- Surface: `rgba(41,29,16,.55)` + `backdrop-filter: blur(16px) saturate(140%)`. Border 1 px `rgba(255,255,255,.12)`, shadow `0 10px 30px rgba(20,13,6,.25)`. Use the dark glass because the island sits over light sections (Taupe/50).
- Content left→right: logo (24 h) · 6 links (14 px, gap 20, no inner pill) · divider 1×20 rgba(255,255,255,.16) · "Связаться" pill 36 h · WhatsApp 36×36. **The phone number is hidden** in island mode.
- Thresholds: collapse when `scrollY > 80`; expand when `scrollY <= 40` (hysteresis 40 px). Optional: hide the island on fast scroll-down (> 1200 px/s) with `translateY(-140%)` and show it again on any scroll-up.
- Transition expanded → island: 420 ms `--ease-out`. Use a FLIP morph of the container: width 1238 → island width, height 40 → 56, top 20 → 12, bg alpha 0 → .55, blur 0 → 16. Fade the links out and back in, reflowed (opacity 1→0 over 120 ms, then 0→1 over 180 ms with 220 ms delay). Phone: opacity → 0 and width collapse over 200 ms.
- Island → expanded: same timings reversed, 360 ms.
- Implement with IntersectionObserver on a 1 px sentinel at y=80 (plus a 40 px sentinel for hysteresis), not a raw scroll listener.

---

## 3. Hero content

### 3.1 Chips row (FIGMA `1620:4669`, MEASURED y 362–410)
- Location chip `1620:4643`: 233×48, glass pill. Icon `location.svg` 16×16 at (12, 16); label "Пластическая хирургия в Астане" 14 px at x=36.
- Rating chip `1620:4646`: 101.6×48, glass pill. 2GIS logo 26×26 (`2gis-sprite.png`). "4,9" 10 px bold + "(264)" 6 px; 5 stars 7.3 px, gap 0.9 (`star-*.svg`).
- Gap between chips: −2 px (they touch, FIGMA x 158.7 → 389.7, w 233).

### 3.2 Headline + subtitle (FIGMA `1610:433`, `1610:434`)
- H1 "Комплексные операции тела, лица и груди в премиальной клинике": 650 wide, centered, white, Manrope 40/44, 2 lines.
- Subtitle "Мы собрали лучших узких специалистов под одной крышей и выстроили полный цикл заботы: от онлайн-консультации до восстановления рядом с вами.": 650 wide, centered, white, Futura PT Book 18, 2 lines.
- Gaps: chips → H1 ≈ 2 px (MEASURED, visually tight because Manrope has internal leading), H1 → subtitle 12, subtitle → CTAs 24 (FIGMA v1 auto-layout).

### 3.3 Layers (bottom → top; matches tokens.css z-index)
bg columns `1610:269` → light shimmer → case strip `1610:271` → statue `1610:427` → shade group `1610:428` (Shadow radial, bottom Overlay 374 h, Ellipse glow 868×296 blur) → particles → content → **hovered card overlay (z-overlay 7)** → nav.

The statue covers the middle card (x 600–840) in the idle frame. That is intended.

---

## 4. Carousel & case cards

### 4.1 Strip geometry (MEASURED `1713:3971`)
- Card 200×220, gap 20, pitch **220 px**, top y=124.
- Idle frame x-positions: −40, 180, 400, (620 behind statue), 840, 1060, 1280. The strip bleeds off both edges.
- Order in Figma (left→right) = hover frames 1–7. In v1 this sequence is preceded by an 8th card:
  1. B/A breast, "Увеличение молочных желез", **Амир Темирханов**
  2. Video interview "Впечатления после операции", "Верхняя блефаропластика", **Томирис Тулепбергенова**
  3. B/A face, **Бауржан Муса**
  4. (behind statue), **Лейла Кодзоева**
  5. B/A face (young woman), **Томирис Тулепбергенова**
  6. B/A breast, "Подтяжка груди с круглыми имплантами", **Евгений Савельев** (matches v1 Sidebar `1610:380`)
  7. Video "Интервью с Ольгой", "Голливудский фейслифтинг", **Татьяна Романовская**

  Backend: map `caseId → doctorId` in `hero.json` in this order. The procedure names for cards 3–5 still need confirming (see §11).

### 4.2 Before/After card (v1 `1610:273`, scaled ×1.208)
| Part | Spec |
|---|---|
| Container | 200×220, overflow hidden, radius 0 |
| Images | before = left half, after = right half (100×220 each, object-fit cover). Implement as two stacked full-size images with `clip-path: inset(0 calc(100% - var(--pos)) 0 0)` on "before" |
| Divider `1610:277` | 1 px vertical, white @ 60%, at `--pos` (default 50%) |
| Knob `1610:282` | circle 22×22 centered on the divider, vertical center y=110 (card-relative). Glass: rgba(255,255,255,.2) + blur 12 + 1 px white @ 40% border. Arrows `arrow-left.svg`/`arrow-right.svg` 12×12, white |
| Labels | "ДО" top-left (16, 16), "ПОСЛЕ" top-right (right 16, 16). 12 px uppercase, white @ 85% |
| Bottom shade `1610:278` | bottom 88 px gradient `linear-gradient(180deg, rgba(45,32,16,0) 0%, rgba(45,32,16,.4) 100%)` (= `--c-case-shade`) |
| Title | bottom-left (16, bottom 16), 12/14 white, max 2 lines |

### 4.3 Interview (video) card (v1 `1610:285`)
- Poster `case*-interview.png` cover. Top title strip: 16 px inset, procedure name 12 px white.
- Bottom: play icon `play-circle.svg` 22×22 at (16, bottom 46). Caption "Впечатления после операции" 12/14 below it.
- Hover: the `<video muted playsinline loop preload="metadata">` fades in over the poster (opacity 0→1, 240 ms) and plays. The play icon scales to .8 and fades to 0 over 200 ms. On leave: pause, `currentTime = 0`, poster fades back over 240 ms. Only one video plays at a time.

### 4.4 Grid guide lines (v1 only, `1610:415`)
Thin 1 px lines, white @ ~12%. They aren't in the Animation frames. **Decision (PROPOSED):** keep them **static** (they don't move with the strip), aligned to the new card band: horizontal lines at y=124 and y=344 across the full width, and vertical lines at x = 360, 580, 800, 1020, 1240 (every 220 px). They give the "sculptor's measuring grid" idea. Give them a 35% opacity mask behind the statue.

---

## 5. Doctor hover card ("card slides up from below")

### 5.1 What Figma shows (FIGMA note + MEASURED `1715:4160`)
On hover the hovered case:
1. **Rises 16 px** (y 124 → 108) (FIGMA note "Подъём при наведении 16 px").
2. Moves to the overlay layer, above the H1/chips and above the statue.
3. Shows an **info panel attached under the image**: 200×82, y 328–410, background ≈ #2D1F12 (`--c-panel`), radius 0, with a soft drop shadow underneath.
   - Procedure: "Увеличение молочных желез", white 16/18, left 12, top 14, max 2 lines.
   - Doctor: "Амир Темирханов", Neutral/200 @ 80%, 13/16, left 12, 8 px under the procedure.
4. The B/A labels and the in-image title stay visible. The image itself is unchanged (no zoom).
5. The rest of the strip **stops in its current position** (FIGMA note: "Точная пауза в текущей позиции").

In the Figma sketch the hovered card is drawn at x=24 and overlaps its neighbour by 44 px. That's a sketch artefact. **In code the card stays in its slot.** Only Y changes.

### 5.2 Earlier variant in v1 (`1610:380` "Sidebar")
In v1 the hovered case sits ~57 px higher than its row. Under it: an 18 px round avatar (`avatar-savelyev.png`) + "Евгений Савельев" (8 px text box), and a 2-line caption "Подтяжка груди с круглыми имплантами" (`1610:405`, 24 h), all on transparent bg. **That is the earlier take on the same hover state.** Use it as the source for the avatar.

### 5.3 Build spec: Figma panel + avatar + "his cases" (partly PROPOSED)
The client asks for "photo of the doctor and his cases". Figma only shows the name. I combine the Figma panel with the v1 avatar and add a cases row:

```
┌──────────── 200 ────────────┐
│  case image 200×220 (lifted) │
├──────────────────────────────┤  ← panel, bg --c-panel, padding 12
│ Увеличение молочных желез    │  16/18 white (FIGMA)
│ (●) Амир Темирханов          │  avatar 24×24 round + 13/16 Neutral/200@80 (avatar PROPOSED from v1)
│ ▢ ▢ ▢  Ещё 12 кейсов →       │  3 thumbs 36×36 r4, gap 6, + link 12px Gold-400 (PROPOSED)
└──────────────────────────────┘
```
- Panel height: 82 (FIGMA) without the thumbs row, **130** with it (PROPOSED). Default = with the thumbs row if `doctor.cases.length > 1`, otherwise 82.
- Thumbs: hovering a thumb swaps the main card image/video to that case (cross-fade 200 ms). Clicking "Ещё N кейсов" goes to the doctor's landing (the anchor from `hero.json`).
- Pointer path: the panel is part of the hovered element, so moving the pointer from the image into the panel keeps the hover. The hit area = card + panel.
- Shadow under panel: `--shadow-card-lift`.
- Missing assets: doctor avatars for Амир, Томирис, Бауржан, Лейла, Татьяна. Only `avatar-savelyev.png` exists. Crop them from the team-block photos `1763:7303…7334` (232×300) when Figma access is back.

### 5.4 Readability over headline (brief item)
- On `pointerenter`, set the card's z-index to `--z-overlay` (7) **immediately**. On `pointerleave`, keep it until the lift-down transition finishes, then restore `--z-carousel`. This avoids the card popping behind the text mid-animation.
- The panel and card get the full opaque background, so text under them is hidden. No need to dim the H1 (PROPOSED: optionally fade the H1 to 0.85 while a card overlaps it).
- The content layer must have `pointer-events: none` except for the chips and CTAs, so cards under the text can still be hovered.

---

## 6. Before/After slider
FIGMA shows only the static 50% state (divider + knob + arrows). Interaction is PROPOSED:
- Drag: pointerdown on the knob **or anywhere on the card** → `setPointerCapture`. `--pos` follows pointer x, clamped to 4%–96%.
- While dragging, the carousel stays paused (it's already paused by hover). Dragging must never trigger a link click (suppress the click if moved > 4 px).
- Knob states: idle as in 4.2. Hover: scale 1.12, bg rgba(255,255,255,.32), 160 ms. Dragging: scale 1.0, bg Gold-400 @ 90%, arrows Gold/950. Divider while dragging: 2 px, white 100%.
- Hint (PROPOSED): first time a B/A card is hovered, the knob nudges ±10 px twice over 900 ms ease-in-out. Once per session.
- Release: snap is free (no snapping). On card leave, `--pos` eases back to 50% over 500 ms `--ease-out` after a 600 ms delay.
- Keyboard: role="slider", Left/Right 5%, Shift ±10%, Home/End 4/96%.

---

## 7. Surgeon menu ("Меню выбора хирурга")

### 7.1 What exists in Figma
1. **`1565:3926` "Menu"** (1440×1000, full-screen) is the surgeon/clinic menu. Structure (FIGMA metadata):
   - Header `1568:4783` at (80, 32), 1280×60. Logo + close button, same row height as the nav.
   - Left column "Клиника / разделы" `1568:4798` at (80, 160), 340×720: site sections.
   - Right column **"Врачи / персональные лендинги"** `1568:4809` at (500, 160), 860×650: the surgeon selection, linking each doctor to a personal landing.
   - Bottom bar "Помощь с выбором" `1568:4865` at (80, 850), 1280×90: "help me choose" CTA strip.
2. **`1498:4061` component set** "RR / Navigation — Клиника и врачи" with the same content as a nav variant: `State=Expanded` 1440×818.
3. Team block tabs `1748:6968` (capsule 587×50, tabs 190/200/179×40) + doctor cards 232×504 `1763:7302…7337`: the visual language for doctor tiles.

The visuals of 1 and 2 were **not captured** (quota). Below is the build spec, inferred from their geometry and the team-block styling (PROPOSED where noted).

### 7.2 Build spec
- Trigger: nav link "Врачи" **and** the CTA "Подобрать специалиста" open the menu with the doctors column focused.
- Overlay: full viewport, bg `rgba(41,29,16,.72)` + blur 24, z `--z-menu`. Panel 1440×1000 max (height = 100vh, scroll inside), content inset 80 px.
- Doctors grid (860 wide): 3 columns × 2 rows, tile 272×300, gap 22 (PROPOSED to fit 860). 6 doctors: Курманбаев Рустам, Романовская Татьяна, Муса Бауржан, Темирханов Амир, Кодзоева Лейла, Чатинян Гарик (+ Савельев Евгений, Тулепбергенова Томирис: confirm the list, §11).
  - Tile: photo cover 272×204 radius 14. Name 18/22 white. Speciality 14/18 Neutral/200 @ 70%. Arrow "↗" 20×20 top-right on the photo, glass circle 36.
  - Hover: photo scale 1.04 (600 ms `--ease-out`), arrow circle bg → Gold-400, name underline. The case strip behind the overlay emits `surgeon:select` (preview filter).
  - Selected/active: 1 px Gold-400 border on the photo + "Выбран" pill.
- Left column links: 24/32 Manrope, white @ 70%, hover 100% + 12 px indent slide (240 ms).
- Bottom bar "Помощь с выбором": glass strip radius 14, text "Не знаете, к кому обратиться? Поможем выбрать врача" + gold CTA (same as hero CTA, 224×52) + WhatsApp CTA component `1498:3954` (238×50).
- Open animation: overlay fade 0→1 over 280 ms. Panel content `translateY(24px)→0` + opacity, 480 ms `--ease-out`. Doctor tiles stagger 40 ms.
- Close: Esc, the close button, or a click on the backdrop. 240 ms reverse.
- Selecting a doctor (decided until the client answers Q4 in PLAN.md): close the menu, emit `surgeon:select {doctorId}`, and the carousel **filters to that doctor's cases** (cross-fade the strip, 400 ms) with a "Все врачи ×" chip in the chips row. Clicking the tile's arrow opens the personal landing.
- A11y: `role="dialog" aria-modal="true"`, focus trap, roving tabindex across tiles (arrows), and focus returns to the trigger on close.

---

## 8. CTAs

### 8.1 Primary "Подобрать специалиста" (FIGMA `1610:458`)
- 284×60, radius 30. Fill: vertical gradient `linear-gradient(180deg, #DDB37B 0%, #D2A160 35%, #C19457 100%)` (MEASURED).
- Label 18 px Futura PT Book, **white**, text box at x 35.5 (FIGMA). Icon `arrow-down-right.svg` 20×20 at x 228.5, y 20.
- Shine vectors `1610:462` (3 diagonal light bands 101.5×135.5, at x 100 / 177 / 260, y −27.75; clipped by the button). Assets: `cta-shine-1.svg`, `cta-shine-2.svg`. In the static frame they sit near the right side.
- States (PROPOSED; Figma has no state variants):
  - idle: shine group sweeps **left → right** from x −120 to x 320 over 1200 ms `cubic-bezier(.45,0,.2,1)`, every 6 s (first sweep 1.4 s after the reveal ends). Shine opacity .55.
  - hover: immediate sweep (900 ms). Filter `brightness(1.06)`. Shadow `0 10px 28px rgba(215,165,97,.35)`. Arrow `translate(2px, 2px)` 220 ms. Idle loop paused while hovered.
  - active: `scale(.98)`, 120 ms.
  - focus-visible: 2 px #FFF outline offset 3.
  - reduced motion: no sweep. Hover = brightness only.

### 8.2 Secondary "Смотреть работы" (FIGMA `1614:3961`)
- 224×60, radius 30, transparent bg (render ≈ underlying brown), 1 px border Taupe/400 (`--c-outline`), label 18 px white at x 43.5.
- Figma has a **hidden arrow** `1614:3963` (at x 202.5) and a **hidden shine group** `1614:3965` inside this button. I read that as the hover state (PROPOSED):
  - hover: bg `rgba(255,255,255,.08)`, border → white @ 90%. Label shifts left 10 px while the arrow (20×20, white) fades/slides in from x 192 → 202.5. One shine sweep at opacity .25. 260 ms `--ease-out`.
  - active: `scale(.98)`.
- Button gap: 12 (FIGMA x 296 − 284).

---

## 9. Motion spec

No Figma prototype/keyframe data could be read. `get_motion_context` was blocked by the plan limit, so **only the two values from the Figma annotation (40 px/s, 16 px lift) and "pause in the current position" are FIGMA**. Everything else is PROPOSED and tuned to the reference frames.

Global: one shared rAF loop; DPR ≤ 2. Pause all effects when `document.hidden` or when the hero is out of the viewport (IntersectionObserver).

### 9.1 Particles (PROPOSED)
| Param | Value |
|---|---|
| Count | 70 at 1440×720. Scale by area: `round(area / 14800)`, clamp 40–110. Drop to 60% if avg frame > 18 ms for 2 s |
| Size | radius 0.6–2.2 px (85%). 15% are "bokeh" particles, radius 3–6 px, blurred (draw a radial gradient) |
| Colour | warm dust: 70% `#F6E2BC`, 20% `#FFFFFF`, 10% Gold-400 `#D7A561` |
| Opacity | 0.15–0.6 (bokeh 0.06–0.14). Twinkle ±0.15 sine, period 3–7 s random per particle |
| Motion | Drift up and to the right: vy −4 → −12 px/s, vx +2 → +8 px/s (matches the strip direction). Plus sine sway on x, amplitude 6–18 px, period 6–14 s. Wrap at edges |
| Depth | 3 layers (speed ×0.6 / ×1 / ×1.4, size ×0.7 / ×1 / ×1.3) |
| Pointer | none (keep calm), `pointer-events: none` |
| Layer | `--z-particles` (above the shade, below the content) |
| Blend | `screen` (or `lighter` in Canvas2D) |

### 9.2 Light shimmer (PROPOSED)
- Where: (a) the light behind the statue head, between the columns (center x 720, y 180, ellipse 900×520); (b) two soft shafts falling diagonally from the top-left and top-right gaps between the columns (40° and 140°, width 220 px).
- Colours: core `rgba(255, 214, 160, .55)` → `rgba(255, 190, 120, .18)` → transparent. Blend `soft-light` or `screen` at layer opacity .5.
- Animation: (a) opacity .35 ↔ .55, period 7 s sine. Scale 1 ↔ 1.04, period 11 s. (b) each shaft opacity .1 ↔ .3, periods 9 s / 13 s, phase offset 3 s; x-drift ±24 px, period 17 s. Non-commensurate periods, so it never visibly loops. Max brightness change rate < 1 Hz, no flashes.
- Optional sparkle (PROPOSED): every 10–14 s, a slow diagonal glint (a 120 px-wide white @ 8% band) crosses the background columns over 2.4 s.

### 9.3 Carousel
| Param | Value |
|---|---|
| Direction | **left → right** (track `translateX` increases) |
| Speed | **40 px/s** (FIGMA) |
| Loop | duplicate the case set (≥ 2× viewport). Period = N × 220 px (8 cases → 1760 px → 44 s per cycle). Wrap `x -= period` when `x ≥ 0`. Frame `1716:4359` "Loop endpoint" = the strip shifted by exactly one period (the seamless check) |
| Implementation | JS velocity model in rAF (not CSS keyframes), so the pause can freeze in place |
| Hover pause | on `pointerenter` of any card, velocity 40 → 0 over **400 ms**, `easeOutCubic`. The strip settles ≤ 8 px past the entry point |
| Resume | on `pointerleave` of the whole strip + panel, wait 250 ms, then velocity 0 → 40 over **700 ms**, `easeInOutSine` |
| Focus | keyboard focus on a card = same as hover |
| Reduced motion | velocity 0. Strip static with the first card at x=24 (as in Hover frame 1) |

### 9.4 Card lift + panel
| Step | Timing |
|---|---|
| z-index → overlay | 0 ms (immediate) |
| Card `translateY(0 → -16px)` | 320 ms `--ease-lift`, shadow 0 → `--shadow-card-lift` |
| Panel reveal (from below) | starts at +60 ms, 380 ms `--ease-lift`. Panel `clip-path: inset(0 0 100% 0) → inset(0)` + inner content `translateY(-12px → 0)` + opacity 0 → 1 |
| Panel text stagger | procedure +0, doctor +60 ms, thumbs +120 ms (each 260 ms, y 8 → 0) |
| Video start (interview cards) | at +120 ms |
| Leave | panel 220 ms `ease-in` (reverse clip), card down 280 ms `--ease-out` from +80 ms, z-index restored at the end |
| Hover intent | ignore hovers shorter than 80 ms when the pointer is just passing across the strip (prevents flicker) |

### 9.5 Text / page reveal (on load, after the bg image `decode()` resolves; t=0)
| t (ms) | Element | Animation |
|---|---|---|
| 0 | bg columns | opacity 0 → 1, scale 1.04 → 1, 1200 ms `--ease-out` |
| 150 | statue | opacity 0 → 1, `translateY(16px) → 0`, 1100 ms `--ease-out` |
| 250 | navbar | opacity 0 → 1, `translateY(-12px) → 0`, 600 ms |
| 300 → 720 | case cards | opacity 0 → 1, `translateY(12px) → 0`, 600 ms, stagger 60 ms (left → right); carousel velocity ramps 0 → 40 from 900 ms over 800 ms |
| 450 | chips | opacity + y 12 → 0, 600 ms, stagger 80 ms |
| 550 / 650 | H1 line 1 / line 2 | line mask reveal: inner span `translateY(105%) → 0`, 900 ms `cubic-bezier(.19,1,.22,1)`; parent `overflow: hidden` |
| 820 | subtitle | opacity 0 → 1 + y 10 → 0, 700 ms |
| 950 / 1030 | CTA primary / secondary | opacity + y 14 → 0 + scale .98 → 1, 600 ms |
| 1400 | particles + light | fade in 0 → 1 over 1500 ms |
| 2400 | first CTA shine sweep | |

The reveal runs once. Never on resize. Use only transform and opacity.

### 9.6 Navbar collapse
See 2.2: collapse at `scrollY > 80`, expand at `≤ 40`, 420 ms / 360 ms `--ease-out`, FLIP width morph.

### 9.7 prefers-reduced-motion
Off: particles (render one static frame at 50% count), shimmer (static light at mid opacity), carousel motion, reveal (everything visible at t=0), CTA sweeps, knob nudge, menu stagger. Still on, without motion: hover card and panel (instant show, no lift transition), video plays only on explicit hover/focus, B/A dragging, island collapse (instant swap with a 150 ms crossfade).

---

## 10. Assets inventory

Existing (do not re-download): `assets/img/bg-columns.png`, `statue.png`, `case1…8-*.png`, `avatar-savelyev.png`, `2gis-sprite.png`; `assets/icons/logo.svg`, `whatsapp.svg`, `location.svg`, `arrow-*.svg`, `play-circle*.svg`, `star-1…5.svg`, `cta-shine-1/2.svg`, `grid-line-*.svg`, `divider-line.svg`, `glow-ellipse.svg`.

New reference screenshots (this pass):
- `assets/ref/anim-carousel-1713-3971.png`: Animation frame A, idle strip, 1440×720
- `assets/ref/hover-amir-1715-4160.png`: Hover frame 1, Амир Темирханов, 1440×720
- (existing) `assets/ref/hero-figma-1024.png`: v1 `1610:268`

Still needed (not downloaded because of the quota):
| Asset | Source node | Filename to use |
|---|---|---|
| Doctor avatars ×6 (Амир, Томирис, Бауржан, Лейла, Татьяна, Рустам/Гарик) | team photos `1763:7303`, `1763:7308`, `1763:7313`, `1763:7318`, `1763:7323`, `1763:7334` | `assets/img/doctor-<slug>.webp` (232×300 + a 48×48 crop) |
| Menu doctor tiles | `1568:4809` | same files |
| Card 4 image (behind statue) | `1713:3971` subtree | `assets/img/case-lejla-*.png` |
| Hover frames 2–7, loop endpoint, nav states, menu | §0 IDs | `assets/ref/<name>-<id>.png` |
| Videos for interview cards | client | `assets/video/case*-interview.mp4/webm` (≤ 5 s, 400×440, ≤ 600 KB) |

---

## 11. Open questions / follow-ups

**For whoever has Figma quota next** (≈ 12 calls total):
1. `get_screenshot` + `get_design_context` on `1498:4061` (nav Collapsed/Expanded) and `1565:3926` (Menu). Then replace the PROPOSED island and menu visuals in §2.2 / §7.2.
2. `get_motion_context` recursive on `1704:5403` and `1610:268`. If there are keyframes, they override §9.
3. `get_screenshot` on `1716:4359` and `1715:4521…6344`. Confirm the loop period, plus the procedure titles and doctor mapping for cards 2–5.
4. `get_design_context` on `1715:4160`. Exact panel fill, shadow, fonts and paddings (replace the MEASURED values in §5.1).
5. Confirm font weights (Manrope 400 for the H1? Futura PT Book vs Medium for the nav).

**For the client:**
6. The hover card in Figma shows procedure + doctor name only. Do you want the doctor photo and the "other cases" thumbnails (§5.3, PROPOSED)?
7. The menu's doctor list: the team block has 6 surgeons, the hero hover frames name 6 people (incl. Савельев and Тулепбергенова, who aren't in the team block). What is the final list and order?
8. Grid guide lines: keep them (v1) or drop them (Animation frames)? Default: keep, static.
9. What should selecting a surgeon do: filter the carousel (default) or open the personal landing?
10. Island reference landing (PLAN N-05) is still missing. The proposed island follows our own glass language.
