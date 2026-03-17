import { NextRequest, NextResponse } from "next/server"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { toSlug } from "@/lib/category-slug"
import { localizeInfoLabel } from "@/lib/localize-entities"
import { validateRequest } from "@/lib/validate-request"
import { prisma } from "@/prisma/prisma-client"
import { DeviceSchema } from "@/schema/device"

type TranslationInput = {
  locale?: unknown
  name?: unknown
  description?: unknown
  key?: unknown
  value?: unknown
}

type DeviceInfoInput = {
  key?: unknown
  value?: unknown
  values?: unknown
  keyUa?: unknown
  keyEn?: unknown
  valueUa?: unknown
  valueEn?: unknown
  translations?: unknown
}

type DeviceItemPropertyInput = {
  categoryAttributeId?: unknown
  valueUa?: unknown
  valueEn?: unknown
}

type DeviceItemInput = {
  sku?: unknown
  priceUah?: unknown
  oldPriceUah?: unknown
  stockCount?: unknown
  inStock?: unknown
  mainImage?: unknown
  properties?: unknown
}

type DeviceTranslationLike = {
  locale: string
  name: string
  description: string | null
}

type CategoryTranslationLike = {
  locale: string
  name: string
}

type InfoTranslationLike = {
  locale: string
  value: string
}

type AttributeTranslationLike = {
  locale: string
  name: string
}

type NormalizedInfoItem = {
  translations: Array<{ locale: string; key: string; value: string }>
}

const parseIntParam = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

const normalizeLocale = (value: unknown) => {
  if (typeof value !== "string") return null
  const locale = value.trim().toLowerCase()
  if (!locale) return null
  if (locale === "uk") return "ua"
  return locale
}

const getPreferredTranslation = <
  T extends { locale: string },
>(
  items: T[] | undefined,
  locale: string
) => {
  if (!items?.length) return null
  return (
    items.find((item) => item.locale === locale) ??
    items.find((item) => item.locale === "ua") ??
    items.find((item) => item.locale === "en") ??
    items[0]
  )
}

const normalizeDeviceTranslations = (body: Record<string, unknown>) => {
  const raw = Array.isArray(body?.translations) ? (body.translations as TranslationInput[]) : []

  const fromPayload = raw
    .map((item) => {
      const locale = normalizeLocale(item.locale)
      const name = typeof item?.name === "string" ? item.name.trim() : ""
      const description = typeof item?.description === "string" ? item.description.trim() : null
      if (!locale || !name) return null
      return { locale, name, description }
    })
    .filter((item): item is { locale: string; name: string; description: string | null } => Boolean(item))

  const map = new Map<string, { locale: string; name: string; description: string | null }>()
  for (const item of fromPayload) map.set(item.locale, item)

  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const nameUa = typeof body?.nameUa === "string" ? body.nameUa.trim() : ""
  const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : ""

  if (!map.has("ua")) {
    const fallbackUa = nameUa || name || nameEn
    if (fallbackUa) map.set("ua", { locale: "ua", name: fallbackUa, description: null })
  }
  if (!map.has("en")) {
    const fallbackEn = nameEn || name || nameUa
    if (fallbackEn) map.set("en", { locale: "en", name: fallbackEn, description: null })
  }

  return [...map.values()]
}

