import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/prisma/prisma-client"

const parseId = (value: string | null) => {
  if (!value) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(req: NextRequest) {
  const userId = parseId(req.nextUrl.searchParams.get("userId"))
  if (!userId) {
    return NextResponse.json({ error: "userId query param is required" }, { status: 400 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      device: {
        include: {
          category: true,
          brand: true,
          info: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(favorites)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = Number(body?.userId)
    const deviceId = Number(body?.deviceId)

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 })
    }
    if (!Number.isInteger(deviceId) || deviceId <= 0) {
      return NextResponse.json({ error: "Valid deviceId is required" }, { status: 400 })
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      create: { userId, deviceId },
      update: {},
      include: {
        device: true,
      },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create favorite", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = Number(body?.userId)
    const deviceId = Number(body?.deviceId)

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 })
    }
    if (!Number.isInteger(deviceId) || deviceId <= 0) {
      return NextResponse.json({ error: "Valid deviceId is required" }, { status: 400 })
    }

    await prisma.favorite.delete({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove favorite", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
