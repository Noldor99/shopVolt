import { NextRequest, NextResponse } from "next/server"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
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

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const brand = await prisma.brand.create({
      data: { name },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