const normalizeInfoInput = (items: DeviceInfoInput[] | undefined) => {
  if (!items?.length) return []

  return items.flatMap((item) => {
    const directKey = typeof item?.key === "string" ? item.key.trim() : ""
    const values = Array.isArray(item?.values)
      ? item.values
      : typeof item?.value === "string"
        ? [item.value]
        : []

    const translationsArray = Array.isArray(item?.translations) ? (item.translations as TranslationInput[]) : []
    const translationsMap = new Map<string, { locale: string; key: string; value: string }>()

    for (const tr of translationsArray) {
      const locale = normalizeLocale(tr.locale)
      const key = typeof tr?.key === "string" ? tr.key.trim() : ""
      const value = typeof tr?.value === "string" ? tr.value.trim() : ""
      if (!locale || !key || !value) continue
      translationsMap.set(locale, { locale, key, value })
    }

    const keyUa = typeof item?.keyUa === "string" ? item.keyUa.trim() : ""
    const keyEn = typeof item?.keyEn === "string" ? item.keyEn.trim() : ""
    const valueUa = typeof item?.valueUa === "string" ? item.valueUa.trim() : ""
    const valueEn = typeof item?.valueEn === "string" ? item.valueEn.trim() : ""

    const baseValues = values
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)

    if (!baseValues.length && translationsMap.size) {
      const localizedOnly = [...translationsMap.values()]
      return [
        {
          translations: localizedOnly,
        },
      ]
    }

    return baseValues.map((baseValue) => {
      const localMap = new Map(translationsMap)
      if (!localMap.has("ua")) {
        localMap.set("ua", {
          locale: "ua",
          key: keyUa || directKey,
          value: valueUa || baseValue,
        })
      }
      if (!localMap.has("en")) {
        localMap.set("en", {
          locale: "en",
          key: keyEn || directKey,
          value: valueEn || baseValue,
        })
      }

      return {
        translations: [...localMap.values()].filter((tr) => tr.key && tr.value),
      }
    })
  })
}

const hashString = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

const toStableCode = (value: string, fallbackPrefix: string) => {
  const slug = toSlug(value)
  return slug || `${fallbackPrefix}-${hashString(value)}`
}

const ensureAttributeValueForCategoryAttribute = async (
  categoryAttributeId: number,
  valueUa: string,
  valueEn: string
) => {
  const categoryAttribute = await prisma.categoryAttribute.findUnique({
    where: { id: categoryAttributeId },
    select: { attributeId: true },
  })
  if (!categoryAttribute) return null

  const rawValue = valueEn || valueUa
  const code = toStableCode(rawValue, "value")

  const attributeValue = await prisma.attributeValue.upsert({
    where: {
      attributeId_code: {
        attributeId: categoryAttribute.attributeId,
        code,
      },
    },
    update: {},
    create: {
      attributeId: categoryAttribute.attributeId,
      code,
    },
    select: { id: true },
  })

  if (valueUa) {
    await prisma.attributeValueTranslation.upsert({
      where: {
        attributeValueId_locale: {
          attributeValueId: attributeValue.id,
          locale: "ua",
        },
      },
      update: { value: valueUa },
      create: {
        attributeValueId: attributeValue.id,
        locale: "ua",
        value: valueUa,
      },
    })
  }

  if (valueEn) {
    await prisma.attributeValueTranslation.upsert({
      where: {
        attributeValueId_locale: {
          attributeValueId: attributeValue.id,
          locale: "en",
        },
      },
      update: { value: valueEn },
      create: {
        attributeValueId: attributeValue.id,
        locale: "en",
        value: valueEn,
      },
    })
  }

  return attributeValue.id
}

const ensureInfoBinding = async (categoryId: number, infoItem: NormalizedInfoItem) => {
  const ua = infoItem.translations.find((tr) => tr.locale === "ua")
  const en = infoItem.translations.find((tr) => tr.locale === "en")
  const first = infoItem.translations[0]
  if (!first) return null

  const keyUa = ua?.key || first.key
  const keyEn = en?.key || keyUa
  const valueUa = ua?.value || first.value
  const valueEn = en?.value || valueUa

  const attributeCode = toStableCode(keyEn || keyUa, "attr")
  const attribute = await prisma.attribute.upsert({
    where: { code: attributeCode },
    update: {},
    create: { code: attributeCode },
    select: { id: true },
  })

  await prisma.attributeTranslation.upsert({
    where: {
      attributeId_locale: {
        attributeId: attribute.id,
        locale: "ua",
      },
    },
    update: { name: keyUa },
    create: {
      attributeId: attribute.id,
      locale: "ua",
      name: keyUa,
    },
  })
  await prisma.attributeTranslation.upsert({
    where: {
      attributeId_locale: {
        attributeId: attribute.id,
        locale: "en",
      },
    },
    update: { name: keyEn },
    create: {
      attributeId: attribute.id,
      locale: "en",
      name: keyEn,
    },
  })

  const categoryAttribute = await prisma.categoryAttribute.upsert({
    where: {
      categoryId_attributeId: {
        categoryId,
        attributeId: attribute.id,
      },
    },
    update: {},
    create: {
      categoryId,
      attributeId: attribute.id,
    },
    select: { id: true, attributeId: true },
  })

  const valueId = await ensureAttributeValueForCategoryAttribute(categoryAttribute.id, valueUa, valueEn)
  if (!valueId) return null

  return {
    categoryAttributeId: categoryAttribute.id,
    attributeValueId: valueId,
  }
}

