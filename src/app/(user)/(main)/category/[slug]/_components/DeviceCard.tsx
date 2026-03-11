import Link from 'next/link'
import { getServerSession } from 'next-auth'

import { PaginationServer } from '@/components/pagination/pagination-server'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { QueryDeviceParams } from '@/actions/client/deviceAction'
import { devicePrefetch } from '@/actions/server/devicePrefetch'

import { authOptions } from '@/lib/auth'
import { withLocalePath } from '@/lib/i18n'
import { getServerLocale } from '@/lib/server-locale'
import { cn } from '@/lib/utils'
import { prisma } from '@/prisma/prisma-client'

import { IDevicesResponse } from '@/types/device'

import { PageProps } from '../page'

const PAGE_LIMIT = 9
type DeviceFilters = Omit<QueryDeviceParams, 'limit' | 'page'> & {
  categorySlug?: string
}

const getLocalizedDeviceType = (deviceType: string, locale: 'ua' | 'en') => {
  const labels = {
    TABLET: { ua: 'Планшет', en: 'Tablet' },
    MONITOR: { ua: 'Монітор', en: 'Monitor' },
    OTHER: { ua: 'Інше', en: 'Other' },
  } as const

  return labels[deviceType as keyof typeof labels]?.[locale] ?? deviceType
}

function buildSaveParam(
  searchParams: { [key: string]: unknown } | undefined
): { [key: string]: string }[] {
  if (!searchParams) return []
  const params: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue
    params[key] = Array.isArray(value) ? String(value[0] ?? '') : String(value)
  }
  return Object.keys(params).length > 0 ? [params] : []
}

const fetchFeed = async ({ limit = PAGE_LIMIT, page = 1, filters = {} as DeviceFilters }) => {
  let results: IDevicesResponse
  try {
    results = await devicePrefetch({
      limit,
      page,
      ...filters,
    })
  } catch {
    // External API can be unavailable in local dev; keep page render stable.
    results = {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    }
  }

  const { totalPages } = results.pagination

  return {
    data: results,
    paginationData: {
      hasNextPage: page < totalPages,
      totalPages,
      limit,
      page,
      saveParam: [] as { [key: string]: string }[],
    },
  }
}

export const DeviceCard = async ({ searchParams, params }: PageProps) => {
  const locale = await getServerLocale()
  const session = await getServerSession(authOptions)
  const userId = Number((session?.user as { id?: number | string } | undefined)?.id)
  const pageNumber = Number(searchParams?.page || 1)
  const limit = PAGE_LIMIT
  const page = pageNumber

  const { page: _page, limit: _limit, ...filters } = (searchParams ?? {}) as QueryDeviceParams
  const rawSlug = params?.slug
  const categorySlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug

  const { data, paginationData } = await fetchFeed({
    limit,
    page,
    filters: {
      ...filters,
      lang: locale,
      categorySlug,
    },
  })
  const devices = data.data ?? []
  const favoriteIds = new Set<number>()

  if (Number.isInteger(userId) && userId > 0 && devices.length > 0) {
    const favoriteRows = await prisma.favorite.findMany({
      where: {
        userId,
        deviceId: { in: devices.map((device) => device.id) },
      },
      select: { deviceId: true },
    })

    favoriteRows.forEach((row: { deviceId: number }) => favoriteIds.add(row.deviceId))
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
        )}
      >
        {devices.map((device) => {
          return (
            <Card key={device.id} className="group flex h-full flex-col overflow-hidden">
              <CardHeader className="relative h-56 overflow-hidden">
                <img
                  src={device.imageUrl}
                  alt={device.name}
                  className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  {false && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Новинка
                    </Badge>
                  )}
                  {false && <Badge variant="destructive">Акція</Badge>}
                </div>
                <div className="absolute right-3 top-3">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                    ★ {(device.rating ?? 0).toFixed(1)}
                  </Badge>
                </div>
                <FavoriteButton
                  deviceId={device.id}
                  initialIsFavorite={favoriteIds.has(device.id)}
                />
              </CardHeader>

              <div className="flex-grow">
                <CardContent className="space-y-2 pt-5">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {device.category?.nameLocalized ?? device.category?.name}
                  </div>
                  <CardTitle className="transition-colors">
                    {device.nameLocalized ?? device.name ?? device.slug}
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    {device.brand?.name ?? (locale === 'ua' ? 'Без бренду' : 'No brand')} |{' '}
                    {getLocalizedDeviceType(device.deviceType, locale)}
                  </p>
                </CardContent>
              </div>

              <CardFooter className="mt-auto flex items-end justify-between border-t border-slate-50 pt-5">
                <div className="flex flex-col">
                  {device.priceUah !== null ? (
                    <span className="text-xl font-bold text-slate-900">
                      {device.priceUah.toLocaleString(locale === 'ua' ? 'uk-UA' : 'en-US')} ₴
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">
                      {locale === 'ua' ? 'Ціну уточнюйте' : 'Check price'}
                    </span>
                  )}
                </div>
                <Link href={withLocalePath(`/product/${device.id}`, locale)}>
                  <Button
                    variant="black"
                    size="sm"
                    className="rounded-full shadow-lg shadow-slate-200"
                  >
                    {locale === 'ua' ? 'Купити' : 'Buy'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      {devices.length === 0 && (
        <div className="paper-rounded flex justify-center"> ~list empty~</div>
      )}
      <div>
        {paginationData.totalPages > 1 && (
          <PaginationServer
            {...paginationData}
            saveParam={buildSaveParam(searchParams as { [key: string]: unknown } | undefined)}
          />
        )}
      </div>
    </>
  )
}
