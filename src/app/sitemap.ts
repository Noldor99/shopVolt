import type { MetadataRoute } from 'next'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/prisma/prisma-client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
type SitemapCategoryRow = Prisma.CategoryGetPayload<{ select: { slug: true; updatedAt: true } }>
type SitemapDeviceRow = Prisma.DeviceGetPayload<{ select: { id: true; updatedAt: true } }>

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, devices] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.device.findMany({ select: { id: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 5000 }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category: SitemapCategoryRow) => [
    {
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/en/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ])

  const productPages: MetadataRoute.Sitemap = devices.flatMap((device: SitemapDeviceRow) => [
    {
      url: `${SITE_URL}/product/${device.id}`,
      lastModified: device.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/en/product/${device.id}`,
      lastModified: device.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ])

  return [...staticPages, ...categoryPages, ...productPages]
}