const normalizeDeviceItemsInput = (items: DeviceItemInput[] | undefined) => {
  if (!items?.length) return []

  return items
    .map((item) => {
      const sku = typeof item?.sku === "string" ? item.sku.trim() : ""
      const mainImage = typeof item?.mainImage === "string" ? item.mainImage.trim() : ""
      const priceUah = Number(item?.priceUah)
      const oldPriceRaw = item?.oldPriceUah
      const oldPriceUah =
        oldPriceRaw === null || oldPriceRaw === undefined || oldPriceRaw === ""
          ? null
          : Number(oldPriceRaw)
      const stockCount = Number(item?.stockCount)
      const inStock = typeof item?.inStock === "boolean" ? item.inStock : true
      const propertiesRaw = Array.isArray(item?.properties) ? (item.properties as DeviceItemPropertyInput[]) : []

      if (!sku || !mainImage || !Number.isFinite(priceUah) || !Number.isFinite(stockCount)) return null
      if (oldPriceUah !== null && !Number.isFinite(oldPriceUah)) return null

      const properties = propertiesRaw
        .map((property) => {
          const categoryAttributeId = Number(property?.categoryAttributeId)
          const valueUa = typeof property?.valueUa === "string" ? property.valueUa.trim() : ""
          const valueEn = typeof property?.valueEn === "string" ? property.valueEn.trim() : ""
          if (!Number.isInteger(categoryAttributeId) || categoryAttributeId <= 0 || !valueUa || !valueEn) return null
          return { categoryAttributeId, valueUa, valueEn }
        })
        .filter(
          (property): property is { categoryAttributeId: number; valueUa: string; valueEn: string } => Boolean(property)
        )

      return {
        sku,
        mainImage,
        priceUah: Math.trunc(priceUah),
        oldPriceUah: oldPriceUah === null ? null : Math.trunc(oldPriceUah),
        stockCount: Math.trunc(stockCount),
        inStock,
        properties,
      }
    })
    .filter(
      (item): item is {
        sku: string
        mainImage: string
        priceUah: number
        oldPriceUah: number | null
        stockCount: number
        inStock: boolean
        properties: Array<{ categoryAttributeId: number; valueUa: string; valueEn: string }>
      } => Boolean(item)
    )
}

const getUniqueDeviceSlug = async (baseName: string, excludeId?: number) => {
  const base = toSlug(baseName) || "device"
  let slug = base
  let index = 2

  while (true) {
    const existing = await prisma.device.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })

    if (!existing) return slug
    slug = `${base}-${index}`
    index += 1
  }
}

const parseInfoFilters = (req: NextRequest) => {
  const filters = new Map<string, Set<string>>()

  for (const raw of req.nextUrl.searchParams.getAll("info")) {
    const [rawKey, ...rest] = raw.split(":")
    const key = rawKey?.trim()
    const value = rest.join(":").trim()
    if (!key || !value) continue

    if (!filters.has(key)) filters.set(key, new Set())
    filters.get(key)?.add(value)
  }

  for (const [paramKey, paramValue] of req.nextUrl.searchParams.entries()) {
    if (!paramKey.startsWith("info.")) continue
    const key = paramKey.replace("info.", "").trim()
    if (!key || !paramValue.trim()) continue

    const values = paramValue.split(",").map((value) => value.trim()).filter(Boolean)
    if (!values.length) continue

    if (!filters.has(key)) filters.set(key, new Set())
    values.forEach((value) => filters.get(key)?.add(value))
  }

  return [...filters.entries()].map(([key, values]) => ({ key, values: [...values] }))
}

