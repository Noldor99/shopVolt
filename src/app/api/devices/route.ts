import { NextRequest, NextResponse } from "next/server"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { toSlug } from "@/lib/category-slug"
import { localizeInfoLabel } from "@/lib/localize-entities"
import { prisma } from "@/prisma/prisma-client"

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
  key: string
  value: string
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
  const deviceType = req.nextUrl.searchParams.get("deviceType")?.trim()
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
  if (deviceType) andConditions.push({ deviceType })
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
            translations: {
              some: {
                OR: getInfoKeyCandidates(info.key).map((candidate) => ({
                  key: candidate,
                  value: { in: info.values },
                })),
              },
            },
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
            translations: true,
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
        const localized = getPreferredTranslation<InfoTranslationLike>(
          item.translations as InfoTranslationLike[] | undefined,
          locale
        )
        return {
          ...item,
          key: localized?.key ?? "",
          value: localized?.value ?? "",
          keyLocalized: localized?.key ?? "",
          valueLocalized: localized?.value ?? "",
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
    const body = (await req.json()) as Record<string, unknown>
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : ""
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((item: unknown): item is string => typeof item === "string").map((item) => item.trim())
      : []

    const translations = normalizeDeviceTranslations(body)
    const info = normalizeInfoInput(Array.isArray(body?.info) ? (body.info as DeviceInfoInput[]) : undefined)

    const categoryId = Number(body?.categoryId)
    const brandId = body?.brandId === null || body?.brandId === undefined ? null : Number(body?.brandId)

    const uaTranslation = translations.find((item) => item.locale === "ua")
    const enTranslation = translations.find((item) => item.locale === "en")
    const baseName = uaTranslation?.name || enTranslation?.name || translations[0]?.name || "device"

    if (!uaTranslation || !enTranslation) {
      return NextResponse.json({ error: "Both Ukrainian and English translations are required" }, { status: 400 })
    }
    if (!imageUrl) return NextResponse.json({ error: "Device imageUrl is required" }, { status: 400 })
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ error: "Valid categoryId is required" }, { status: 400 })
    }
    if (brandId !== null && (!Number.isInteger(brandId) || brandId <= 0)) {
      return NextResponse.json({ error: "brandId must be a positive integer or null" }, { status: 400 })
    }

    const slug = await getUniqueDeviceSlug(baseName)

    const device = await prisma.device.create({
      data: {
        slug,
        imageUrl,
        imageUrls,
        categoryId,
        brandId,
        deviceType: (body?.deviceType as string) ?? "OTHER",
        priceUah: typeof body?.priceUah === "number" ? body.priceUah : null,
        oldPriceUah: typeof body?.oldPriceUah === "number" ? body.oldPriceUah : null,
        rating: typeof body?.rating === "number" ? body.rating : null,
        reviewsCount: typeof body?.reviewsCount === "number" ? body.reviewsCount : null,
        inStock: typeof body?.inStock === "boolean" ? body.inStock : true,
        stockCount: typeof body?.stockCount === "number" ? body.stockCount : null,
        translations: {
          create: translations,
        },
        info: info.length
          ? {
            create: info.map((item) => ({
              translations: {
                create: item.translations,
              },
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
            translations: true,
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
