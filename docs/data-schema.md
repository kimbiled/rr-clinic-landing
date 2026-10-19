# Hero data schema

Single source of truth: `src/data/hero.json`. Types: `src/data/types.ts` (`HeroData`, `Doctor`, `Case`, `ImageAsset`, ...). Helpers: `src/data/hero.ts`.

The JSON is imported statically by Vite (no `fetch`, works under `file://` builds and SSR-free).

```ts
import { heroData, getDoctor, getCasesByDoctor, asset } from '@/data/hero'; // or a relative path: '../data/hero'

const doc   = getDoctor(heroData.cases[6].doctorId);
const cases = getCasesByDoctor('savelyev-evgeniy');
<img src={asset(heroData.hero.statue.src)} />   // prefixes import.meta.env.BASE_URL
```

`src` values in the JSON are paths relative to `public/` (e.g. `assets/img/web/statue.webp`); always pass them through `asset()`.
Check the data with `node scripts/validate-data.mjs` (image files exist, `case.doctorId` resolves, ids unique, no figma.com URLs).

## Top level

| key | type | notes |
|---|---|---|
| `_meta` | object | `schemaVersion`, `updated`, `source` (Figma nodes), `imageRoot`, `notes[]` (placeholders / caveats; not for rendering) |
| `clinic` | object | `name`, `location`, `phone`, `phoneHref`, `whatsappHref`, `rating` |
| `clinic.rating` | object | `{ source: "2GIS", value: 4.9, max: 5, count: 264, logo: Image, wordmark: Image, url: string\|null }` |
| `nav[]` | `{ id, label, href }` | header links, in order |
| `hero` | object | `title`, `subtitle`, `ctas[]`, `background: Image`, `statue: Image` |
| `hero.ctas[]` | `{ id, label, href, variant: "primary"\|"secondary", icon: string\|null }` | |
| `doctors[]` | Doctor | |
| `cases[]` | Case | rendered left→right in array order |

### Image

```ts
type Rect  = { x: number; y: number; w: number; h: number };   // normalized 0..1 of the src image
type Image = { src: string; width: number; height: number;      // intrinsic px of the web file
               alt?: string; framing?: Rect };
```

`framing` is the region Figma shows inside the card slot. If omitted, render the whole image with `object-fit: cover`. To apply it on an `<img>` inside an `overflow:hidden` slot:

```css
img { position:absolute; width: calc(100% / var(--w)); height: calc(100% / var(--h));
      left: calc(-100% * var(--x) / var(--w)); top: calc(-100% * var(--y) / var(--h)); max-width:none; }
```
(set `--x/--y/--w/--h` from `framing`; this is exactly how Figma positions the fill).

### Doctor

| key | type | notes |
|---|---|---|
| `id` | string | URL-safe slug, `lastname-firstname` (latin) — stable, used by `case.doctorId` |
| `name` | string | "Фамилия Имя" as in the team section |
| `firstName`, `lastName` | string | hero card shows `${firstName} ${lastName}` ("Евгений Савельев") |
| `role` | string | short title ("Пластический хирург") |
| `specialty` | string | one-line description from the team card |
| `photo` | Image \| null | portrait; `null` → render the "Фото врача" placeholder |
| `avatar` | Image \| null | square face crop for small avatars (18–96 px); fall back to `photo` |
| `city` | string | |
| `href` | string | doctor page / anchor ("Ещё N кейсов →", menu); placeholder `#doctors` |
| `figmaNodeId` | string? | provenance only |

### Case

Common fields: `id`, `type`, `title` (procedure), `caption` (string\|null), `showTitle` (whether the design shows the title on the card), `doctorId`, `featured?` (the sidebar card with doctor avatar + title below), `behindStatue?` (the Figma card hidden behind the statue), `figmaNodeId?`.

Array order = strip order (Figma animation frame `1713:3971`, design-spec §4.1); the extra v1 card is last so the loop places it just before the first. `id`s are stable and do **not** encode position.

`type: "beforeAfter"`
- `before: Image`, `after: Image` — always separate files (use these).
- `pair?` — only when the source was one side-by-side photo: `{ src, width, height, before: Rect, after: Rect }` (left half = before, right half = after). The pipeline already splits pairs into `caseN-before/after.webp`; `pair` is kept for a zoom/compare view and for re-processing.

`type: "video"`
- `poster: Image`
- `video: null | { src: string; type: string; duration?: number; captions?: string }` — **currently always `null`** (no real videos yet). Render poster + play icon and disable playback / hide the play affordance when `null`.

## Images

