'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { IOrderSchema, QueryOrderParams, apiOrder } from '@/actions/client/orderAction';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: IOrderSchema) => apiOrder.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['order'],
      });
    },
  });
};

export const useUpdateOrder = (id: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Partial<IOrderSchema>) => apiOrder.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['order'],
      });
      queryClient.invalidateQueries({
        queryKey: ['order', id],
      });
    },
  });
};

export const useDeleteOrderById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => apiOrder.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['order'],
      });
    },
  });
};

export const useGetOrder = ({
  enabled = true,
  params,
}: {
  enabled?: boolean;
  params?: QueryOrderParams;
} = {}) =>
  useQuery({
    queryKey: ['order', params ?? {}],
    queryFn: () => apiOrder.getAll(params),
    enabled,
  });

export const useGetOrderById = (id: string | number, enabled = true) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => apiOrder.getOne(id),
    enabled: Boolean(id) && enabled,
  });
