import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { localizeCategoryName } from "@/lib/localize-entities"
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

type CategoryWithFilters = Prisma.CategoryGetPayload<{
  select: {
    id: true
    slug: true
    translations: {
      select: { name: true }
    }
    categoryAttributes: {
      select: {
        sortOrder: true
        attribute: {
          select: {
            translations: {
              select: {
                locale: true
                name: true
              }
            }
            values: {
              select: {
                translations: {
                  select: {
                    locale: true
                    value: true
                  }
                }
              }
            }
          }
        }
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

const getLocaleFallbacks = (locale: string) => [...new Set([locale, "ua", "en"])]

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const categoryId = parseIntParam(req.nextUrl.searchParams.get("categoryId"))
  const categorySlug = req.nextUrl.searchParams.get("categorySlug")?.trim() || null
  const brandId = parseIntParam(req.nextUrl.searchParams.get("brandId"))
  const categoryWhere: Prisma.CategoryWhereUniqueInput | null = categorySlug
    ? { slug: categorySlug }
    : categoryId
      ? { id: categoryId }
      : null

  const where: Prisma.DeviceWhereInput = {}
  if (categorySlug) where.category = { is: { slug: categorySlug } }
  else if (categoryId) where.categoryId = categoryId
  if (brandId) where.brandId = brandId
  const localeFallbacks = getLocaleFallbacks(locale)

  const [categoryData, brands, categories, priceRange, total] = await Promise.all([
    categoryWhere
      ? prisma.category.findUnique({
        where: categoryWhere,
        select: {
          id: true,
          slug: true,
          translations: {
            where: {
              locale: {
                in: localeFallbacks,
              },
            },
            select: { name: true, locale: true },
          },
          categoryAttributes: {
            orderBy: { sortOrder: "asc" },
            select: {
              sortOrder: true,
              attribute: {
                select: {
                  translations: {
                    where: {
                      locale: {
                        in: localeFallbacks,
                      },
                    },
                    select: {
                      locale: true,
                      name: true,
                    },
                  },
                  values: {
                    orderBy: { id: "asc" },
                    select: {
                      translations: {
                        where: {
                          locale: {
                            in: localeFallbacks,
                          },
                        },
                        select: {
                          locale: true,
                          value: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
      : Promise.resolve(null),
    prisma.brand.findMany({
      where: categoryWhere ? { categories: { some: categoryWhere } } : { devices: { some: where } },
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

  const groupedInfo =
    (categoryData as CategoryWithFilters | null)?.categoryAttributes.reduce<Record<string, string[]>>(
      (acc, categoryAttribute) => {
        const keyTranslation = getPreferredTranslation<AttributeTranslationLike>(
          categoryAttribute.attribute.translations ?? [],
          locale
        )
        const key = keyTranslation?.name?.trim()
        if (!key) return acc

        const values = categoryAttribute.attribute.values
          .map((attributeValue) =>
            getPreferredTranslation<ValueTranslationLike>(attributeValue.translations ?? [], locale)
              ?.value?.trim()
          )
          .filter((value): value is string => Boolean(value))

        if (!values.length) return acc

        if (!acc[key]) {
          acc[key] = []
        }

        for (const value of values) {
          if (!acc[key].includes(value)) {
            acc[key].push(value)
          }
        }

        return acc
      },
      {}
    ) ?? {}

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
    infoLabels: Object.fromEntries(Object.keys(groupedInfo).map((key) => [key, key])),
    priceRange: {
      min: priceRange._min.priceUah ?? null,
      max: priceRange._max.priceUah ?? null,
    },
    total,
  })
}
