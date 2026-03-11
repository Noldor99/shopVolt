import { type ReactNode } from 'react'

import { categoryPrefetch } from '@/actions/server/categoryPrefetch'
import { Filter } from '@/components/layout/Filter'
import { TopBar } from '@/components/layout/top-bar'
import { Container } from '@/components/ui/container'
import { Title } from '@/components/ui/title'
import { getMessages } from '@/lib/i18n'
import { getServerLocale } from '@/lib/server-locale'

type MainLayoutProps = {
  children: ReactNode
}

type CategoryItem = {
  id: number
  name: string
  nameLocalized?: string
  slug: string
}

const MainLayout = async ({ children }: MainLayoutProps) => {
  const locale = await getServerLocale()
  const t = getMessages(locale)
  const categories = await categoryPrefetch({ lang: locale })

  return (
    <>
      <div className="width-max relative z-0 bg-white">
        <Container>
          <Title size="3xl" text={t.common.allParameters} className="font-bold" />
        </Container>
      </div>
      <TopBar
        categories={(categories as CategoryItem[])
          .filter((c: CategoryItem) => c.name.length > 0)
          .map((category) => ({
            ...category,
            name: category.nameLocalized ?? category.name,
          }))}
        className="top-[53px] z-40"
      />

      <main className="flex-1">
        <div className="container flex w-full flex-1 items-stretch gap-6 py-6">
          <Filter />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  )
}

export default MainLayout
