import type { Prisma } from "@prisma/client"

import { deviceInclude, IDevice } from "@/types/device"

type FavoritePayload = Prisma.FavoriteGetPayload<{
  include: {
    device: {
      include: typeof deviceInclude
    }
  }
}>

export type IFavorite = Omit<FavoritePayload, "createdAt" | "updatedAt" | "device"> & {
  createdAt: string | Date
  updatedAt: string | Date
  device?: IDevice
}

export interface IAddFavoriteBody {
  userId: number
  deviceId: number
}
