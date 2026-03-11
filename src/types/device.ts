
export type DeviceType = "TABLET" | "MONITOR" | "OTHER"

export interface IEntityTranslation {
  id: number
  locale: string
}

export interface IDeviceTranslation extends IEntityTranslation {
  name: string
  description: string | null
  deviceId: number
}

export interface IDeviceInfoTranslation extends IEntityTranslation {
  key: string
  value: string
  deviceInfoId: number
}

export interface IDeviceInfo {
  id: number
  deviceId: number
  key?: string
  value?: string
  keyLocalized?: string
  valueLocalized?: string
  translations?: IDeviceInfoTranslation[]
  createdAt: string
  updatedAt: string
}

export interface IDevice {
  id: number
  name?: string
  nameLocalized?: string
  slug: string
  imageUrl: string
  imageUrls: string[]
  deviceType: DeviceType
  priceUah: number | null
  oldPriceUah: number | null
  rating: number | null
  reviewsCount: number | null
  inStock: boolean
  stockCount: number | null
  categoryId: number
  category?: {
    id: number
    slug?: string
    name?: string
    nameLocalized?: string
  } | null
  brandId: number | null
  brand?: {
    id: number
    name?: string
    nameLocalized?: string
  } | null
  translations?: IDeviceTranslation[]
  createdAt: string
  updatedAt: string
  info?: IDeviceInfo[]
}

export interface IDevicePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface IDevicesResponse {
  data: IDevice[]
  pagination: IDevicePagination
}

export interface IDeviceFiltersResponse {
  info: Record<string, string[]>
  brands?: Array<{ name: string }>
  categories?: Array<{ id: number; slug: string; name: string; nameLocalized?: string }>
  priceRange: {
    min: number | null
    max: number | null
  }
}
