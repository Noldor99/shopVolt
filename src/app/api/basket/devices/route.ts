import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

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
      deviceItem: {
        include: {
          device: {
            include: {
              translations: true,
              category: {
                include: {
                  translations: true,
                },
              },
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.BasketInclude

type BasketWithRelations = Prisma.BasketGetPayload<{
  include: typeof includeBasket
}>

const mapBasketResponse = (basket: BasketWithRelations | null) => {
  if (!basket) return null

  return {
    ...basket,
    devices: (basket.devices ?? []).map((item) => {
      const rawDevice = item.deviceItem?.device
      const nameUa =
        rawDevice?.translations?.find((translation) => translation.locale === "ua")?.name?.trim() || ""
      const nameEn =
        rawDevice?.translations?.find((translation) => translation.locale === "en")?.name?.trim() || ""

      const categoryNameUa =
        rawDevice?.category?.translations?.find((translation) => translation.locale === "ua")?.name?.trim() || ""
      const categoryNameEn =
        rawDevice?.category?.translations?.find((translation) => translation.locale === "en")?.name?.trim() || ""

      const device = rawDevice
        ? {
            ...rawDevice,
            name: nameEn || nameUa || rawDevice.slug,
            nameLocalized: nameUa || nameEn || rawDevice.slug,
            category: rawDevice.category
              ? {
                  ...rawDevice.category,
                  name: categoryNameEn || categoryNameUa || rawDevice.category.slug,
                  nameLocalized: categoryNameUa || categoryNameEn || rawDevice.category.slug,
                }
              : rawDevice.category,
          }
        : null

      return {
        ...item,
        deviceItemId: item.deviceItemId,
        // Legacy compatibility for UI that still expects basketDevice.deviceId/device
        deviceId: item.deviceItem?.deviceId,
        device,
      }
    }),
  }
}

const resolveDeviceItemId = async (body: Record<string, unknown>) => {
  const directDeviceItemId = parseIntValue(body?.deviceItemId)
  if (directDeviceItemId && directDeviceItemId > 0) {
    const exists = await prisma.deviceItem.findUnique({
      where: { id: directDeviceItemId },
      select: { id: true },
    })
    return exists?.id ?? null
  }

  const legacyDeviceId = parseIntValue(body?.deviceId)
  if (!legacyDeviceId || legacyDeviceId <= 0) return null

  const item = await prisma.deviceItem.findFirst({
    where: { deviceId: legacyDeviceId },
    orderBy: [{ inStock: "desc" }, { id: "asc" }],
    select: { id: true },
  })

  return item?.id ?? null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const basketWhere = resolveBasketWhere(body)
    const deviceItemId = await resolveDeviceItemId(body)
    const quantity = Math.max(parseIntValue(body?.quantity) ?? 1, 1)

    if (!basketWhere) {
      return NextResponse.json({ error: "Provide basketId, userId, or tokenId" }, { status: 400 })
    }
    if (!deviceItemId || deviceItemId <= 0) {
      return NextResponse.json({ error: "Valid deviceItemId (or deviceId) is required" }, { status: 400 })
    }

    const basket = await prisma.basket.findFirst({ where: basketWhere })
    if (!basket) return NextResponse.json({ error: "Basket not found" }, { status: 404 })

    await prisma.basketDevice.upsert({
      where: {
        basketId_deviceItemId: {
          basketId: basket.id,
          deviceItemId,
        },
      },
      create: {
        basketId: basket.id,
        deviceItemId,
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

    return NextResponse.json(mapBasketResponse(fullBasket))
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
    const deviceItemId = await resolveDeviceItemId(body)
    const quantity = parseIntValue(body?.quantity)

    if (!basketId || basketId <= 0) {
      return NextResponse.json({ error: "Valid basketId is required" }, { status: 400 })
    }
    if (!deviceItemId || deviceItemId <= 0) {
      return NextResponse.json({ error: "Valid deviceItemId (or deviceId) is required" }, { status: 400 })
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 })
    }

    await prisma.basketDevice.update({
      where: {
        basketId_deviceItemId: {
          basketId,
          deviceItemId,
        },
      },
      data: { quantity },
    })

    const basket = await prisma.basket.findUnique({
      where: { id: basketId },
      include: includeBasket,
    })

    return NextResponse.json(mapBasketResponse(basket))
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
    const deviceItemId = await resolveDeviceItemId(body)

    if (!basketId || basketId <= 0) {
      return NextResponse.json({ error: "Valid basketId is required" }, { status: 400 })
    }
    if (!deviceItemId || deviceItemId <= 0) {
      return NextResponse.json({ error: "Valid deviceItemId (or deviceId) is required" }, { status: 400 })
    }

    await prisma.basketDevice.delete({
      where: {
        basketId_deviceItemId: {
          basketId,
          deviceItemId,
        },
      },
    })

    const basket = await prisma.basket.findUnique({
      where: { id: basketId },
      include: includeBasket,
    })

    return NextResponse.json(mapBasketResponse(basket))
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove basket item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
