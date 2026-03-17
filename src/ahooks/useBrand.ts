"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { IBrandSchema, IBrandUpdateSchema, apiBrand } from "@/actions/client/brandAction"

export const useGetBrand = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ["brand"],
    queryFn: () => apiBrand.getAll(),
    enabled,
  })

export const useGetBrandById = (id: string | number, enabled = true) =>
  useQuery({
    queryKey: ["brand", id],
    queryFn: () => apiBrand.getOne(id),
    enabled: Boolean(id) && enabled,
  })

export const useCreateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBrandSchema) => apiBrand.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] })
    },
  })
}

export const useUpdateBrand = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBrandUpdateSchema) => apiBrand.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] })
      queryClient.invalidateQueries({ queryKey: ["brand", id] })
      queryClient.invalidateQueries({ queryKey: ["category"] })
    },
  })
}

export const useDeleteBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => apiBrand.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand"] })
      queryClient.invalidateQueries({ queryKey: ["category"] })
    },
  })
}
