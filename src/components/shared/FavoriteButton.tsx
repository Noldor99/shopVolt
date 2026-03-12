'use client'

import { useAddFavorite, useGetFavorites, useRemoveFavorite } from '@/ahooks/useFavorite'
import { apiFavorite } from '@/actions/client/favoriteAction'
import { Heart } from 'lucide-react'

import { useSession } from 'next-auth/react'

import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  deviceId: number
  initialIsFavorite?: boolean
}

const GUEST_FAVORITES_KEY = 'guest-favorites'
const GUEST_FAVORITES_SYNC_PREFIX = 'guest-favorites-synced'

const readGuestFavorites = (): number[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0))]
  } catch {
    return []
  }
}

const writeGuestFavorites = (ids: number[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify([...new Set(ids)]))
}

export const FavoriteButton = ({ deviceId, initialIsFavorite = false }: FavoriteButtonProps) => {
  const { data: session } = useSession()
  const userId = Number((session?.user as { id?: number | string } | undefined)?.id)
  const hasUser = Number.isInteger(userId) && userId > 0
  const queryClient = useQueryClient()

  // Тимчасовий оптимістичний стан до синхронізації з сервером.
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState<boolean | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [guestFavorites, setGuestFavorites] = useState<Set<number>>(new Set())

  const { data: favorites } = useGetFavorites(userId, hasUser)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  useEffect(() => {
    if (!hasUser) {
      setGuestFavorites(new Set(readGuestFavorites()))
    }
  }, [hasUser])

  useEffect(() => {
    if (!hasUser || typeof window === 'undefined') return

    const syncKey = `${GUEST_FAVORITES_SYNC_PREFIX}:${userId}`
    if (sessionStorage.getItem(syncKey) === '1') return

    const guestIds = readGuestFavorites()
    if (guestIds.length === 0) {
      sessionStorage.setItem(syncKey, '1')
      return
    }

    let cancelled = false

    const syncGuestFavorites = async () => {
      try {
        await Promise.all(guestIds.map((id) => apiFavorite.add({ userId, deviceId: id })))
        if (cancelled) return
        queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      } catch {
        // Keep local guest favorites if sync fails.
      } finally {
        if (!cancelled) {
          sessionStorage.setItem(syncKey, '1')
        }
      }
    }

    void syncGuestFavorites()

    return () => {
      cancelled = true
    }
  }, [hasUser, queryClient, userId])

  useEffect(() => {
    if (!hasUser || !favorites) return

    const favoriteIds = [...new Set(favorites.map((item) => item.deviceId))]
    writeGuestFavorites(favoriteIds)
    setGuestFavorites(new Set(favoriteIds))
  }, [favorites, hasUser])

  const serverIsFavorite = useMemo(() => {
    if (!hasUser) return guestFavorites.has(deviceId)
    if (!favorites) return initialIsFavorite
    return (favorites ?? []).some((item) => item.deviceId === deviceId)
  }, [deviceId, favorites, guestFavorites, hasUser, initialIsFavorite])

  const isFavorite = optimisticIsFavorite ?? serverIsFavorite

  useEffect(() => {
    if (optimisticIsFavorite !== null && optimisticIsFavorite === serverIsFavorite) {
      setOptimisticIsFavorite(null)
    }
  }, [optimisticIsFavorite, serverIsFavorite])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Зупиняємо перехід по посиланню картки

    if (!session || !hasUser) {
      const current = new Set(readGuestFavorites())
      const nextState = !isFavorite

      if (nextState) {
        current.add(deviceId)
      } else {
        current.delete(deviceId)
      }

      writeGuestFavorites([...current])
      setGuestFavorites(current)
      setOptimisticIsFavorite(nextState)
      toast.success(nextState ? 'Додано в обране' : 'Видалено з обраного')
      return
    }

    try {
      setIsUpdating(true)
      // Оптимістично змінюємо стан
      const nextState = !isFavorite
      setOptimisticIsFavorite(nextState)

      if (isFavorite) {
        await removeFavorite.mutateAsync({ userId, deviceId })
      } else {
        await addFavorite.mutateAsync({ userId, deviceId })
      }
    } catch (error) {
      // Повертаємо стан назад у разі помилки
      setOptimisticIsFavorite(null)
      toast.error('Помилка при оновленні обраного')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={cn(
        'absolute bottom-3 right-3 rounded-full border bg-white p-2 shadow-sm transition-all active:scale-90',
        isFavorite
          ? 'border-rose-200 text-rose-500'
          : 'border-slate-200 text-slate-500 hover:text-rose-500',
        isUpdating && 'opacity-70'
      )}
    >
      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
    </button>
  )
}
