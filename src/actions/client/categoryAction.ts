import { AxiosResponse } from "axios"
import { z } from "zod"

import { api } from "@/lib/axios"
import { ICategory } from "@/types/category"

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type ICategorySchema = z.infer<typeof CategorySchema>

export interface QueryCategoryParams {
  lang?: "ua" | "en"
}

export interface ApiCategory {
  getAll: (params?: QueryCategoryParams) => Promise<ICategory[]>
  getOne: (id: string | number) => Promise<ICategory>
  create: (body: ICategorySchema) => Promise<ICategory>
  update: (id: string | number, body: Partial<ICategorySchema>) => Promise<ICategory>
  remove: (id: string | number) => Promise<{ ok: boolean }>
}

export const apiCategory: ApiCategory = {
  getAll: (params) => api.get("/categories", { params }).then(unwrapData),
  getOne: (id) => api.get(`/categories/${id}`).then(unwrapData),
  create: (body) => api.post("/categories", body).then(unwrapData),
  update: (id, body) => api.patch(`/categories/${id}`, body).then(unwrapData),
  remove: (id) => api.delete(`/categories/${id}`).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
