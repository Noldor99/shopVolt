import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { toSlug } from "@/lib/category-slug"
import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { code: string }
}

const normalizeVisualValue = (value: unknown) => {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const toUniqueValueCode = async (attributeId: number, rawValue: string) => {
  const base = toSlug(rawValue) || "value"
  let code = base
  let index = 2

  while (true) {
    const existing = await prisma.attributeValue.findUnique({
      where: {
        attributeId_code: {
          attributeId,
          code,
        },
      },
      select: { id: true },
    })
    if (!existing) return code
    code = `${base}-${index}`
    index += 1
  }
}

export async function GET(_: Request, { params }: Params) {
  try {
    const code = params.code.trim()
    if (!code) {
      return NextResponse.json({ error: "Attribute code is required" }, { status: 400 })
    }

    const values = await prisma.attributeValue.findMany({
      where: {
        attribute: { code },
      },
      include: {
        translations: true,
        _count: {
          select: {
            deviceInfos: true,
            deviceItemProperties: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    })

    return NextResponse.json(values)
  } catch (error) {
    console.error("[ATTRIBUTE_VALUES_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const code = params.code.trim()
    if (!code) {
      return NextResponse.json({ error: "Attribute code is required" }, { status: 400 })
    }

    const body = await req.json()
    const valueUa = typeof body?.valueUa === "string" ? body.valueUa.trim() : ""
    const valueEn = typeof body?.valueEn === "string" ? body.valueEn.trim() : ""
    const visualValue = normalizeVisualValue(body?.visualValue)
    const fallback = valueEn || valueUa

    if (!fallback) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 })
    }

    const attribute = await prisma.attribute.findUnique({
      where: { code },
      select: { id: true },
    })

    if (!attribute) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 })
    }

    const valueCode = await toUniqueValueCode(attribute.id, fallback)
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const attributeValue = await tx.attributeValue.create({
        data: {
          attributeId: attribute.id,
          code: valueCode,
          visualValue,
        },
        select: {
          id: true,
          attributeId: true,
          code: true,
          visualValue: true,
        },
      })

      const translations = [
        { locale: "ua", value: valueUa || fallback },
        { locale: "en", value: valueEn || fallback },
      ]

      for (const tr of translations) {
        await tx.attributeValueTranslation.upsert({
          where: {
            attributeValueId_locale: {
              attributeValueId: attributeValue.id,
              locale: tr.locale,
            },
          },
          create: {
            attributeValueId: attributeValue.id,
            locale: tr.locale,
            value: tr.value,
          },
          update: {
            value: tr.value,
          },
        })
      }

      return tx.attributeValue.findUnique({
        where: { id: attributeValue.id },
        include: {
          translations: true,
          _count: {
            select: {
              deviceInfos: true,
              deviceItemProperties: true,
            },
          },
        },
      })
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[ATTRIBUTE_VALUES_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const code = params.code.trim()
    if (!code) {
      return NextResponse.json({ error: "Attribute code is required" }, { status: 400 })
    }

    const body = await req.json()
    const attributeValueId = Number(body?.attributeValueId)
    const valueUa = typeof body?.valueUa === "string" ? body.valueUa.trim() : ""
    const valueEn = typeof body?.valueEn === "string" ? body.valueEn.trim() : ""
    const visualValue = normalizeVisualValue(body?.visualValue)
    const fallback = valueEn || valueUa

    if (!Number.isInteger(attributeValueId) || attributeValueId <= 0) {
      return NextResponse.json({ error: "attributeValueId is required" }, { status: 400 })
    }
    if (!fallback) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 })
    }

    const value = await prisma.attributeValue.findFirst({
      where: {
        id: attributeValueId,
        attribute: { code },
      },
      select: {
        id: true,
      },
    })

    if (!value) {
      return NextResponse.json({ error: "Attribute value not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.attributeValue.update({
        where: { id: attributeValueId },
        data: { visualValue },
      })

      const translations = [
        { locale: "ua", value: valueUa || fallback },
        { locale: "en", value: valueEn || fallback },
      ]

      for (const tr of translations) {
        await tx.attributeValueTranslation.upsert({
          where: {
            attributeValueId_locale: {
              attributeValueId,
              locale: tr.locale,
            },
          },
          create: {
            attributeValueId,
            locale: tr.locale,
            value: tr.value,
          },
          update: {
            value: tr.value,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[ATTRIBUTE_VALUES_PATCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const code = params.code.trim()
    if (!code) {
      return NextResponse.json({ error: "Attribute code is required" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const attributeValueId = Number(body?.attributeValueId)

    if (!Number.isInteger(attributeValueId) || attributeValueId <= 0) {
      return NextResponse.json({ error: "attributeValueId is required" }, { status: 400 })
    }

    const value = await prisma.attributeValue.findFirst({
      where: {
        id: attributeValueId,
        attribute: { code },
      },
      select: {
        id: true,
        _count: {
          select: {
            deviceInfos: true,
            deviceItemProperties: true,
          },
        },
      },
    })

    if (!value) {
      return NextResponse.json({ error: "Attribute value not found" }, { status: 404 })
    }

    if ((value._count?.deviceInfos ?? 0) > 0 || (value._count?.deviceItemProperties ?? 0) > 0) {
      return NextResponse.json(
        { error: "Value is used by products. Remove usage first." },
        { status: 409 }
      )
    }

    await prisma.attributeValue.delete({
      where: { id: attributeValueId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[ATTRIBUTE_VALUES_DELETE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
