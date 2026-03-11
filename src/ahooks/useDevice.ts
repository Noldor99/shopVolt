"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { IDeviceInfoInput, IDeviceSchema, QueryDeviceFilterParams, QueryDeviceParams, apiDevice } from "@/actions/client/deviceAction"

export const useGetDevice = ({
  enabled = true,
  params,
}: {
  enabled?: boolean
  params?: QueryDeviceParams
} = {}) =>
  useQuery({
    queryKey: ["device", params ?? {}],
    queryFn: () => apiDevice.getAll(params),
    enabled,
  })

export const useGetDeviceById = (id: string | number, enabled = true) =>
  useQuery({
    queryKey: ["device", id],
    queryFn: () => apiDevice.getOne(id),
    enabled: Boolean(id) && enabled,
  })

export const useGetDeviceFilters = ({
  enabled = true,
  params,
}: {
  enabled?: boolean
  params?: QueryDeviceFilterParams
} = {}) =>
  useQuery({
    queryKey: ["device-filter", params ?? {}],
    queryFn: () => apiDevice.getFilters(params),
    enabled,
  })

export const useCreateDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IDeviceSchema) => apiDevice.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] })
      queryClient.invalidateQueries({ queryKey: ["device-filter"] })
    },
  })
}

export const useUpdateDevice = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Partial<IDeviceSchema>) => apiDevice.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] })
      queryClient.invalidateQueries({ queryKey: ["device", id] })
      queryClient.invalidateQueries({ queryKey: ["device-filter"] })
    },
  })
}

export const useDeleteDevice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => apiDevice.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] })
      queryClient.invalidateQueries({ queryKey: ["device-filter"] })
    },
  })
}

export const useAddDeviceInfo = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (info: IDeviceInfoInput[]) => apiDevice.addInfo(id, info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] })
      queryClient.invalidateQueries({ queryKey: ["device", id] })
      queryClient.invalidateQueries({ queryKey: ["device-filter"] })
    },
  })
}

export const useRemoveDeviceInfo = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keys?: string[]) => apiDevice.removeInfo(id, keys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] })
      queryClient.invalidateQueries({ queryKey: ["device", id] })
      queryClient.invalidateQueries({ queryKey: ["device-filter"] })
    },
  })
}
