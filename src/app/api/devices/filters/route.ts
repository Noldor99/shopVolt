import { NextRequest, NextResponse } from "next/server"

import { localizeCategoryName, localizeInfoLabel } from "@/lib/localize-entities"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type FilterCategory = {
  id: number
  slug: string
  translations: Array<{ name: string }>
}

const parseIntParam = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const categoryId = parseIntParam(req.nextUrl.searchParams.get("categoryId"))
  const categorySlug = req.nextUrl.searchParams.get("categorySlug")?.trim() || null
  const brandId = parseIntParam(req.nextUrl.searchParams.get("brandId"))
  const deviceType = req.nextUrl.searchParams.get("deviceType")?.trim() || null

  const where: Record<string, unknown> = {}
  if (categoryId) where.categoryId = categoryId
  if (categorySlug) {
    where.category = {
      is: { slug: categorySlug },
    }
  }
  if (brandId) where.brandId = brandId
  if (deviceType) where.deviceType = deviceType

  const [brands, categories, infoRows, priceRange] = await Promise.all([
    prisma.brand.findMany({
      where: {
        devices: {
          some: where,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: {
        devices: {
          some: where,
        },
      },
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale },
          select: { name: true },
          take: 1,
        },
      },
    }),
    prisma.deviceInfoTranslation.findMany({
      where: {
        locale,
        deviceInfo: {
          device: where,
        },
      },
      select: {
        key: true,
        value: true,
      },
      distinct: ["key", "value"],
      orderBy: [{ key: "asc" }, { value: "asc" }],
    }),
    prisma.device.aggregate({
      where,
      _min: {
        priceUah: true,
      },
      _max: {
        priceUah: true,
      },
    }),
  ])

  const groupedInfo = infoRows.reduce<Record<string, string[]>>(
    (acc: Record<string, string[]>, row: { key: string; value: string }) => {
      if (!acc[row.key]) acc[row.key] = []
      acc[row.key].push(row.value)
      return acc
    },
    {}
  )

  return NextResponse.json({
    locale,
    brands: brands.map((brand: { name: string }) => ({
      ...brand,
      nameLocalized: brand.name,
    })),
    categories: categories.map((category: FilterCategory) => {
      const name = category.translations[0]?.name ?? localizeCategoryName(category.slug, category.slug, locale)
      return {
        id: category.id,
        slug: category.slug,
        name,
        nameLocalized: localizeCategoryName(category.slug, name, locale),
      }
    }),
    info: groupedInfo,
    infoLabels: Object.fromEntries(
      Object.keys(groupedInfo).map((key) => [key, localizeInfoLabel(key, locale)])
    ),
    priceRange: {
      min: priceRange._min.priceUah ?? null,
      max: priceRange._max.priceUah ?? null,
    },
  })
}
