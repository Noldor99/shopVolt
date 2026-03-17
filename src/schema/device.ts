import { z } from "zod"

export const DeviceInfoSchema = z.object({
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

export const DeviceItemPropertySchema = z.object({
  categoryAttributeId: z.coerce.number().int().positive(),
  valueUa: z.string().min(1, "UA value is required"),
  valueEn: z.string().min(1, "EN value is required"),
})

export const DeviceItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  priceUah: z.coerce.number().int().min(0),
  oldPriceUah: z.coerce.number().int().nullable().optional(),
  stockCount: z.coerce.number().int().min(0),
  inStock: z.boolean().default(true),
  mainImage: z.string().min(1, "Main image is required"),
  properties: z.array(DeviceItemPropertySchema).default([]),
})

export const DeviceSchema = z.object({
  name: z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().min(1, "Name is required").optional()
  ),
  translations: z
    .array(
      z.object({
        locale: z.string().min(2),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).default(''),
  imageUrls: z.array(z.union([z.string().url(), z.literal('')])).default([]),
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
  items: z.array(DeviceItemSchema).optional().default([]),
})

export const DevicePatchSchema = DeviceSchema.partial()

export type IDeviceSchema = z.infer<typeof DeviceSchema>
export type IDevicePatchSchema = z.infer<typeof DevicePatchSchema>
export type IDeviceInfoInput = z.infer<typeof DeviceInfoSchema>
