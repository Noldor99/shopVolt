import dynamic from 'next/dynamic'

import type { Locale } from '@/lib/i18n'

import { HomePageBody } from './_components/home-page-body'
import { getHomeContent } from './home-content'
import { getHomePageData } from './home-data'
import {
  buildHomeSliderSlides,
  createFormatPrice,
  getPrimaryCategoryHref,
  prepareHomeCategories,
} from './home-utils'

const HomeSlider = dynamic(
  () => import('./_components/home-slider').then((mod) => ({ default: mod.HomeSlider })),
  {
    loading: () => (
      <div
        className="min-h-[320px] w-full animate-pulse rounded-3xl border border-slate-100 bg-slate-200/60 shadow-xl sm:min-h-[420px] md:min-h-[480px]"
        role="status"
        aria-label="Loading hero"
      />
    ),
  }
)

/** ISR: узгоджено з кешем категорій у layout (~5 хв). */
export const revalidate = 300

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const isUa = params.locale === 'ua'
  return {
    title: isUa ? 'Головна — V3V' : 'Home — V3V',
    description: isUa
      ? 'Техніка для дому та офісу: категорії, хіти каталогу та зручна навігація.'
      : 'Tech for home and office: categories, featured picks, and easy navigation.',
  }
}

type HomePageProps = {
  params: { locale: string }
}

const HomePage = async ({ params }: HomePageProps) => {
  const locale = params.locale as Locale
  const { categoriesRaw, devicesResponse } = await getHomePageData(locale)
  const content = getHomeContent(locale)

  const categories = prepareHomeCategories(categoriesRaw)
  const devices = devicesResponse.data
  const featuredDevices = devices.slice(0, 6)
  const slides = buildHomeSliderSlides(devices, categories, locale)
  const primaryCategoryHref = getPrimaryCategoryHref(categories, locale)
  const formatPrice = createFormatPrice(content, locale)

  const imagePriorityCount = slides.length === 0 ? 2 : 0

  return (
    <section className="space-y-8 pb-10">
      <HomeSlider slides={slides} />

      <HomePageBody
        locale={locale}
        content={content}
        categories={categories}
        featuredDevices={featuredDevices}
        primaryCategoryHref={primaryCategoryHref}
        formatPrice={formatPrice}
        imagePriorityCount={imagePriorityCount}
      />
    </section>
  )
}

export default HomePage
