import { type Locale } from '@/lib/i18n'

const CATEGORY_BY_SLUG: Record<string, Record<Locale, string>> = {
  plansheti: {
    ua: 'Планшети',
    en: 'Tablets',
  },
  monitory: {
    ua: 'Монітори',
    en: 'Monitors',
  },
}

const INFO_LABELS: Record<string, Record<Locale, string>> = {
  brand: { ua: 'Бренд', en: 'Brand' },
  ram: { ua: "Оперативна пам'ять", en: 'RAM' },
  storage: { ua: "Внутрішня пам'ять", en: 'Internal storage' },
  os: { ua: 'Операційна система', en: 'Operating system' },
  matrix: { ua: 'Тип матриці', en: 'Panel type' },
  processor: { ua: 'Процесор', en: 'Processor' },
  features: { ua: 'Особливості', en: 'Features' },
  color: { ua: 'Колір', en: 'Color' },
  wireless: { ua: 'Звʼязок', en: 'Connectivity' },
  diagonal: { ua: 'Діагональ', en: 'Diagonal' },
  displayTech: { ua: 'Тип матриці', en: 'Panel type' },
  resolution: { ua: 'Роздільна здатність', en: 'Resolution' },
  refreshRate: { ua: 'Частота оновлення', en: 'Refresh rate' },
  backlight: { ua: 'Підсвітка', en: 'Backlight' },
}

export const localizeCategoryName = (slug: string, fallbackName: string, locale: Locale) => {
  return CATEGORY_BY_SLUG[slug]?.[locale] ?? fallbackName
}

export const localizeInfoLabel = (key: string, locale: Locale) => {
  return INFO_LABELS[key]?.[locale] ?? key
}
