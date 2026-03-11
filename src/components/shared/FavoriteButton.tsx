'use client'

import { useAddFavorite, useGetFavorites, useRemoveFavorite } from '@/ahooks/useFavorite'
import { Heart } from 'lucide-react'

import { useSession } from 'next-auth/react'

import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  deviceId: number
  initialIsFavorite?: boolean
}

export const FavoriteButton = ({ deviceId, initialIsFavorite = false }: FavoriteButtonProps) => {
  const { data: session } = useSession()
  const userId = Number((session?.user as { id?: number | string } | undefined)?.id)
  const hasUser = Number.isInteger(userId) && userId > 0

  // Тимчасовий оптимістичний стан до синхронізації з сервером.
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState<boolean | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: favorites } = useGetFavorites(userId, hasUser)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const serverIsFavorite = useMemo(() => {
    if (!hasUser) return initialIsFavorite
    return (favorites ?? []).some((item) => item.deviceId === deviceId)
  }, [deviceId, favorites, hasUser, initialIsFavorite])

  const isFavorite = optimisticIsFavorite ?? serverIsFavorite

  useEffect(() => {
    if (optimisticIsFavorite !== null && optimisticIsFavorite === serverIsFavorite) {
      setOptimisticIsFavorite(null)
    }
  }, [optimisticIsFavorite, serverIsFavorite])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Зупиняємо перехід по посиланню картки

    if (!session || !hasUser) {
      toast.error('Будь ласка, увійдіть в акаунт')
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
