import { NextRequest, NextResponse } from "next/server"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { toSlug } from "@/lib/category-slug"
import { prisma } from "@/prisma/prisma-client"

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

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
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

  return NextResponse.json(
    brands.map((brand: { name: string }) => ({
      ...brand,
      nameLocalized: brand.name,
      locale,
    }))
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const categoryIds = parseCategoryIds(body?.categoryIds)

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const slug = await getUniqueBrandSlug(name)
    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        ...(categoryIds.length
          ? {
              categories: {
                connect: categoryIds.map((id) => ({ id })),
              },
            }
          : {}),
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

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
