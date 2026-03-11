import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { toSlug } from "@/lib/category-slug"
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

const getUniqueDeviceSlug = async (name: string, excludeId?: number) => {
  const base = toSlug(name) || "device"
  let slug = base
  let index = 2

  while (true) {
    const existing = await prisma.device.findFirst({
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
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      info: true,
    },
  })

  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 })

  return NextResponse.json(device)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    const body = await req.json()
    const nextName = typeof body?.name === "string" ? body.name.trim() : null
    const imageUrls: string[] = Array.isArray(body?.imageUrls)
      ? body.imageUrls
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
      : []

    const appendInfo = normalizeInfoInput(Array.isArray(body?.appendInfo) ? body.appendInfo : undefined)
    const replaceInfo = normalizeInfoInput(Array.isArray(body?.replaceInfo) ? body.replaceInfo : undefined)
    const slug = nextName ? await getUniqueDeviceSlug(nextName, id) : null

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const device = await tx.device.update({
        where: { id },
        data: {
          ...(nextName ? { name: nextName, slug: slug ?? undefined } : {}),
          ...(typeof body?.imageUrl === "string" ? { imageUrl: body.imageUrl.trim() } : {}),
          ...(Array.isArray(body?.imageUrls)
            ? {
                imageUrls,
              }
            : {}),
          ...(typeof body?.deviceType === "string" ? { deviceType: body.deviceType } : {}),
          ...(typeof body?.priceUah === "number" || body?.priceUah === null ? { priceUah: body.priceUah } : {}),
          ...(typeof body?.oldPriceUah === "number" || body?.oldPriceUah === null ? { oldPriceUah: body.oldPriceUah } : {}),
          ...(typeof body?.rating === "number" || body?.rating === null ? { rating: body.rating } : {}),
          ...(typeof body?.reviewsCount === "number" || body?.reviewsCount === null
            ? { reviewsCount: body.reviewsCount }
            : {}),
          ...(typeof body?.inStock === "boolean" ? { inStock: body.inStock } : {}),
          ...(typeof body?.stockCount === "number" || body?.stockCount === null ? { stockCount: body.stockCount } : {}),
          ...(Number.isInteger(body?.categoryId) ? { categoryId: Number(body.categoryId) } : {}),
          ...(body?.brandId === null || Number.isInteger(body?.brandId) ? { brandId: body.brandId } : {}),
        },
      })

      if (Array.isArray(body?.replaceInfo)) {
        await tx.deviceInfo.deleteMany({ where: { deviceId: id } })
        if (replaceInfo.length) {
          await tx.deviceInfo.createMany({
            data: replaceInfo.map((item) => ({
              deviceId: id,
              key: item.key,
              value: item.value,
            })),
            skipDuplicates: true,
          })
        }
      }

      if (appendInfo.length) {
        await tx.deviceInfo.createMany({
          data: appendInfo.map((item) => ({
            deviceId: id,
            key: item.key,
            value: item.value,
          })),
          skipDuplicates: true,
        })
      }

      return device
    })

    const device = await prisma.device.findUnique({
      where: { id: updated.id },
      include: {
        category: true,
        brand: true,
        info: true,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update device", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ error: "Invalid device id" }, { status: 400 })

  try {
    await prisma.device.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete device", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
