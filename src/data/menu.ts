// Copy for the full-screen menu (design 2026-10-22, "Menu"): section links + the "Ваш запрос. Ваш хирург" list.
// The doctor list follows the design, not hero.json: `doctorId` links an entry to the hero data (choosing it
// filters the cases); entries without one (not in the data yet) go to the team section instead.

export interface MenuDoctor {
  /** "Имя Фамилия", as in the design. */
  name: string;
  tags: [string, string];
  doctorId?: string;
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
  title: 'Ваш запрос. Ваш хирург',
  subtitle: 'Выберите специалиста и познакомьтесь с его работами',
  /** Row by row, two per row (left, right). */
  doctors: [
    { name: 'Рустам Курманбаев', tags: ['Липомоделирование', 'Абдоминопластика'], doctorId: 'kurmanbaev-rustam' },
    { name: 'Гарик Чатинян', tags: ['Ринопластика', 'Подтяжка лица'], doctorId: 'chatinyan-garik' },
    { name: 'Амир Темирханов', tags: ['Коррекция фигуры', 'Подтяжка груди'], doctorId: 'temirkhanov-amir' },
    // TODO(content): not in hero.json yet (no photo / cases).
    { name: 'Алина Улагашева', tags: ['Пластика груди', 'Пластика лица'] },
    { name: 'Татьяна Романовская', tags: ['Подтяжка лица', 'Блефаропластика'], doctorId: 'romanovskaya-tatyana' },
    { name: 'Евгений Савельев', tags: ['Пластика груди', 'Повторные операции'], doctorId: 'savelyev-evgeniy' },
    { name: 'Лейла Кодзоева', tags: ['Интимная пластика', 'Пластика груди'], doctorId: 'kodzoeva-leyla' },
    { name: 'Томирис Тулепбергенова', tags: ['Блефаропластика', 'Хирург-резидент'], doctorId: 'tulepbergenova-tomiris' },
    { name: 'Бауржан Муса', tags: ['Блефаропластика', 'Подтяжка груди'], doctorId: 'musa-baurzhan' },
    // TODO(content): not in hero.json yet (no photo / cases).
    { name: 'Анар Темирхан', tags: ['Блефаропластика', 'Резидентура'] },
  ] satisfies MenuDoctor[],
  help: ['Не знаете, с чего начать?', 'Поможем выбрать направление и врача.'],
  consultLabel: 'Получить консультацию',
  close: 'Закрыть',
};
