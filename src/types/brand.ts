import type { Prisma } from "@prisma/client"

export const brandInclude = {
  categories: {
    select: {
      id: true,
      slug: true,
    },
  },
  _count: {
    select: {
      devices: true,
    },
  },
} satisfies Prisma.BrandInclude

type BrandPayload = Prisma.BrandGetPayload<{ include: typeof brandInclude }>

export type IBrand = Omit<BrandPayload, "createdAt" | "updatedAt"> & {
  nameLocalized?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export type IBrandDetails = IBrand & {
  devices?: Array<{ id: number }>
}
