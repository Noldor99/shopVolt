import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { toSlug } from "@/lib/category-slug"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"
import { DevicePatchSchema } from "@/schema/device"

type Params = {
  params: { id: string }
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

type TranslationInput = {
  locale?: unknown
  key?: unknown
  value?: unknown
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

type DeviceInfoWithTranslations = {
  categoryAttribute: {
    attribute: {
      translations: AttributeTranslationLike[]
    }
  }
  attributeValue: {
    translations: InfoTranslationLike[]
  }
}

type DeviceItemPropertyTranslationLike = {
  locale: string
  value: string
}

type DeviceItemPropertyWithTranslations = {
  categoryAttribute: {
    attribute: {
      code: string
      translations: AttributeTranslationLike[]
    }
  }
  attributeValue: {
    translations: DeviceItemPropertyTranslationLike[]
  }
}

type DeviceItemWithProperties = {
  properties: DeviceItemPropertyWithTranslations[]
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeLocale = (value: unknown) => {
  if (typeof value !== "string") return null
  const locale = value.trim().toLowerCase()
  if (!locale) return null
  if (locale === "uk") return "ua"
  return locale
}

const getPreferredTranslation = <T extends { locale: string }>(items: T[] | undefined, locale: string) => {
  if (!items?.length) return null
  return (
    items.find((item) => item.locale === locale) ??
    items.find((item) => item.locale === "ua") ??
    items.find((item) => item.locale === "en") ??
    items[0]
  )
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
      return [
        {
          translations: [...translationsMap.values()],
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
        translations: [...localMap.values()].filter((translation) => translation.key && translation.value),
      }
    })
  })
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
      attributeId_locale: { attributeId: attribute.id, locale: "ua" },
    },
    update: { name: keyUa },
    create: { attributeId: attribute.id, locale: "ua", name: keyUa },
  })
  await prisma.attributeTranslation.upsert({
    where: {
      attributeId_locale: { attributeId: attribute.id, locale: "en" },
    },
    update: { name: keyEn },
    create: { attributeId: attribute.id, locale: "en", name: keyEn },
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
    select: { id: true },
  })

  const valueId = await ensureAttributeValueForCategoryAttribute(categoryAttribute.id, valueUa, valueEn)
  if (!valueId) return null
  return { categoryAttributeId: categoryAttribute.id, attributeValueId: valueId }
}

const getUniqueDeviceSlug = async (name: string, excludeId?: number) => {
  const base = toSlug(name) || "device"
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

export async function GET(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })
  const locale = resolveLocaleFromRequest(_)

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      category: true,
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
      },
    },
  })

  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 })

  return NextResponse.json({
    ...device,
    info: (device.info ?? []).map((item: DeviceInfoWithTranslations) => {
      const keyTranslation = getPreferredTranslation<AttributeTranslationLike>(
        item.categoryAttribute?.attribute?.translations as AttributeTranslationLike[],
        locale
      )
      const localized = getPreferredTranslation<InfoTranslationLike>(
        item.attributeValue?.translations as InfoTranslationLike[],
        locale
      )
      return {
        ...item,
        key: keyTranslation?.name ?? "",
        value: localized?.value ?? "",
        keyLocalized: keyTranslation?.name ?? "",
        valueLocalized: localized?.value ?? "",
      }
    }),
    items: (device.items ?? []).map((item: DeviceItemWithProperties) => ({
      ...item,
      properties: item.properties.map((property: DeviceItemPropertyWithTranslations) => {
        const uaTranslation = getPreferredTranslation<DeviceItemPropertyTranslationLike>(
          property.attributeValue?.translations as DeviceItemPropertyTranslationLike[],
          "ua"
        )
        const enTranslation = getPreferredTranslation<DeviceItemPropertyTranslationLike>(
          property.attributeValue?.translations as DeviceItemPropertyTranslationLike[],
          "en"
        )
        return {
          ...property,
          valueUa: uaTranslation?.value ?? "",
          valueEn: enTranslation?.value ?? "",
        }
      }),
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    const rawBody = await req.json()
    const parsedBody = DevicePatchSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsedBody.data
    const has = (key: keyof typeof body) => Object.prototype.hasOwnProperty.call(body, key)
    const nextName = typeof body.name === "string" ? body.name.trim() : null
    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls.map((item: string) => item.trim()) : []

    const replaceInfo = normalizeInfoInput(Array.isArray(body.info) ? body.info : undefined)
    const replaceItems = normalizeDeviceItemsInput(Array.isArray(body.items) ? body.items : undefined)
    const slug = nextName ? await getUniqueDeviceSlug(nextName, id) : null

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const device = await tx.device.update({
        where: { id },
        data: {
          ...(nextName ? { slug: slug ?? undefined } : {}),
          ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl.trim() } : {}),
          ...(has("imageUrls")
            ? {
              imageUrls,
            }
            : {}),
          ...(has("priceUah") ? { priceUah: body.priceUah ?? null } : {}),
          ...(has("oldPriceUah") ? { oldPriceUah: body.oldPriceUah ?? null } : {}),
          ...(has("rating") ? { rating: body.rating ?? null } : {}),
          ...(has("reviewsCount") ? { reviewsCount: body.reviewsCount ?? null } : {}),
          ...(typeof body.inStock === "boolean" ? { inStock: body.inStock } : {}),
          ...(has("stockCount") ? { stockCount: body.stockCount ?? null } : {}),
          ...(has("categoryId") ? { categoryId: Number(body.categoryId) } : {}),
          ...(has("brandId") ? { brandId: body.brandId ?? null } : {}),
        },
      })

      if (has("info")) {
        await tx.deviceInfo.deleteMany({ where: { deviceId: id } })
        if (replaceInfo.length) {
          for (const item of replaceInfo) {
            const binding = await ensureInfoBinding(Number(body.categoryId ?? device.categoryId), item as NormalizedInfoItem)
            if (!binding) continue
            await tx.deviceInfo.create({
              data: {
                deviceId: id,
                categoryAttributeId: binding.categoryAttributeId,
                attributeValueId: binding.attributeValueId,
              },
            })
          }
        }
      }

      if (has("items")) {
        await tx.deviceItem.deleteMany({ where: { deviceId: id } })
        for (const item of replaceItems) {
          const createdItem = await tx.deviceItem.create({
            data: {
              sku: item.sku,
              deviceId: id,
              priceUah: item.priceUah,
              oldPriceUah: item.oldPriceUah,
              stockCount: item.stockCount,
              inStock: item.inStock,
              mainImage: item.mainImage,
            },
          })
          if (item.properties.length) {
            for (const property of item.properties) {
              const attributeValueId = await ensureAttributeValueForCategoryAttribute(
                property.categoryAttributeId,
                property.valueUa,
                property.valueEn
              )
              if (!attributeValueId) continue
              await tx.deviceItemProperty.create({
                data: {
                  deviceItemId: createdItem.id,
                  categoryAttributeId: property.categoryAttributeId,
                  attributeValueId,
                },
              })
            }
          }
        }
      }

      return device
    })

    const device = await prisma.device.findUnique({
      where: { id: updated.id },
      include: {
        category: true,
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

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update device", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    await prisma.device.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete device", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
