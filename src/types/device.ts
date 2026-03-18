import type { Prisma } from "@prisma/client"

export type DeviceType = "TABLET" | "MONITOR" | "OTHER"

export const deviceInclude = {
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
  items: {
    include: {
      properties: {
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
} satisfies Prisma.DeviceInclude

type DevicePayload = Prisma.DeviceGetPayload<{ include: typeof deviceInclude }>

export type IEntityTranslation = {
  id: number
  locale: string
}

export type IDeviceTranslation = DevicePayload["translations"][number]

export type IDeviceInfo = DevicePayload["info"][number] & {
  key?: string
  value?: string
  keyLocalized?: string
  valueLocalized?: string
}

export type IDeviceItemProperty = DevicePayload["items"][number]["properties"][number] & {
  valueUa?: string
  valueEn?: string
  attributeValue?: (DevicePayload["items"][number]["properties"][number]["attributeValue"] & {
    visualValue?: string | null
  }) | null
}

export type IDeviceItem = Omit<DevicePayload["items"][number], "properties"> & {
  properties?: IDeviceItemProperty[]
}

export type IDevice = Omit<DevicePayload, "items" | "info"> & {
  name?: string
  nameLocalized?: string
  descriptionLocalized?: string | null
  category?: (NonNullable<DevicePayload["category"]> & { name?: string; nameLocalized?: string }) | null
  brand?: (NonNullable<DevicePayload["brand"]> & { nameLocalized?: string }) | null
  info?: IDeviceInfo[]
  items?: IDeviceItem[]
}

export type IDeviceCard = Pick<
  IDevice,
  "id" | "slug" | "imageUrl" | "priceUah" | "rating" | "categoryId" | "brandId" | "name" | "nameLocalized" | "descriptionLocalized"
> & {
  category?: { id: number; slug: string; name?: string; nameLocalized?: string } | null
  brand?: { id: number; name: string; nameLocalized?: string } | null
}

export interface IDevicePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface IDevicesResponse {
  data: IDeviceCard[]
  pagination: IDevicePagination
}

export interface IDeviceFiltersResponse {
  info: Record<string, string[]>
  infoLabels?: Record<string, string>
  brands?: Array<{ name: string }>
  categories?: Array<{ id: number; slug: string; name: string; nameLocalized?: string }>
  total?: number
  priceRange: {
    min: number | null
    max: number | null
  }
}
