"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFavorite } from "@/actions/client/favoriteAction"
import { IAddFavoriteBody } from "@/types/favorite"

export const useGetFavorites = (userId: string | number, enabled = true) =>
  useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => apiFavorite.getAll(userId),
    enabled: Boolean(userId) && enabled,
  })

export const useAddFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IAddFavoriteBody) => apiFavorite.add(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] })
    },
  })
}

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IAddFavoriteBody) => apiFavorite.remove(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] })
    },
  })
}
