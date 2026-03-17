'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  IBasketDeviceSchema,
  IBasketSchema,
  QueryBasketParams,
  apiBasket,
} from '@/actions/client/basketAction'
import { IBasket } from '@/types/basket'

const BASKET_KEY = ['basket'] as const

type BasketQueryData = IBasket | null | undefined

function snapshotAllBaskets(queryClient: ReturnType<typeof useQueryClient>) {
  const cache = queryClient.getQueriesData<BasketQueryData>({ queryKey: BASKET_KEY })
  return cache
}

function restoreAllBaskets(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: ReturnType<typeof snapshotAllBaskets>
) {
  snapshot.forEach(([key, data]) => {
    queryClient.setQueryData(key, data)
  })
}

export const useGetBasket = ({
  enabled = true,
  params,
}: {
  enabled?: boolean
  params: QueryBasketParams
}) =>
  useQuery({
    queryKey: [...BASKET_KEY, params ?? {}],
    queryFn: () => apiBasket.getOne(params),
    enabled,
  })

export const useCreateBasket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBasketSchema) => apiBasket.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKET_KEY })
    },
  })
}

export const useAddBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IBasketDeviceSchema) => apiBasket.addDevice(body),

    onMutate: async (newDevice) => {
      await queryClient.cancelQueries({ queryKey: BASKET_KEY })
      const snapshot = snapshotAllBaskets(queryClient)

      queryClient.setQueriesData<BasketQueryData>({ queryKey: BASKET_KEY }, (old) => {
        if (!old) return old
        return {
          ...old,
          devices: [
            ...(old.devices ?? []),
            {
              id: -Date.now(),
              basketId: newDevice.basketId ?? old.id,
              deviceItemId: newDevice.deviceItemId ?? null,
              deviceId: newDevice.deviceId ?? null,
              quantity: newDevice.quantity ?? 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as IBasket['devices'] extends (infer T)[] | undefined ? T : never,
          ],
        }
      })

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        restoreAllBaskets(queryClient, context.snapshot)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BASKET_KEY })
    },
  })
}

export const useUpdateBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: {
      basketId: number
      deviceId?: number
      deviceItemId?: number
      quantity: number
    }) => apiBasket.updateDevice(body),

    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: BASKET_KEY })
      const snapshot = snapshotAllBaskets(queryClient)

      queryClient.setQueriesData<BasketQueryData>({ queryKey: BASKET_KEY }, (old) => {
        if (!old?.devices) return old
        return {
          ...old,
          devices: old.devices.map((item) => {
            const match = updated.deviceItemId
              ? item.deviceItemId === updated.deviceItemId
              : item.deviceId === updated.deviceId
            return match ? { ...item, quantity: updated.quantity } : item
          }),
        }
      })

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        restoreAllBaskets(queryClient, context.snapshot)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BASKET_KEY })
    },
  })
}

export const useRemoveBasketDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { basketId: number; deviceId?: number; deviceItemId?: number }) =>
      apiBasket.removeDevice(body),

    onMutate: async (removed) => {
      await queryClient.cancelQueries({ queryKey: BASKET_KEY })
      const snapshot = snapshotAllBaskets(queryClient)

      queryClient.setQueriesData<BasketQueryData>({ queryKey: BASKET_KEY }, (old) => {
        if (!old?.devices) return old
        return {
          ...old,
          devices: old.devices.filter((item) => {
            const match = removed.deviceItemId
              ? item.deviceItemId === removed.deviceItemId
              : item.deviceId === removed.deviceId
            return !match
          }),
        }
      })

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        restoreAllBaskets(queryClient, context.snapshot)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BASKET_KEY })
    },
  })
}
