import { prisma } from '@/prisma/prisma-client'

import { type ReactNode } from 'react'

import { TopBar } from '@/components/layout/top-bar'
import { TopSubBar } from '@/components/layout/top-sub-bar'
import { Container } from '@/components/ui/container'
import { Title } from '@/components/ui/title'

import { localizeCategoryName } from '@/lib/localize-entities'
import { getServerLocale } from '@/lib/server-locale'

type MainLayoutProps = {
  children: ReactNode
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

const MainLayout = async ({ children }: MainLayoutProps) => {
  const locale = await getServerLocale()

  const categories = await prisma.category.findMany({
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

  return (
    <>
      <div className="width-max relative z-0 bg-white">
        <TopSubBar />
      </div>
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

      <main className="flex-1">
        <div className="container flex w-full flex-1 items-stretch gap-6 py-6">
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  )
}

export default MainLayout
