"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { IBasketDeviceSchema, IBasketSchema, QueryBasketParams, apiBasket } from "@/actions/client/basketAction"

export const useGetBasket = ({
  enabled = true,
  params,
}: {
  enabled?: boolean
  params: QueryBasketParams
}) =>
  useQuery({
    queryKey: ["basket", params ?? {}],
    queryFn: () => apiBasket.getOne(params),
    enabled,
  })

export const useCreateBasket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBasketSchema) => apiBasket.create(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["basket"] })
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ["basket", { userId: variables.userId }] })
      }
      if (variables.tokenId) {
        queryClient.invalidateQueries({ queryKey: ["basket", { tokenId: variables.tokenId }] })
      }
    },
  })
}

export const useAddBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBasketDeviceSchema) => apiBasket.addDevice(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["basket"] })
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ["basket", { userId: variables.userId }] })
      }
      if (variables.tokenId) {
        queryClient.invalidateQueries({ queryKey: ["basket", { tokenId: variables.tokenId }] })
      }
    },
  })
}

export const useUpdateBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { basketId: number; deviceId?: number; deviceItemId?: number; quantity: number }) =>
      apiBasket.updateDevice(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basket"] })
    },
  })
}

export const useRemoveBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { basketId: number; deviceId?: number; deviceItemId?: number }) =>
      apiBasket.removeDevice(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basket"] })
    },
  })
}
