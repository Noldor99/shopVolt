import { AxiosResponse } from "axios"
import { z } from "zod"

import { api } from "@/lib/axios"
import { IBrand } from "@/types/brand"

export const BrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type IBrandSchema = z.infer<typeof BrandSchema>

export interface ApiBrand {
  getAll: () => Promise<IBrand[]>
  getOne: (id: string | number) => Promise<IBrand>
  create: (body: IBrandSchema) => Promise<IBrand>
  update: (id: string | number, body: Partial<IBrandSchema>) => Promise<IBrand>
  remove: (id: string | number) => Promise<{ ok: boolean }>
}

export const apiBrand: ApiBrand = {
  getAll: () => api.get("/brands").then(unwrapData),
  getOne: (id) => api.get(`/brands/${id}`).then(unwrapData),
  create: (body) => api.post("/brands", body).then(unwrapData),
  update: (id, body) => api.patch(`/brands/${id}`, body).then(unwrapData),
  remove: (id) => api.delete(`/brands/${id}`).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
