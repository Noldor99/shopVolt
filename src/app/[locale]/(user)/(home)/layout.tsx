import { unstable_cache } from 'next/cache'

import { prisma } from '@/prisma/prisma-client'

import { type ReactNode, Suspense } from 'react'

import { TopBar, TopBarSkeleton } from '@/components/layout/top-bar'
import { TopSubBar } from '@/components/layout/top-sub-bar'
import { Container } from '@/components/ui/container'

import { localizeCategoryName } from '@/lib/localize-entities'
import type { Locale } from '@/lib/i18n'

type MainLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

type CategoryItem = {
  id: number
  name: string
  slug: string
}

type CategoryQueryItem = {
  id: number
  slug: string
  translations: Array<{ name: string }>
}

const getCachedCategories = unstable_cache(
  async (locale: string) => {
    return prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale },
          select: { name: true },
          take: 1,
        },
      },
      orderBy: {
        slug: 'asc',
      },
    })
  },
  ['home-layout-categories'],
  { revalidate: 300, tags: ['categories'] }
)

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const locale = params.locale as Locale

  const categories = await getCachedCategories(locale)

  return (
    <>
      <div className="width-max relative z-0 bg-white">
        <TopSubBar locale={locale} />
      </div>
      <Suspense fallback={<TopBarSkeleton className="top-[53px] z-40" />}>
        <TopBar
          categories={categories
            .map((category: CategoryQueryItem) => ({
              id: category.id,
              slug: category.slug,
              name:
                category.translations[0]?.name ??
                localizeCategoryName(category.slug, category.slug, locale),
            }))
            .filter((c: CategoryItem) => c.name.length > 0)
            .map((category: CategoryItem) => ({
              ...category,
              name: localizeCategoryName(category.slug, category.name, locale),
            }))}
          className="top-[53px] z-40"
        />
      </Suspense>

      <main className="flex-1">
        <div className="container flex w-full flex-1 items-stretch gap-6 py-6">
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  )
}

export default MainLayout
