import { withLocalePath, type Locale } from '@/lib/i18n'
import { localizeCategoryName } from '@/lib/localize-entities'

import type { HomePageContent } from './home-content'

import type { ICategory } from '@/types/category'
import type { IDeviceCard } from '@/types/device'

export type HomeCategoryRow = {
  id: number
  slug: string
  name: string
}

export function prepareHomeCategories(categoriesRaw: ICategory[]): HomeCategoryRow[] {
  return categoriesRaw
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    }))
}

export function createFormatPrice(content: HomePageContent, locale: Locale) {
  const isEn = locale === 'en'
  return (price: number | null) => {
    if (price === null) return content.noPrice
    return `${content.fromPrice} ${price.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴`
  }
}

export function buildHomeSliderSlides(
  devices: IDeviceCard[],
  categories: HomeCategoryRow[],
  locale: Locale
) {
  const categoryById = new Map(categories.map((item) => [item.id, item]))
  return devices
    .filter((device) => device.categoryId && categoryById.has(device.categoryId))
    .slice(0, 8)
    .map((device) => {
      const category = categoryById.get(device.categoryId!)
      return {
        id: device.slug,
        title: device.nameLocalized ?? device.name ?? device.slug,
        subtitle: category ? localizeCategoryName(category.slug, category.name, locale) : '',
        imageUrl: device.imageUrl,
        href: `/category/${category?.slug ?? ''}`,
      }
    })
}

export function getPrimaryCategoryHref(categories: HomeCategoryRow[], locale: Locale) {
  return withLocalePath(categories[0] ? `/category/${categories[0].slug}` : '/', locale)
}
