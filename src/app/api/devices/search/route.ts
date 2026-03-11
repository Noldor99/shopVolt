import { NextRequest, NextResponse } from "next/server"

import { resolveLocaleFromRequest } from "@/lib/request-locale"
import { prisma } from "@/prisma/prisma-client"

export async function GET(req: NextRequest) {
  const locale = resolveLocaleFromRequest(req)
  const query = req.nextUrl.searchParams.get("query") || ""

  const devices = await prisma.device.findMany({
    where: {
      translations: {
        some: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
    },
    take: 5,
    include: {
      translations: true,
      brand: true,
      category: true,
    },
  })

  return NextResponse.json(
    devices.map((device: (typeof devices)[number]) => {
      const preferred =
        device.translations.find((item: (typeof device.translations)[number]) => item.locale === locale) ??
        device.translations.find((item: (typeof device.translations)[number]) => item.locale === "ua") ??
        device.translations.find((item: (typeof device.translations)[number]) => item.locale === "en") ??
        device.translations[0]

      return {
        ...device,
        name: preferred?.name ?? device.slug,
        nameLocalized: preferred?.name ?? device.slug,
      }
    })
  )
}