Originals stay untouched in `assets-src/img/`; data points only at `public/assets/img/web/` produced by `./scripts/optimize-images.sh` (needs `sips`; uses `cwebp` → WebP with alpha, else JPEG/PNG via sips — then update extensions in the JSON).

| group | rule |
|---|---|
| card images (166×182 CSS, hover ≤2×) | long side ≤ 600 px |
| case4/case7 | Figma exported them as non-native-aspect "fill" crops → resampled to the half-slot aspect 273×600 |
| face pairs (case3, case6) | split into `-before` (left half) / `-after` (right half) + 1000 px pair |
| avatar | 600 px portrait + 192 px square face crop |
| background / statue | 2× display width, cap 2560, never upscaled (sources are 1678 / 1024 px wide) |
| 2GIS | `2gis-icon.webp` 104 px square (shown at 26 px) + lossless wordmark |

## How to…

**Add a doctor**
1. Put the original photo in `assets-src/img/doctors/<id>.jpg|png`.
2. Add a line to `optimize-images.sh`, e.g. `fit_long "$SRC/doctors/<id>.png" "doctors/<id>" 600` (create `public/assets/img/web/doctors/` first; `encode` writes to `$OUT/<base>`), optionally a square crop for `avatar`.
3. Run `./scripts/optimize-images.sh`, read the output size with `sips -g pixelWidth -g pixelHeight`.
4. Append to `doctors[]` with a new unique `id`; run `node scripts/validate-data.mjs`.

**Add a before/after case**
1. Originals → `assets-src/img/caseN-before.png`, `caseN-after.png` (or one `caseN-pair.png` → use `split_pair`).
2. Add to the script (`fit_long … 600`), run it.
3. Insert into `cases[]` at the desired position with `type: "beforeAfter"`, `doctorId` of an existing doctor, `before`/`after` Images (add `framing` only if a specific crop is wanted). Validate.

**Add a video**
1. Encode: H.264 MP4 (+ optional WebM), ≤ 1080p, `-movflags +faststart`; put in `public/assets/video/`.
2. Poster through the image pipeline as above.
3. Case: `type: "video"`, `poster`, `video: { "src": "assets/video/caseN.mp4", "type": "video/mp4" }`. To attach a real video to an existing interview card just replace its `video: null`. Validate.

Always finish with `node scripts/validate-data.mjs`. (`legacy/sync-hero-data.sh` belongs to the old vanilla app and is obsolete.)

## Future REST shape (CMS integration)

Keep the JSON shape; the server just serves it. Image `src` may become absolute CDN URLs; add `srcset` later if the CMS generates renditions.

```
GET /api/hero
200 → { clinic, nav, hero, doctors: Doctor[], cases: Case[] }      // same as data/hero.json minus _meta
      Cache-Control: public, max-age=300, stale-while-revalidate=86400 ; ETag

GET /api/doctors
200 → { items: Doctor[] }

GET /api/doctors/:id
200 → Doctor & { bio?: string, experienceYears?: number, procedures?: string[] }
404 → { error: { code: "doctor_not_found", message } }

GET /api/doctors/:id/cases?type=beforeAfter|video&limit=12&cursor=<opaque>
200 → { items: Case[], nextCursor: string | null }
404 → { error: { code: "doctor_not_found", message } }

GET /api/cases?doctorId=&procedure=&type=&limit=&cursor=
200 → { items: Case[], nextCursor: string | null }
```

CMS model mapping: `Doctor` and `Case` collections (Case → Doctor reference by `id`), `Media` assets for Image/Video, a singleton `HeroSettings` for `clinic`, `nav`, `hero`, and an ordered relation `heroCases` (the 8 cards). The 2GIS rating (`value`, `count`) should be refreshed by a scheduled job, not edited by hand.

### Swapping the static import for a fetch / React Query

Only `src/data/hero.ts` needs to change; components keep consuming `HeroData`. Example:

```ts
// src/data/useHero.ts
import { useQuery } from '@tanstack/react-query';
import { heroData as fallback } from './hero';
import type { HeroData } from './types';

export const useHero = () =>
  useQuery({
    queryKey: ['hero'],
    queryFn: async (): Promise<HeroData> => {
      const r = await fetch('/api/hero');
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
    initialData: fallback,        // static JSON keeps the hero rendering if the API is down
    staleTime: 5 * 60_000,
  });
```

Components then call `useHero().data` instead of importing `heroData`; `getDoctor` / `getCasesByDoctor` should take the data as an argument at that point. `@tanstack/react-query` is not installed yet.