const getInfoKeyCandidates = (key: string) => {
  const normalized = key.trim()
  if (!normalized) return []

  const candidates = new Set<string>([normalized])

  // Support params like info.displayTech against localized DB keys ("Тип матриці"/"Panel type").
  for (const locale of ["ua", "en"] as const) {
    candidates.add(localizeInfoLabel(normalized, locale))
  }

  return [...candidates].filter(Boolean)
}

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const page = Math.max(parseIntParam(req.nextUrl.searchParams.get("page")) ?? 1, 1)
  const limit = Math.min(Math.max(parseIntParam(req.nextUrl.searchParams.get("limit")) ?? 20, 1), 100)

  const search = req.nextUrl.searchParams.get("search")?.trim()
  const categoryId = parseIntParam(req.nextUrl.searchParams.get("categoryId"))
  const categorySlug = req.nextUrl.searchParams.get("categorySlug")?.trim()
  const brandId = parseIntParam(req.nextUrl.searchParams.get("brandId"))
  const inStockRaw = req.nextUrl.searchParams.get("inStock")
  const inStock = inStockRaw === "true" ? true : inStockRaw === "false" ? false : null
  const minPrice = parseIntParam(req.nextUrl.searchParams.get("minPrice"))
  const maxPrice = parseIntParam(req.nextUrl.searchParams.get("maxPrice"))
  const sortBy = req.nextUrl.searchParams.get("sortBy") || "createdAt"
  const sortOrder = req.nextUrl.searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
  const infoFilters = parseInfoFilters(req)

  const where: Record<string, unknown> = {}
  const andConditions: Record<string, unknown>[] = []

  if (search) {
    andConditions.push({
      translations: {
        some: {
          name: { contains: search, mode: "insensitive" },
        },
      },
    })
  }

  if (categoryId) andConditions.push({ categoryId })
  if (categorySlug) {
    andConditions.push({
      category: {
        is: { slug: categorySlug },
      },
    })
  }
  if (brandId) andConditions.push({ brandId })
  if (inStock !== null) andConditions.push({ inStock })

  if (minPrice !== null || maxPrice !== null) {
    andConditions.push({
      priceUah: {
        ...(minPrice !== null ? { gte: minPrice } : {}),
        ...(maxPrice !== null ? { lte: maxPrice } : {}),
      },
    })
  }

  if (infoFilters.length) {
    for (const info of infoFilters) {
      if (info.key === "brand") {
        andConditions.push({
          brand: {
            is: {
              name: { in: info.values },
            },
          },
        })
        continue
      }

      andConditions.push({
        info: {
          some: {
            AND: [
              {
                categoryAttribute: {
                  is: {
                    attribute: {
                      is: {
                        translations: {
                          some: {
                            name: { in: getInfoKeyCandidates(info.key) },
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                attributeValue: {
                  is: {
                    translations: {
                      some: {
                        value: { in: info.values },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      })
    }
  }

  if (andConditions.length) where.AND = andConditions

  const allowedSortBy = new Set(["createdAt", "priceUah", "rating"])
  const orderBy = { [allowedSortBy.has(sortBy) ? sortBy : "createdAt"]: sortOrder }

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        brand: true,
        info: {
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
        },
      },
    }),
    prisma.device.count({ where }),
  ])

  const data = devices.map((device: any) => {
    const deviceTranslation = getPreferredTranslation<DeviceTranslationLike>(
      device.translations as DeviceTranslationLike[] | undefined,
      locale
    )
    const categoryTranslation = getPreferredTranslation<CategoryTranslationLike>(
      device.category.translations as CategoryTranslationLike[] | undefined,
      locale
    )

    return {
      ...device,
      name: deviceTranslation?.name ?? device.slug,
      nameLocalized: deviceTranslation?.name ?? device.slug,
      descriptionLocalized: deviceTranslation?.description ?? null,
      category: {
        ...device.category,
        nameLocalized: categoryTranslation?.name ?? device.category.slug,
      },
      brand: device.brand
        ? {
          ...device.brand,
          nameLocalized: device.brand.name,
        }
        : device.brand,
      info: device.info.map((item: any) => {
        const keyTranslation = getPreferredTranslation<AttributeTranslationLike>(
          item.categoryAttribute?.attribute?.translations as AttributeTranslationLike[] | undefined,
          locale
        )
        const valueTranslation = getPreferredTranslation<InfoTranslationLike>(
          item.attributeValue?.translations as InfoTranslationLike[] | undefined,
          locale
        )
        return {
          ...item,
          key: keyTranslation?.name ?? "",
          value: valueTranslation?.value ?? "",
          keyLocalized: keyTranslation?.name ?? "",
          valueLocalized: valueTranslation?.value ?? "",
        }
      }),
    }
  })

  return NextResponse.json({
    locale,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { data: body, errorResponse } = await validateRequest(req, DeviceSchema)
    if (errorResponse || !body) return errorResponse

    const imageUrls = (body.imageUrls ?? []).map((item) => item.trim())
    const imageUrl = (body.imageUrl ?? imageUrls[0] ?? "").trim()

    const translations = normalizeDeviceTranslations(body as unknown as Record<string, unknown>)
    const info = normalizeInfoInput(body.info as unknown as DeviceInfoInput[] | undefined)
    const items = normalizeDeviceItemsInput(body.items as unknown as DeviceItemInput[] | undefined)

    const categoryId = body.categoryId
    const brandId = body.brandId ?? null

    const uaTranslation = translations.find((item) => item.locale === "ua")
    const enTranslation = translations.find((item) => item.locale === "en")
    const baseName = uaTranslation?.name || enTranslation?.name || translations[0]?.name || "device"

    if (!uaTranslation || !enTranslation) {
      return NextResponse.json({ error: "Both Ukrainian and English translations are required" }, { status: 400 })
    }
    const slug = await getUniqueDeviceSlug(baseName)

    const preparedInfo = (
      await Promise.all(info.map((item) => ensureInfoBinding(categoryId, item as NormalizedInfoItem)))
    ).filter(
      (item): item is { categoryAttributeId: number; attributeValueId: number } => Boolean(item)
    )

    const preparedItems = await Promise.all(
      items.map(async (item) => {
        const mappedProperties = (
          await Promise.all(
            item.properties.map(async (property) => {
              const attributeValueId = await ensureAttributeValueForCategoryAttribute(
                property.categoryAttributeId,
                property.valueUa,
                property.valueEn
              )
              if (!attributeValueId) return null
              return {
                categoryAttributeId: property.categoryAttributeId,
                attributeValueId,
              }
            })
          )
        ).filter(
          (property): property is { categoryAttributeId: number; attributeValueId: number } => Boolean(property)
        )

        return {
          ...item,
          properties: mappedProperties,
        }
      })
    )

    const device = await prisma.device.create({
      data: {
        slug,
        imageUrl,
        imageUrls,
        categoryId,
        brandId,
        deviceType: body.deviceType ?? "OTHER",
        priceUah: body.priceUah ?? null,
        oldPriceUah: body.oldPriceUah ?? null,
        rating: body.rating ?? null,
        reviewsCount: body.reviewsCount ?? null,
        inStock: body.inStock ?? true,
        stockCount: body.stockCount ?? null,
        translations: {
          create: translations,
        },
        info: info.length
          ? {
            create: preparedInfo.map((item) => ({
              categoryAttributeId: item.categoryAttributeId,
              attributeValueId: item.attributeValueId,
            })),
          }
          : undefined,
        items: preparedItems.length
          ? {
            create: preparedItems.map((item) => ({
              sku: item.sku,
              priceUah: item.priceUah,
              oldPriceUah: item.oldPriceUah,
              stockCount: item.stockCount,
              inStock: item.inStock,
              mainImage: item.mainImage,
              properties: item.properties.length
                ? {
                  create: item.properties.map((property) => ({
                    categoryAttributeId: property.categoryAttributeId,
                    attributeValueId: property.attributeValueId,
                  })),
                }
                : undefined,
            })),
          }
          : undefined,
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        brand: true,
        info: {
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
        },
        items: {
          include: {
            properties: {
              include: {
                attributeValue: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create device", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
