import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/prisma/prisma-client"

const parseId = (value: string | null) => {
  if (!value) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getBasketWhere = (req: NextRequest) => {
  const userId = parseId(req.nextUrl.searchParams.get("userId"))
  const tokenId = req.nextUrl.searchParams.get("tokenId")?.trim() || null

  if (userId) return { userId }
  if (tokenId) return { tokenId }
  return null
}

const includeBasketRelations = {
  devices: {
    include: {
      device: {
        include: {
          category: true,
          brand: true,
          info: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
}

export async function GET(req: NextRequest) {
  const where = getBasketWhere(req)
  if (!where) {
    return NextResponse.json({ error: "Provide userId or tokenId query param" }, { status: 400 })
  }

  const basket = await prisma.basket.findFirst({
    where,
    include: includeBasketRelations,
  })

  if (!basket) return NextResponse.json(null)

  return NextResponse.json(basket)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = Number.isInteger(body?.userId) ? Number(body.userId) : null
    const tokenId = typeof body?.tokenId === "string" ? body.tokenId.trim() : null

    if (!userId && !tokenId) {
      return NextResponse.json({ error: "Provide userId or tokenId" }, { status: 400 })
    }

    const basket = await prisma.basket.upsert({
      where: userId ? { userId } : { tokenId: tokenId! },
      update: {},
      create: {
        userId,
        tokenId,
      },
      include: includeBasketRelations,
    })

    return NextResponse.json(basket, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create basket", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
