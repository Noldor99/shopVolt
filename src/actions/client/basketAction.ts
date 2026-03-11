import { AxiosResponse } from "axios"
import { z } from "zod"

import { api } from "@/lib/axios"
import { IBasket } from "@/types/basket"

export const BasketSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  tokenId: z.string().min(1).optional(),
})

export const BasketDeviceSchema = z.object({
  basketId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  tokenId: z.string().min(1).optional(),
  deviceId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().optional(),
})

export type IBasketSchema = z.infer<typeof BasketSchema>
export type IBasketDeviceSchema = z.infer<typeof BasketDeviceSchema>

export interface QueryBasketParams {
  userId?: string | number
  tokenId?: string
}

export interface ApiBasket {
  getOne: (params: QueryBasketParams) => Promise<IBasket | null>
  create: (body: IBasketSchema) => Promise<IBasket>
  addDevice: (body: IBasketDeviceSchema) => Promise<IBasket>
  updateDevice: (body: { basketId: number; deviceId: number; quantity: number }) => Promise<IBasket>
  removeDevice: (body: { basketId: number; deviceId: number }) => Promise<IBasket>
}

export const apiBasket: ApiBasket = {
  getOne: (params) => api.get("/basket", { params }).then(unwrapData),
  create: (body) => api.post("/basket", body).then(unwrapData),
  addDevice: (body) => api.post("/basket/devices", body).then(unwrapData),
  updateDevice: (body) => api.patch("/basket/devices", body).then(unwrapData),
  removeDevice: (body) => api.delete("/basket/devices", { data: body }).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
