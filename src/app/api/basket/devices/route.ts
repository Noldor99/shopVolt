import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/prisma/prisma-client"

const parseIntValue = (value: unknown) => {
  const num = Number(value)
  return Number.isInteger(num) ? num : null
}

type BasketWhere = { id: number } | { userId: number } | { tokenId: string }

const resolveBasketWhere = (body: Record<string, unknown>): BasketWhere | null => {
  const basketId = parseIntValue(body?.basketId)
  const userId = parseIntValue(body?.userId)
  const tokenId = typeof body?.tokenId === "string" ? body.tokenId.trim() : ""

  if (basketId && basketId > 0) return { id: basketId }
  if (userId && userId > 0) return { userId }
  if (tokenId) return { tokenId }
  return null
}

const includeBasket = {
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
    orderBy: { createdAt: "desc" as const },
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const basketWhere = resolveBasketWhere(body)
    const deviceId = parseIntValue(body?.deviceId)
    const quantity = Math.max(parseIntValue(body?.quantity) ?? 1, 1)

    if (!basketWhere) {
      return NextResponse.json({ error: "Provide basketId, userId, or tokenId" }, { status: 400 })
    }
    if (!deviceId || deviceId <= 0) {
      return NextResponse.json({ error: "Valid deviceId is required" }, { status: 400 })
    }

    const basket = await prisma.basket.findFirst({ where: basketWhere })
    if (!basket) return NextResponse.json({ error: "Basket not found" }, { status: 404 })

    await prisma.basketDevice.upsert({
      where: {
        basketId_deviceId: {
          basketId: basket.id,
          deviceId,
        },
      },
      create: {
        basketId: basket.id,
        deviceId,
        quantity,
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
    })

    const fullBasket = await prisma.basket.findUnique({
      where: { id: basket.id },
      include: includeBasket,
    })

    return NextResponse.json(fullBasket)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add device to basket", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const basketId = parseIntValue(body?.basketId)
    const deviceId = parseIntValue(body?.deviceId)
    const quantity = parseIntValue(body?.quantity)

    if (!basketId || basketId <= 0) {
      return NextResponse.json({ error: "Valid basketId is required" }, { status: 400 })
    }
    if (!deviceId || deviceId <= 0) {
      return NextResponse.json({ error: "Valid deviceId is required" }, { status: 400 })
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 })
    }

    await prisma.basketDevice.update({
      where: {
        basketId_deviceId: {
          basketId,
          deviceId,
        },
      },
      data: { quantity },
    })

    const basket = await prisma.basket.findUnique({
      where: { id: basketId },
      include: includeBasket,
    })

    return NextResponse.json(basket)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update basket item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const basketId = parseIntValue(body?.basketId)
    const deviceId = parseIntValue(body?.deviceId)

    if (!basketId || basketId <= 0) {
      return NextResponse.json({ error: "Valid basketId is required" }, { status: 400 })
    }
    if (!deviceId || deviceId <= 0) {
      return NextResponse.json({ error: "Valid deviceId is required" }, { status: 400 })
    }

    await prisma.basketDevice.delete({
      where: {
        basketId_deviceId: {
          basketId,
          deviceId,
        },
      },
    })

    const basket = await prisma.basket.findUnique({
      where: { id: basketId },
      include: includeBasket,
    })

    return NextResponse.json(basket)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove basket item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
