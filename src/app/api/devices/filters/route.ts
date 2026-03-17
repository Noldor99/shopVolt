import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { localizeCategoryName, localizeInfoLabel } from "@/lib/localize-entities"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type FilterCategory = {
  id: number
  slug: string
  translations: Array<{ name: string }>
}

type AttributeTranslationLike = {
  locale: string
  name: string
}

type ValueTranslationLike = {
  locale: string
  value: string
}

type DeviceInfoFilterRow = Prisma.DeviceInfoGetPayload<{
  include: {
    categoryAttribute: {
      include: {
        attribute: {
          include: {
            translations: true
          }
        }
      }
    }
    attributeValue: {
      include: {
        translations: true
      }
    }
  }
}>

const getPreferredTranslation = <T extends { locale: string }>(items: T[], locale: string) =>
  items.find((item) => item.locale === locale) ??
  items.find((item) => item.locale === "ua") ??
  items.find((item) => item.locale === "en") ??
  items[0] ??
  null

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

  const where: Record<string, unknown> = {}
  if (categoryId) where.categoryId = categoryId
  if (categorySlug) {
    where.category = {
      is: { slug: categorySlug },
    }
  }
  if (brandId) where.brandId = brandId

  const [brands, categories, infoRows, priceRange, total] = await Promise.all([
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
    prisma.deviceInfo.findMany({
      where: {
        device: where,
      },
      distinct: ["categoryAttributeId", "attributeValueId"],
      include: {
        categoryAttribute: {
          include: {
            attribute: {
              include: {
                translations: true,
              },
            },
          },
        },
        attributeValue: {
          include: {
            translations: true,
          },
        },
      },
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
    prisma.device.count({
      where,
    }),
  ])

  const groupedInfo = infoRows.reduce<Record<string, string[]>>(
    (acc: Record<string, string[]>, row: DeviceInfoFilterRow) => {
      const keyTranslation = getPreferredTranslation<AttributeTranslationLike>(
        row.categoryAttribute?.attribute?.translations ?? [],
        locale
      )
      const valueTranslation = getPreferredTranslation<ValueTranslationLike>(
        row.attributeValue?.translations ?? [],
        locale
      )
      const key = keyTranslation?.name?.trim()
      const value = valueTranslation?.value?.trim()
      if (!key || !value) return acc
      if (!acc[key]) acc[key] = []
      if (!acc[key].includes(value)) acc[key].push(value)
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
    total,
  })
}
