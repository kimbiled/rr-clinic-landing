# RR Clinic — лендинг (Hero + Navbar, desktop)

## Стек

React 19, TypeScript, Tailwind CSS 4, Ant Design 6, сборка — Vite 8.

## Запуск

```bash
npm install
npm run dev       # dev-сервер с HMR
npm run build     # tsc -b + vite build -> dist/
npm run preview   # локальный просмотр собранного dist/
```

Дополнительно: `npm run typecheck`, `node scripts/validate-data.mjs` (проверка данных).

## Структура проекта

```
src/
  App.tsx, main.tsx     точка входа
  components/           carousel, fx, hero, nav, surgeon-menu
  hooks/  theme/  styles/
  data/                 hero.json (контент), types.ts (типы), hero.ts (heroData, getDoctor, getCasesByDoctor, asset)
public/assets/          img/web (оптимизированные картинки), icons, fonts
assets-src/img/         исходные PNG (не изменяются)
scripts/                optimize-images.sh, validate-data.mjs
docs/                   PLAN.md, design-spec.md, data-schema.md, qa/, ref/ (референсы дизайна)
legacy/                 прежняя версия на vanilla JS (только для справки; sync-hero-data.sh устарел)
```

## Где править контент

Весь контент (тексты, навигация, врачи, кейсы, рейтинг) — `src/data/hero.json`. Типы — `src/data/types.ts`, схема и будущий REST — `docs/data-schema.md`. Пути к картинкам в JSON указываются относительно `public/` (например `assets/img/web/statue.webp`). После правок:

```bash
node scripts/validate-data.mjs
```

Скрипт проверяет: файлы картинок существуют в `public/`, `case.doctorId` ссылается на существующего врача, id уникальны, ссылок на figma.com нет.

### Добавить врача

1. Положить исходное фото в `assets-src/img/doctors/<id>.png`.
2. Добавить строку в `scripts/optimize-images.sh` (например `fit_long "$SRC/doctors/<id>.png" "doctors/<id>" 600`), запустить скрипт.
3. Добавить объект в `doctors[]` с уникальным `id` (`photo`/`avatar` — `null`, если фото нет).
4. `node scripts/validate-data.mjs`.

### Добавить видео

1. Закодировать H.264 MP4 (до 1080p, `-movflags +faststart`) и положить в `public/assets/video/`.
2. Постер прогнать через оптимизацию картинок.
3. В `cases[]` добавить кейс `type: "video"` с `poster` и `video: "assets/video/caseN.mp4"` (либо заменить `video: null` у существующего интервью-кейса; `doctorId` — существующий врач).
4. `node scripts/validate-data.mjs`.

## Оптимизация картинок

```bash
./scripts/optimize-images.sh            # assets-src/img -> public/assets/img/web
QUALITY=85 ./scripts/optimize-images.sh
```

Нужны macOS `sips` и `cwebp` (`brew install webp`). Скрипт идемпотентен: имена результатов не меняются при повторном запуске. Правила размеров — в шапке скрипта и `docs/data-schema.md`.

## Что пока заглушки

Часть пунктов описана в `_meta.notes` в `hero.json`, остальные — по итогам миграции:

- видео интервью: `video: null` у case-2, case-5, case-8 — ждём ролики от клиента;
- фото врачей: везде «Фото врача» (`photo`/`avatar` = null), кроме аватара Савельева;
- фото основателей в блоке «О клинике» вырезано из скриншота макета — нужен оригинал;
- Futura PT подключена из файлов клиента (Book/Medium, woff2); для продакшна нужна веб-лицензия ParaType;
- фон и статуя низкого разрешения — нужен экспорт @2x из Figma;
- референс «острова» (nav island) — уточняется по макету;
- также не подтверждены: привязка части кейсов к врачам (case-5, case-4), названия процедур case-3/4/6, роли/специальности некоторых врачей, `rating.url`, `href` врачей (`#doctors`).

## Документация

- [docs/PLAN.md](docs/PLAN.md) — план работ
- [docs/design-spec.md](docs/design-spec.md) — спецификация дизайна
- [docs/qa/](docs/qa/) — отчёты QA (скриншоты-доказательства не коммитятся)
- [docs/qa/QA-REPORT.md](docs/qa/QA-REPORT.md) — отчёт QA
- [docs/data-schema.md](docs/data-schema.md) — схема данных
