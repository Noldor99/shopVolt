import { unstable_cache } from 'next/cache'

import { type ReactNode, Suspense } from 'react'

import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

import { Filter } from '@/components/layout/Filter'
import { DeviceListSkeleton, FilterSkeleton } from '@/components/layout/category-content-skeletons'
import { TopBarSkeleton } from '@/components/layout/top-bar'
import { TopBarWrapper } from '@/components/layout/top-bar-wrapper'
import { Container } from '@/components/ui/container'
import { Title } from '@/components/ui/title'

import { apiCategory } from '@/actions/client/categoryAction'

import { getMessages } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { getServerQueryClient } from '@/lib/queryClient'

type MainLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

const getCachedCategories = unstable_cache(
  async (locale: 'ua' | 'en') => {
    return apiCategory.getAll({ lang: locale })
  },
  ['main-layout-categories'],
  { revalidate: 300, tags: ['categories'] }
)

const MainLayout = async ({ children, params }: MainLayoutProps) => {
  const locale = params.locale as Locale
  const queryClient = getServerQueryClient()
  const t = getMessages(locale)

  await queryClient.prefetchQuery({
    queryKey: ['main-layout-categories', locale],
    queryFn: () => getCachedCategories(locale),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="width-max relative z-0 bg-white">
        <Container>
          <Title size="3xl" text={t.common.allParameters} className="font-bold" />
        </Container>
      </div>
      <Suspense fallback={<TopBarSkeleton className="top-[53px] z-40" />}>
        <TopBarWrapper locale={locale} className="top-[53px] z-40" />
      </Suspense>

      <main className="flex-1">
        <div className="container flex w-full flex-1 items-stretch gap-6 py-6">
          <Suspense fallback={<FilterSkeleton />}>
            <Filter />
          </Suspense>
          <div className="min-w-0 flex-1">
            <Suspense fallback={<DeviceListSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </main>
    </HydrationBoundary>
  )
}

export default MainLayout
