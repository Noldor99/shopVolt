import { IDevice } from "@/types/device"

export interface IBasketDevice {
  id: number
  basketId: number
  deviceId: number
  quantity: number
  createdAt: string
  updatedAt: string
  device?: IDevice
}

export interface IBasket {
  id: number
  userId: number | null
  tokenId: string | null
  totalAmount: number
  createdAt: string
  updatedAt: string
  devices?: IBasketDevice[]
}
