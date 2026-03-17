import type { Prisma } from "@prisma/client"

export type OrderStatus = Prisma.OrderGetPayload<Record<string, never>>["status"]

type OrderUserPayload = Prisma.UserGetPayload<Record<string, never>>
type OrderPayload = Prisma.OrderGetPayload<{
  include: {
    user: true
  }
}>

export type IOrderUser = Omit<OrderUserPayload, "verified" | "createdAt" | "updatedAt"> & {
  verified: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type IOrder = Omit<OrderPayload, "items" | "createdAt" | "updatedAt" | "user"> & {
  items: Prisma.JsonValue | null
  createdAt: string | Date
  updatedAt: string | Date
  user?: IOrderUser | null
}

export interface IOrdersMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IOrdersResponse {
  data: IOrder[]
  meta: IOrdersMeta
}
