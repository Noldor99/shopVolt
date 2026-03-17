import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { toSlug } from "@/lib/category-slug"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

type TranslationLike = {
  locale: string
  name: string
}

type InfoValueTranslation = {
  value: string
}

type DeviceInfoValueRow = {
  attributeValue: {
    translations: InfoValueTranslation[]
  }
}

type CategoryAttributeRow = {
  id: number
  isRequired: boolean
  isVariant: boolean
  sortOrder: number
  attribute: {
    id: number
    code: string
    translations: TranslationLike[]
  }
  deviceInfos: DeviceInfoValueRow[]
}

const parsePositiveInt = (value: string) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const normalizeLocaleCode = (value: unknown) => {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === "uk") return "ua"
  return normalized
}

const uniqueAttributeCode = async (rawName: string) => {
  const base = toSlug(rawName) || "attribute"
  let code = base
  let index = 2

  while (true) {
    const existing = await prisma.attribute.findUnique({
      where: { code },
      select: { id: true },
    })
    if (!existing) return code
    code = `${base}-${index}`
    index += 1
  }
}

const getPreferredTranslation = <T extends { locale: string }>(items: T[], locale: string) =>
  items.find((item) => item.locale === locale) ??
  items.find((item) => item.locale === "ua") ??
  items.find((item) => item.locale === "en") ??
  items[0] ??
  null

export async function GET(req: NextRequest, { params }: Params) {
  const locale = resolveLocaleFromRequest(req)
  const categoryKey = params.id.trim()

  if (!categoryKey) {
    return NextResponse.json({ error: "Category id or slug is required" }, { status: 400 })
  }

  const categoryId = parsePositiveInt(categoryKey)

  const category = await prisma.category.findFirst({
    where: categoryId ? { id: categoryId } : { slug: categoryKey },
    select: {
      id: true,
      slug: true,
      categoryAttributes: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          isRequired: true,
          isVariant: true,
          sortOrder: true,
          attribute: {
            select: {
              id: true,
              code: true,
              translations: {
                select: {
                  locale: true,
                  name: true,
                },
              },
            },
          },
          deviceInfos: {
            select: {
              attributeValue: {
                select: {
                  translations: {
                    where: { locale },
                    select: {
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

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const attributes = category.categoryAttributes.map((item: CategoryAttributeRow) => {
    const translation = getPreferredTranslation<TranslationLike>(item.attribute.translations, locale)
    const values = Array.from(
      new Set(
        item.deviceInfos
          .flatMap((info: DeviceInfoValueRow) =>
            info.attributeValue.translations.map((translationItem: InfoValueTranslation) => translationItem.value.trim())
          )
          .filter(Boolean)
      )
    )

    return {
      categoryAttributeId: item.id,
      attributeId: item.attribute.id,
      code: item.attribute.code,
      name: translation?.name ?? item.attribute.code,
      isRequired: item.isRequired,
      isVariant: item.isVariant,
      sortOrder: item.sortOrder,
      values,
    }
  })

  return NextResponse.json({
    category: {
      id: category.id,
      slug: category.slug,
    },
    locale,
    attributes,
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const categoryId = parsePositiveInt(params.id.trim())
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const nameUa = typeof body?.nameUa === "string" ? body.nameUa.trim() : ""
    const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : ""
    const isVariant = typeof body?.isVariant === "boolean" ? body.isVariant : false
    const fallback = nameUa || nameEn

    if (!fallback) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const code = await uniqueAttributeCode(nameEn || nameUa)
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const attribute = await tx.attribute.create({
        data: { code },
        select: { id: true, code: true },
      })

      const translations = [
        { locale: "ua", name: nameUa || fallback },
        { locale: "en", name: nameEn || fallback },
      ]
      for (const tr of translations) {
        await tx.attributeTranslation.upsert({
          where: {
            attributeId_locale: {
              attributeId: attribute.id,
              locale: tr.locale,
            },
          },
          create: {
            attributeId: attribute.id,
            locale: tr.locale,
            name: tr.name,
          },
          update: {
            name: tr.name,
          },
        })
      }

      const categoryAttribute = await tx.categoryAttribute.upsert({
        where: {
          categoryId_attributeId: {
            categoryId,
            attributeId: attribute.id,
          },
        },
        create: {
          categoryId,
          attributeId: attribute.id,
          isVariant,
        },
        update: {
          isVariant,
        },
        select: {
          id: true,
          isRequired: true,
          isVariant: true,
          sortOrder: true,
          attribute: {
            select: {
              id: true,
              code: true,
              translations: {
                select: {
                  locale: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return categoryAttribute
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create category attribute",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const categoryId = parsePositiveInt(params.id.trim())
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const categoryAttributeId = Number(body?.categoryAttributeId)
    const nameUa = typeof body?.nameUa === "string" ? body.nameUa.trim() : ""
    const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : ""
    const fallback = nameUa || nameEn

    if (!Number.isInteger(categoryAttributeId) || categoryAttributeId <= 0) {
      return NextResponse.json({ error: "categoryAttributeId is required" }, { status: 400 })
    }
    if (!fallback) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const categoryAttribute = await prisma.categoryAttribute.findFirst({
      where: {
        id: categoryAttributeId,
        categoryId,
      },
      select: {
        id: true,
        attributeId: true,
      },
    })

    if (!categoryAttribute) {
      return NextResponse.json({ error: "Category attribute not found" }, { status: 404 })
    }

    const translations = [
      { locale: "ua", name: nameUa || fallback },
      { locale: "en", name: nameEn || fallback },
    ]

    for (const tr of translations) {
      await prisma.attributeTranslation.upsert({
        where: {
          attributeId_locale: {
            attributeId: categoryAttribute.attributeId,
            locale: tr.locale,
          },
        },
        create: {
          attributeId: categoryAttribute.attributeId,
          locale: tr.locale,
          name: tr.name,
        },
        update: {
          name: tr.name,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update category attribute",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const categoryId = parsePositiveInt(params.id.trim())
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const queryCategoryAttributeId = req.nextUrl.searchParams.get("categoryAttributeId")
    const categoryAttributeId = Number(
      body?.categoryAttributeId ?? (queryCategoryAttributeId ? parsePositiveInt(queryCategoryAttributeId) : null)
    )

    if (!Number.isInteger(categoryAttributeId) || categoryAttributeId <= 0) {
      return NextResponse.json({ error: "categoryAttributeId is required" }, { status: 400 })
    }

    const categoryAttribute = await prisma.categoryAttribute.findFirst({
      where: {
        id: categoryAttributeId,
        categoryId,
      },
      select: {
        id: true,
        _count: {
          select: {
            deviceInfos: true,
            deviceItemProperties: true,
          },
        },
      },
    })

    if (!categoryAttribute) {
      return NextResponse.json({ error: "Category attribute not found" }, { status: 404 })
    }

    if ((categoryAttribute._count?.deviceInfos ?? 0) > 0 || (categoryAttribute._count?.deviceItemProperties ?? 0) > 0) {
      return NextResponse.json(
        { error: "Device info is used by products. Remove usage first." },
        { status: 409 }
      )
    }

    await prisma.categoryAttribute.delete({
      where: { id: categoryAttribute.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete category attribute",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

