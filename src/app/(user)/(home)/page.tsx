import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/ui/container'

import { categoryPrefetch } from '@/actions/server/categoryPrefetch'
import { devicePrefetch } from '@/actions/server/devicePrefetch'

import { withLocalePath } from '@/lib/i18n'
import { localizeCategoryName } from '@/lib/localize-entities'
import { getServerLocale } from '@/lib/server-locale'

import { HomeSlider } from './_components/home-slider'

export const generateMetadata = async () => {
  return {
    title: 'Home Page',
    description: 'V3V - Home Page',
  }
}

type HomePageContent = typeof HOME_CONTENT_BASE

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

const HomePage = async () => {
  const locale = await getServerLocale()
  const isEn = locale === 'en'
  const [categoriesRaw, devicesResponse] = await Promise.all([
    categoryPrefetch({ lang: locale }),
    devicePrefetch({
      lang: locale,
      page: 1,
      limit: 30,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
  ])

  const content = HOME_CONTENT[locale]

  const formatPrice = (price: number | null) => {
    if (price === null) return content.noPrice

    return `${content.fromPrice} ${price.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴`
  }

  const categories = categoriesRaw
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    }))

  const devices = devicesResponse.data
  const featuredDevices = devices.slice(0, 6)

  const categoryById = new Map(categories.map((item) => [item.id, item]))
  const primaryCategoryHref = withLocalePath(
    categories[0] ? `/category/${categories[0].slug}` : '/',
    locale
  )
  const slides = devices
    .filter((device) => device.categoryId && categoryById.has(device.categoryId))
    .slice(0, 8)
    .map((device) => {
      const category = categoryById.get(device.categoryId)
      return {
        id: device.slug,
        title: device.nameLocalized ?? device.name ?? device.slug,
        subtitle: category ? localizeCategoryName(category.slug, category.name, locale) : '',
        imageUrl: device.imageUrl,
        href: `/category/${category?.slug ?? ''}`,
      }
    })

  return (
    <section className="space-y-8 pb-10">
      <HomeSlider slides={slides} />

      <Container className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {content.promoTag}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              {content.promoTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
              {content.promoDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={primaryCategoryHref}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {content.primaryAction}
              </Link>
              <a
                href="#featured-products"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {content.secondaryAction}
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {content.highlights.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{content.storeAdvantageLabel}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{content.categoriesTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{content.categoriesDescription}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => {
              const localizedName = localizeCategoryName(category.slug, category.name, locale)

              return (
                <Link
                  key={category.id}
                  href={withLocalePath(`/category/${category.slug}`, locale)}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-lg"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {content.categoryLabel}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{localizedName}</p>
                  <p className="mt-4 text-sm font-medium text-slate-500 transition group-hover:text-slate-900">
                    {content.openSelectionLabel}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        <div
          id="featured-products"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{content.featuredTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{content.featuredDescription}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredDevices.map((device) => (
              <article
                key={device.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <Image
                    src={device.imageUrl}
                    alt={device.nameLocalized ?? device.name ?? device.slug}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                      {device.category?.nameLocalized ?? device.category?.name ?? content.promoTag}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">
                      {device.nameLocalized ?? device.name ?? device.slug}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold text-slate-900">
                      {formatPrice(device.priceUah ?? null)}
                    </p>
                    <Link
                      href={withLocalePath(`/product/${device.id}`, locale)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {content.buyNow}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {content.benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                {content.benefitsTitle}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8">
          <h2 className="text-2xl font-bold">{content.ctaTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            {content.ctaDescription}
          </p>
          <Link
            href={primaryCategoryHref}
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            {content.ctaButton}
          </Link>
        </div>
      </Container>
    </section>
  )
}

export default HomePage
