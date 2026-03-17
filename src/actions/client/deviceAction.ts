import { AxiosResponse } from "axios"

import { api } from "@/lib/axios"
import { DeviceSchema } from "@/schema/device"
import type { IDeviceInfoInput, IDeviceSchema } from "@/schema/device"
import { IDevice, IDeviceFiltersResponse, IDeviceInfo, IDevicesResponse } from "@/types/device"

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
  lang?: "ua" | "en"
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

export { DeviceSchema }
export type { IDeviceInfoInput, IDeviceSchema }
export type { IDeviceInfo }
