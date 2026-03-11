import { AxiosResponse } from "axios"
import { z } from "zod"

import { api } from "@/lib/axios"
import { IDevice, IDeviceFiltersResponse, IDeviceInfo, IDevicesResponse } from "@/types/device"

const DeviceInfoSchema = z.object({
  key: z.string().min(1, "key is required").optional(),
  value: z.string().min(1).optional(),
  values: z.array(z.string().min(1)).optional(),
  translations: z
    .array(
      z.object({
        locale: z.string().min(2),
        key: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
})

export const DeviceSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  translations: z
    .array(
      z.object({
        locale: z.string().min(2),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
  imageUrl: z.string().url("Valid imageUrl is required"),
  imageUrls: z.array(z.string().url()).default([]),
  deviceType: z.enum(["TABLET", "MONITOR", "OTHER"]).default("OTHER"),
  categoryId: z.coerce.number().int().positive(),
  brandId: z.coerce.number().int().positive().nullable().optional(),
  priceUah: z.coerce.number().int().nullable().optional(),
  oldPriceUah: z.coerce.number().int().nullable().optional(),
  rating: z.coerce.number().nullable().optional(),
  reviewsCount: z.coerce.number().int().nullable().optional(),
  inStock: z.boolean().optional(),
  stockCount: z.coerce.number().int().nullable().optional(),
  info: z.array(DeviceInfoSchema).optional().default([]),
})

export type IDeviceSchema = z.infer<typeof DeviceSchema>
export type IDeviceInfoInput = z.infer<typeof DeviceInfoSchema>

export interface QueryDeviceParams {
  lang?: "ua" | "en"
  page?: string | number
  limit?: string | number
  search?: string
  categoryId?: string | number
  categorySlug?: string
  brandId?: string | number
  deviceType?: "TABLET" | "MONITOR" | "OTHER"
  inStock?: boolean
  minPrice?: string | number
  maxPrice?: string | number
  sortBy?: "createdAt" | "priceUah" | "rating" | "name"
  sortOrder?: "asc" | "desc"
  info?: Array<string>
  [key: `info.${string}`]: string | number | boolean | undefined
}

export interface QueryDeviceFilterParams {
  categoryId?: string | number
  categorySlug?: string
  brandId?: string | number
  deviceType?: "TABLET" | "MONITOR" | "OTHER"
}

export interface ApiDevice {
  getAll: (params?: QueryDeviceParams) => Promise<IDevicesResponse>
  getOne: (id: string | number) => Promise<IDevice>
  create: (body: IDeviceSchema) => Promise<IDevice>
  update: (id: string | number, body: Partial<IDeviceSchema>) => Promise<IDevice>
  remove: (id: string | number) => Promise<{ ok: boolean }>
  getFilters: (params?: QueryDeviceFilterParams) => Promise<IDeviceFiltersResponse>
  addInfo: (id: string | number, info: IDeviceInfoInput[]) => Promise<IDevice>
  removeInfo: (id: string | number, keys?: string[]) => Promise<IDevice>
}

export const apiDevice: ApiDevice = {
  getAll: (params) => api.get("/devices", { params }).then(unwrapData),
  getOne: (id) => api.get(`/devices/${id}`).then(unwrapData),
  create: (body) => api.post("/devices", body).then(unwrapData),
  update: (id, body) => api.patch(`/devices/${id}`, body).then(unwrapData),
  remove: (id) => api.delete(`/devices/${id}`).then(unwrapData),
  getFilters: (params) => api.get("/devices/filters", { params }).then(unwrapData),
  addInfo: (id, info) => api.post(`/devices/${id}/info`, { info }).then(unwrapData),
  removeInfo: (id, keys) => api.delete(`/devices/${id}/info`, { data: { keys } }).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data

export type { IDeviceInfo }
