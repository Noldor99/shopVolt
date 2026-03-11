import { IDevice } from "@/types/device"

export interface IFavorite {
  id: number
  userId: number
  deviceId: number
  createdAt: string
  updatedAt: string
  device?: IDevice
}

export interface IAddFavoriteBody {
  userId: number
  deviceId: number
}
