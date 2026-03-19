import { cache } from 'react'

import { categoryPrefetch } from '@/actions/server/categoryPrefetch'
import { devicePrefetch } from '@/actions/server/devicePrefetch'

import type { Locale } from '@/lib/i18n'
import type { ICategory } from '@/types/category'
import type { IDevicesResponse } from '@/types/device'

const emptyDevicesResponse: IDevicesResponse = {
  data: [],
  pagination: { page: 1, limit: 30, total: 0, totalPages: 0 },
}

export type HomePageData = {
  categoriesRaw: ICategory[]
  devicesResponse: IDevicesResponse
}

/**
 * Per-request dedupe: parallel fetches run once if the tree calls this multiple times.
 */
export const getHomePageData = cache(async (locale: Locale): Promise<HomePageData> => {
  try {
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
    return { categoriesRaw, devicesResponse }
  } catch (error) {
    console.error('Failed to prefetch homepage data', {
      locale,
      error: error instanceof Error ? error.message : String(error),
    })
    return { categoriesRaw: [], devicesResponse: emptyDevicesResponse }
  }
})
