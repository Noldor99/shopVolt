import { NextRequest, NextResponse } from "next/server"

import { toSlug } from "@/lib/category-slug"
import { localizeCategoryName } from "@/lib/localize-entities"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type CategoryListItem = {
  id: number
  slug: string
  createdAt: Date
  updatedAt: Date
  translations: Array<{ name: string }>
  _count: { devices: number }
}

const getUniqueCategorySlug = async (name: string, excludeId?: number) => {
  const base = toSlug(name) || "category"
  let slug = base
  let index = 2

  while (true) {
    const existing = await prisma.category.findFirst({
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

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const categories = await prisma.category.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        where: { locale },
        select: { name: true },
        take: 1,
      },
      _count: {
        select: {
          devices: true,
        },
      },
    },
  })

  return NextResponse.json(
    categories.map((category: CategoryListItem) => {
      const name = category.translations[0]?.name ?? localizeCategoryName(category.slug, category.slug, locale)
      return {
        id: category.id,
        slug: category.slug,
        name,
        nameLocalized: localizeCategoryName(category.slug, name, locale),
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        _count: category._count,
      }
    })
  )
}

export async function POST(req: NextRequest) {
  try {
    const locale = resolveLocaleFromRequest(req)
    const body = await req.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const slug = await getUniqueCategorySlug(name)

    const category = await prisma.category.create({
      data: {
        slug,
        translations: {
          create: [{ locale, name }],
        },
      },
      include: {
        translations: {
          where: { locale },
          select: { name: true },
          take: 1,
        },
      },
    })

    return NextResponse.json(
      {
        id: category.id,
        slug: category.slug,
        name: category.translations[0]?.name ?? name,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create category", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
