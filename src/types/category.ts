import type { Prisma } from "@prisma/client"

export const categoryInclude = {
  translations: true,
  _count: {
    select: {
      devices: true,
    },
  },
} satisfies Prisma.CategoryInclude

type CategoryPayload = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>

export type ICategory = Omit<CategoryPayload, "createdAt" | "updatedAt"> & {
  name: string
  nameLocalized?: string
  createdAt: string | Date
  updatedAt: string | Date
}
