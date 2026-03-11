import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/prisma/prisma-client"

type Params = {
  params: { id: string }
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      devices: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  return NextResponse.json(brand)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json(brand)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const id = parseId(params.id)
  if (!id) {
    return NextResponse.json({ error: "Invalid brand id" }, { status: 400 })
  }

  try {
    await prisma.brand.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete brand", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
