// Copy for the full-screen menu (design 2026-10-22, "Menu"): section links + the "Ваш запрос. Ваш хирург" list.
// The doctor list follows the design, not hero.json: `href` is the doctor's own page (choosing the entry opens it);
// `doctorId` links an entry to the hero data (marks the doctor currently filtered in the hero).

export interface MenuDoctor {
  /** "Имя Фамилия", as in the design. */
  name: string;
  tags: [string, string];
  doctorId?: string;
  /** The doctor's own page (/<slug>); choosing the entry opens it. */
  href?: string;
}

export const menu = {
  place: 'RR Clinic / Астана',
  eyebrow: 'Знакомство с RR Clinic',
  links: [
    { label: 'О клинике', href: '#trust' },
    { label: 'Направления', href: '#services' },
    { label: 'Врачи', href: '#doctors' },
    { label: 'Цены', href: '#prices' },
  ],
  /** Phones (design 2026-10-29): more sections, no doctor list. */
  mobileLinks: [
    { label: 'О клинике', href: '#trust' },
    { label: 'Направления', href: '#operations' },
    { label: 'Врачи', href: '#doctors' },
    { label: 'До и после', href: '#surgery' },
    // TODO(content): no prices section yet — the operations catalog is the closest.
    { label: 'Цены', href: '#operations' },
    { label: 'Контакты', href: '#contacts' },
  ],
  title: 'Ваш запрос. Ваш хирург',
  subtitle: 'Выберите специалиста и познакомьтесь с его работами',
  /** Row by row, two per row (left, right). */
  doctors: [
    { name: 'Рустам Курманбаев', tags: ['Липомоделирование', 'Абдоминопластика'], doctorId: 'kurmanbaev-rustam', href: '/kurmanbayev-rustam' },
    { name: 'Гарик Чатинян', tags: ['Ринопластика', 'Подтяжка лица'], doctorId: 'chatinyan-garik', href: '/chatinyan-garik' },
    { name: 'Амир Темирханов', tags: ['Коррекция фигуры', 'Подтяжка груди'], doctorId: 'temirkhanov-amir', href: '/temirkhanov-amir' },
    // TODO(content): not in hero.json yet (no photo / cases).
    { name: 'Алина Улагашева', tags: ['Пластика груди', 'Пластика лица'], href: '/ulagasheva-alina' },
    { name: 'Татьяна Романовская', tags: ['Подтяжка лица', 'Блефаропластика'], doctorId: 'romanovskaya-tatyana', href: '/romanovskaya-tatyana' },
    { name: 'Евгений Савельев', tags: ['Пластика груди', 'Повторные операции'], doctorId: 'savelyev-evgeniy', href: '/savelyev-evgeniy' },
    { name: 'Лейла Кодзоева', tags: ['Интимная пластика', 'Пластика груди'], doctorId: 'kodzoeva-leyla', href: '/kodzoeva-leila' },
    { name: 'Томирис Тулепбергенова', tags: ['Блефаропластика', 'Хирург-резидент'], doctorId: 'tulepbergenova-tomiris', href: '/tulepbergenova-tomiris' },
    { name: 'Бауржан Муса', tags: ['Блефаропластика', 'Подтяжка груди'], doctorId: 'musa-baurzhan', href: '/mussa-baurzhan' },
    // TODO(content): not in hero.json yet (no photo / cases).
    { name: 'Анар Темирхан', tags: ['Блефаропластика', 'Резидентура'], href: '/temirkhan-anar' },
  ] satisfies MenuDoctor[],
  help: ['Не знаете, с чего начать?', 'Поможем выбрать направление и врача.'],
  consultLabel: 'Получить консультацию',
  close: 'Закрыть',
};
