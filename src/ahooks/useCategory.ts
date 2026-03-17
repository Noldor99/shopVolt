"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  ICategorySchema,
  QueryCategoryAttributesParams,
  QueryCategoryBrandsParams,
  apiCategory,
} from "@/actions/client/categoryAction"

export const useGetCategory = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ["category"],
    queryFn: () => apiCategory.getAll(),
    enabled,
  })

export const useGetCategoryById = (id: string | number, enabled = true) =>
  useQuery({
    queryKey: ["category", id],
    queryFn: () => apiCategory.getOne(id),
    enabled: Boolean(id) && enabled,
  })

export const useGetCategoryBrands = (
  idOrSlug: string | number,
  params?: QueryCategoryBrandsParams,
  enabled = true
) =>
  useQuery({
    queryKey: ["category", idOrSlug, "brands", params ?? {}],
    queryFn: () => apiCategory.getBrands(idOrSlug, params),
    enabled: Boolean(idOrSlug) && enabled,
  })

export const useGetCategoryAttributes = (
  idOrSlug: string | number,
  params?: QueryCategoryAttributesParams,
  enabled = true
) =>
  useQuery({
    queryKey: ["category", idOrSlug, "attributes", params ?? {}],
    queryFn: () => apiCategory.getAttributes(idOrSlug, params),
    enabled: Boolean(idOrSlug) && enabled,
  })

export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ICategorySchema) => apiCategory.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] })
    },
  })
}

export const useUpdateCategory = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Partial<ICategorySchema>) => apiCategory.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] })
      queryClient.invalidateQueries({ queryKey: ["category", id] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => apiCategory.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] })
    },
  })
}
