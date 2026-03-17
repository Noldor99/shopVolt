import type { Prisma } from "@prisma/client"

import { deviceInclude, IDevice } from "@/types/device"

const basketInclude = {
  devices: {
    include: {
      deviceItem: {
        include: {
          device: {
            include: deviceInclude,
          },
        },
      },
    },
  },
} satisfies Prisma.BasketInclude

type BasketPayload = Prisma.BasketGetPayload<{ include: typeof basketInclude }>
type BasketDevicePayload = BasketPayload["devices"][number]

export type IBasketDevice = Omit<BasketDevicePayload, "createdAt" | "updatedAt"> & {
  // Legacy compatibility: old endpoints/UI still use deviceId/device
  deviceId?: number
  device?: IDevice
  createdAt: string | Date
  updatedAt: string | Date
}

export type IBasket = Omit<BasketPayload, "createdAt" | "updatedAt" | "devices"> & {
  createdAt: string | Date
  updatedAt: string | Date
  devices?: IBasketDevice[]
}
