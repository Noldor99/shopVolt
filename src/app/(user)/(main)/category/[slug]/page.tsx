import React from 'react'
import type { Metadata } from 'next'

import { QueryDeviceParams } from '@/actions/client/deviceAction'
import { withLocalePath } from '@/lib/i18n'
import { getServerLocale } from '@/lib/server-locale'

import { DeviceCard } from './_components/DeviceCard'

export type PageProps = {
  params: { [key: string]: string | string[] | undefined }
  searchParams?: QueryDeviceParams
}

export const revalidate = 120

export const generateMetadata = async ({ params, searchParams }: PageProps): Promise<Metadata> => {
  const locale = await getServerLocale()
  const rawSlug = params?.slug
  const categorySlug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug)?.trim() || ''
  const canonicalPath = withLocalePath(`/category/${categorySlug}`, locale)
  const pageParam = Number(searchParams?.page)
  const hasPagination = Number.isFinite(pageParam) && pageParam > 1

  const hasFilters = Boolean(
    hasPagination ||
    searchParams?.limit !== undefined ||
    (searchParams?.search && String(searchParams.search).trim()) ||
    searchParams?.brandId ||
    searchParams?.inStock !== undefined ||
    searchParams?.minPrice !== undefined ||
    searchParams?.maxPrice !== undefined ||
    searchParams?.sortBy ||
    searchParams?.sortOrder ||
    searchParams?.info?.length ||
    Object.keys(searchParams ?? {}).some((key) => key.startsWith('info.'))
  )

  return {
    alternates: {
      canonical: canonicalPath,
    },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  }
}

const card = async (props: PageProps) => {
  return (
    <main className="flex-1">
      <div className="md:paper-sharp flex flex-col gap-[30px]">
        <DeviceCard {...props} />
      </div>
    </main>
  )
}

export default card
