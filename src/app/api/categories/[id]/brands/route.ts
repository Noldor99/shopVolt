import { NextRequest, NextResponse } from "next/server"
import type { Brand } from "@prisma/client"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

const parsePositiveInt = (value: string) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

type BrandWithCount = Brand & {
  _count: {
    devices: number
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const locale = resolveLocaleFromRequest(req)
  const categoryKey = params.id.trim()

  if (!categoryKey) {
    return NextResponse.json({ error: "Category id or slug is required" }, { status: 400 })
  }

  const categoryId = parsePositiveInt(categoryKey)
  const category = await prisma.category.findFirst({
    where: categoryId ? { id: categoryId } : { slug: categoryKey },
    select: { id: true, slug: true },
  })

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const brands = await prisma.brand.findMany({
    where: {
      categories: {
        some: { id: category.id },
      },
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          devices: true,
        },
      },
    },
  })

  return NextResponse.json({
    category: {
      id: category.id,
      slug: category.slug,
    },
    locale,
    brands: brands.map((brand: BrandWithCount) => ({
      ...brand,
      nameLocalized: brand.name,
    })),
  })
}
