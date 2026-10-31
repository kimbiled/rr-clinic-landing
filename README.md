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

## Google Analytics 4

Для главной страницы подготовлен GA4 и событие `contact_click` для ссылок WhatsApp, телефона и почты. Считается нажатие, а не отправленное сообщение или состоявшаяся запись. Страницы врачей из Framer в `public/<slug>/` используют отдельный HTML и этим подключением не охвачены.

Для production-сборки в `.env.production` задан публичный идентификатор клиники `G-T5BH579MNG`. Его можно переопределить переменной окружения сборки. Локальная разработка по умолчанию не отправляет события.

1. В GA4 выберите ресурс клиники → Администратор → Потоки данных → веб-поток сайта. Скопируйте Measurement ID вида `G-XXXXXXXXXX`.
2. Создайте `.env.local` по примеру `.env.example` и укажите `VITE_GA_MEASUREMENT_ID`. При сборке на хостинге задайте эту переменную в окружении сборки. После изменения пересоберите сайт командой `npm run build` и опубликуйте новую сборку.
3. Для отчёта по кнопкам создайте в GA4 пользовательские измерения (Custom dimensions) с областью «Событие» для `contact_method`, `placement`, `button_id`: [инструкция Google](https://support.google.com/analytics/answer/14239696). В исследовании используйте фильтр `event_name = contact_click`, показатель «Количество событий» и эти параметры в строках. Например, `header_contact` — кнопка «Связаться» в шапке; `hero_consultation` — первый экран; `doctor_booking_<id>` — запись к врачу; `program_consultation_1`…`3` — кнопки программ; `footer_phone` — телефон в футере.

Событие передаёт способ связи, раздел и технический идентификатор кнопки. Адрес ссылки, телефон, email и текст сообщения в параметры `contact_click` не включаются. Встроенные автоматические события GA4 настраиваются отдельно в веб-потоке.

Без корректного ID тег и обработчики аналитики не подключаются. На `npm run dev` сбор данных выключен по умолчанию; для проверки в DebugView задайте `VITE_GA_DEBUG=true` в `.env.local` и перезапустите сервер. Для продакшна оставьте `false`. Проверка логики: `npm run test:analytics`. Проверить фактическое получение событий в GA4 можно после подключения настоящего ID: [Realtime и DebugView](https://developers.google.com/analytics/devguides/collection/ga4/troubleshoot).

## Структура проекта

```
src/
  App.tsx, main.tsx     точка входа
  components/           carousel, fx, hero, nav, surgeon-menu
  hooks/  theme/  styles/
  data/                 hero.json (контент), types.ts (типы), hero.ts (heroData, getDoctor, getCasesByDoctor, asset)
public/assets/          img/web (оптимизированные картинки), icons, fonts
public/<slug>/          страницы врачей и /privacy-policy из Framer (rr-clinic.kz): index.html, обновлять через
                        `node scripts/framer-pages.mjs` (картинки и JS — с CDN Framer)
assets-src/img/         исходные PNG (не изменяются)
scripts/                optimize-images.sh, validate-data.mjs, framer-pages.mjs
docs/                   PLAN.md, design-spec.md, data-schema.md, qa/, ref/ (референсы дизайна)
legacy/                 прежняя версия на vanilla JS (только для справки; sync-hero-data.sh устарел)
```

## Страницы хирургов и попап консультации

В `public/` сохранены все 24 страницы десяти хирургов, включая лендинги операций. Их список и имена получателей записи — `scripts/surgeon-pages.mjs`. В режиме разработки и `npm run preview` работают адреса вида `/kurmanbayev-rustam/abdominoplasty`, без дописывания `index.html`.

На каждой из этих страниц через 10 секунд видимого пребывания открывается общий попап по макету. Кнопка ведёт в WhatsApp на существующую индивидуальную консультацию текущего хирурга. Таймер приостанавливается в фоновой вкладке; закрытый попап повторно появляется при новом посещении/перезагрузке страницы или возвращении через историю браузера. В рамках одного посещения закрытие окончательное. Главная страница и политика конфиденциальности попап не показывают.

Общие стили и поведение: `public/assets/surgeon-pages.css` и `.js`. Иллюстрация из присланного SVG оптимизирована в `public/assets/img/web/consultation-books.webp`. Мобильные блоки первого экрана и информации о враче используют обычный поток вместо независимых абсолютных координат: адрес, текст, теги, образование и фото учитывают высоту соседних блоков. Масштабирование соответствует мобильному порогу Framer 810 px, автоматическое увеличение текста Safari ограничено до 100%.

Обновление из Framer сохраняет эти изменения:

```bash
node scripts/framer-pages.mjs
# Или конкретные страницы:
node scripts/framer-pages.mjs chatinyan-garik chatinyan-garik/rhinoplasty
npm run test:surgeon-pages
npm run build
```

Синхронизация повторяет запрос с обходом кеша, если Framer вернул пустую оболочку вместо HTML. При отсутствии HTML или правильной ссылки записи она завершится ошибкой, не перезаписывая соответствующий файл. Ссылка берётся из кнопок текущего врача; ошибочные ссылки из клонированных блоков исправляются как в HTML, так и при клике после гидратации Framer.

Для публикации нужно загрузить **весь `dist/`**, включая вложенные каталоги процедур, общие JS/CSS, шрифты и изображение попапа. На статическом хостинге реальные `<route>/index.html` должны обрабатываться до SPA fallback на главную. Страницы всё ещё используют JS, изображения и часть шрифтов с CDN Framer; это расширение существующего переноса, а не полное устранение зависимости от Framer.

## Где править контент

Весь контент (тексты, навигация, врачи, кейсы, рейтинг) — `src/data/hero.json`. Тексты секций ниже первого экрана (программы, путь пациента, каталог операций, отзывы) — `src/data/landing.ts`, работы «до/после» — `src/data/works.json` (файлы: `public/assets/img/web/works/<id>-before.webp` и `-after.webp`). Типы — `src/data/types.ts`, схема и будущий REST — `docs/data-schema.md`. Пути к картинкам в JSON указываются относительно `public/` (например `assets/img/web/statue.webp`). После правок:

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
