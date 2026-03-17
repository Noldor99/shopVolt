import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

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
    orderBy: {
      createdAt: "desc" as const,
    },
  },
} satisfies Prisma.BasketInclude

type BasketWithRelations = Prisma.BasketGetPayload<{
  include: typeof includeBasketRelations
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

export async function GET(req: NextRequest) {
  const where = getBasketWhere(req)
  if (!where) {
    return NextResponse.json({ error: "Provide userId or tokenId query param" }, { status: 400 })
  }

  const basket = await prisma.basket.findFirst({
    where,
    include: includeBasketRelations,
  })

  return NextResponse.json(mapBasketResponse(basket))
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

    return NextResponse.json(mapBasketResponse(basket), { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create basket", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
