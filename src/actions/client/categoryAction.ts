import { AxiosResponse } from "axios"
import { z } from "zod"

import { api } from "@/lib/axios"
import { IBrand } from "@/types/brand"
import { ICategory } from "@/types/category"

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type ICategorySchema = z.infer<typeof CategorySchema>

export interface QueryCategoryParams {
  lang?: "ua" | "en"
}

export interface QueryCategoryBrandsParams {
  lang?: "ua" | "en"
}

export interface QueryCategoryAttributesParams {
  lang?: "ua" | "en"
}

export interface ICategoryBrandsResponse {
  category: {
    id: number
    slug: string
  }
  locale: "ua" | "en"
  brands: IBrand[]
}

export interface ICategoryAttribute {
  categoryAttributeId: number
  attributeId: number
  code: string
  name: string
  isRequired: boolean
  isVariant: boolean
  sortOrder: number
  values: string[]
}

export interface ICategoryAttributesResponse {
  category: {
    id: number
    slug: string
  }
  locale: "ua" | "en"
  attributes: ICategoryAttribute[]
}

export interface ApiCategory {
  getAll: (params?: QueryCategoryParams) => Promise<ICategory[]>
  getOne: (id: string | number) => Promise<ICategory>
  getBrands: (idOrSlug: string | number, params?: QueryCategoryBrandsParams) => Promise<ICategoryBrandsResponse>
  getAttributes: (
    idOrSlug: string | number,
    params?: QueryCategoryAttributesParams
  ) => Promise<ICategoryAttributesResponse>
  create: (body: ICategorySchema) => Promise<ICategory>
  update: (id: string | number, body: Partial<ICategorySchema>) => Promise<ICategory>
  remove: (id: string | number) => Promise<{ ok: boolean }>
}

export const apiCategory: ApiCategory = {
  getAll: (params) => api.get("/categories", { params }).then(unwrapData),
  getOne: (id) => api.get(`/categories/${id}`).then(unwrapData),
  getBrands: (idOrSlug, params) =>
    api.get(`/categories/${idOrSlug}/brands`, { params }).then(unwrapData),
  getAttributes: (idOrSlug, params) =>
    api.get(`/categories/${idOrSlug}/attributes`, { params }).then(unwrapData),
  create: (body) => api.post("/categories", body).then(unwrapData),
  update: (id, body) => api.patch(`/categories/${id}`, body).then(unwrapData),
  remove: (id) => api.delete(`/categories/${id}`).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
