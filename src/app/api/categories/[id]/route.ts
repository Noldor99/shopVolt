import { NextRequest, NextResponse } from "next/server"

import { toSlug } from "@/lib/category-slug"
import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
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

export async function GET(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      devices: {
        orderBy: { createdAt: "desc" },
      },
      translations: {
        select: {
          locale: true,
          name: true,
        },
      },
    },
  })

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  return NextResponse.json(category)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  try {
    const locale = resolveLocaleFromRequest(req)
    const body = await req.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const slug = await getUniqueCategorySlug(name, id)

    const category = await prisma.category.update({
      where: { id },
      data: {
        slug,
        translations: {
          upsert: {
            where: {
              categoryId_locale: { categoryId: id, locale },
            },
            create: {
              locale,
              name,
            },
            update: {
              name,
            },
          },
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

    return NextResponse.json({
      id: category.id,
      slug: category.slug,
      name: category.translations[0]?.name ?? name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update category", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 })
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if ((category._count?.devices ?? 0) > 0) {
      return NextResponse.json(
        { error: "Category has devices. Remove or move products first." },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
