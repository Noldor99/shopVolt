import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

type DeviceInfoInput = {
  key?: unknown
  value?: unknown
  values?: unknown
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeInfoInput = (items: DeviceInfoInput[] | undefined) => {
  if (!items?.length) return []

  const normalized = items.flatMap((item) => {
    const key = typeof item?.key === "string" ? item.key.trim() : ""
    if (!key) return []

    const values = Array.isArray(item?.values)
      ? item.values
      : typeof item?.value === "string"
        ? [item.value]
        : []

    return values
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ key, value }))
  })

  const unique = new Map(normalized.map((entry) => [`${entry.key}::${entry.value}`, entry]))
  return [...unique.values()]
}

export async function POST(req: NextRequest, { params }: Params) {
  const deviceId = parseId(params.id)
  if (!deviceId) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    const body = await req.json()
    const info = normalizeInfoInput(Array.isArray(body?.info) ? body.info : undefined)

    if (!info.length) {
      return NextResponse.json({ error: "info array is required" }, { status: 400 })
    }

    await prisma.deviceInfo.createMany({
      data: info.map((item) => ({
        deviceId,
        key: item.key,
        value: item.value,
      })),
      skipDuplicates: true,
    })

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { info: true, brand: true, category: true },
    })

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add device info", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const deviceId = parseId(params.id)
  if (!deviceId) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    const body = await req.json()
    const rawKeys: unknown[] = Array.isArray(body?.keys) ? body.keys : []
    const keys = rawKeys
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())

    if (keys.length) {
      await prisma.deviceInfo.deleteMany({
        where: {
          deviceId,
          key: { in: keys },
        },
      })
    } else {
      await prisma.deviceInfo.deleteMany({
        where: { deviceId },
      })
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { info: true, brand: true, category: true },
    })

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete device info", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
