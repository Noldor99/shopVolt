import { NextRequest, NextResponse } from "next/server"

import { toSlug } from "@/lib/category-slug"
import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const parseCategoryIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as number[]
  return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]
}

const getUniqueBrandSlug = async (name: string, excludeId?: number) => {
  const base = toSlug(name) || "brand"
  let slug = base
  let index = 2

  while (true) {
    const existing = await prisma.brand.findFirst({
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
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      categories: {
        select: {
          id: true,
          slug: true,
        },
      },
      devices: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  return NextResponse.json(brand)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const name = typeof body?.name === "string" ? body.name.trim() : null
    const addCategoryIds = parseCategoryIds(body?.addCategoryIds)
    const removeCategoryIds = parseCategoryIds(body?.removeCategoryIds)

    if (name !== null && !name) {
      return NextResponse.json({ error: "Brand name cannot be empty" }, { status: 400 })
    }
    const slug = name ? await getUniqueBrandSlug(name, id) : null
    const categoriesMutation =
      addCategoryIds.length || removeCategoryIds.length
        ? {
            categories: {
              ...(addCategoryIds.length
                ? {
                    connect: addCategoryIds.map((categoryId) => ({ id: categoryId })),
                  }
                : {}),
              ...(removeCategoryIds.length
                ? {
                    disconnect: removeCategoryIds.map((categoryId) => ({ id: categoryId })),
                  }
                : {}),
            },
          }
        : {}

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...(name
          ? {
              name,
              slug: slug ?? undefined,
            }
          : {}),
        ...categoriesMutation,
      },
      include: {
        categories: {
          select: {
            id: true,
            slug: true,
          },
        },
        _count: {
          select: { devices: true },
        },
      },
    })

    return NextResponse.json(brand)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    if ((brand._count?.devices ?? 0) > 0) {
      return NextResponse.json(
        { error: "Brand has products. Remove or move products first." },
        { status: 409 }
      )
    }

    await prisma.brand.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
