export type HomePageContent = typeof HOME_CONTENT_BASE

const HOME_CONTENT_BASE = {
  promoTag: 'Online tech store',
  promoTitle: 'Everything you need for a smart purchase in one place',
  promoDescription:
    'Browse popular categories, compare featured devices, and choose equipment for work, study, gaming, and everyday use.',
  primaryAction: 'Browse catalog',
  secondaryAction: 'View featured items',
  categoriesTitle: 'Shop by category',
  categoriesDescription: 'Quick access to the most popular product groups in the catalog.',
  featuredTitle: 'Featured products',
  featuredDescription: 'Top picks that users most often view right now.',
  fromPrice: 'from',
  buyNow: 'Buy now',
  noPrice: 'Check price',
  benefitsTitle: 'Why customers choose us',
  benefits: [
    {
      title: 'Assortment',
      description: 'A convenient catalog of devices for home, office, and entertainment.',
    },
    {
      title: 'Fast selection',
      description: 'Clear categories, search, and filters help find the right device faster.',
    },
    {
      title: 'Current offers',
      description: 'Featured positions, new arrivals, and best-value models on one page.',
    },
  ],
  ctaTitle: 'Looking for your next device?',
  ctaDescription:
    'Open the full catalog and choose tablets, monitors, and other equipment with convenient navigation.',
  ctaButton: 'Go to catalog',
  highlights: ['Popular categories', 'Featured devices', 'Quick navigation'],
  storeAdvantageLabel: 'Store advantage',
  categoryLabel: 'Category',
  openSelectionLabel: 'Open selection',
}

const HOME_CONTENT = {
  en: HOME_CONTENT_BASE,
  ua: {
    promoTag: 'Інтернет-магазин техніки',
    promoTitle: 'Усе потрібне для вдалої покупки в одному місці',
    promoDescription:
      'Переглядайте популярні категорії, порівнюйте рекомендовані товари та обирайте техніку для роботи, навчання, ігор і щоденного використання.',
    primaryAction: 'Перейти до каталогу',
    secondaryAction: 'Дивитись хіти',
    categoriesTitle: 'Покупки за категоріями',
    categoriesDescription: 'Швидкий доступ до найпопулярніших груп товарів у каталозі.',
    featuredTitle: 'Хіти каталогу',
    featuredDescription: 'Добірка товарів, які найчастіше переглядають прямо зараз.',
    fromPrice: 'від',
    buyNow: 'Купити',
    noPrice: 'Ціну уточнюйте',
    benefitsTitle: 'Чому обирають нас',
    benefits: [
      {
        title: 'Асортимент',
        description: 'Зручний каталог техніки для дому, офісу та розваг.',
      },
      {
        title: 'Швидкий вибір',
        description:
          'Зрозумілі категорії, пошук і фільтри допомагають знайти потрібну модель швидше.',
      },
      {
        title: 'Актуальні пропозиції',
        description: 'Популярні позиції, новинки та вигідні моделі зібрані на одній сторінці.',
      },
    ],
    ctaTitle: 'Шукаєте свій наступний девайс?',
    ctaDescription:
      'Відкрийте повний каталог і підберіть планшети, монітори та іншу техніку зі зручною навігацією.',
    ctaButton: 'До каталогу',
    highlights: ['Популярні категорії', 'Рекомендовані товари', 'Швидка навігація'],
    storeAdvantageLabel: 'Перевага магазину',
    categoryLabel: 'Категорія',
    openSelectionLabel: 'Перейти до добірки',
  },
} satisfies Record<string, HomePageContent>

export function getHomeContent(locale: string): HomePageContent {
  return locale === 'ua' ? HOME_CONTENT.ua : HOME_CONTENT.en
}
