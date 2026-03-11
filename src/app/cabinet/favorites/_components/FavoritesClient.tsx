'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { HeartOff } from 'lucide-react'

import { useGetFavorites, useRemoveFavorite } from '@/ahooks/useFavorite'
import { Button } from '@/components/ui/button'
import { getLocaleFromPathname, withLocalePath } from '@/lib/i18n'

export const FavoritesClient = () => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const isEn = locale === 'en'
  const userId = Number((session?.user as { id?: number | string } | undefined)?.id)

  const { data, isLoading, isError } = useGetFavorites(userId, Number.isInteger(userId) && userId > 0)
  const removeFavoriteMutation = useRemoveFavorite()

  const favorites = data ?? []

  const handleRemove = async (deviceId: number) => {
    if (!Number.isInteger(userId) || userId <= 0) {
      toast.error(isEn ? 'Please sign in first' : 'Будь ласка, увійдіть в акаунт')
      return
    }

    try {
      await removeFavoriteMutation.mutateAsync({ userId, deviceId })
      toast.success(isEn ? 'Removed from favorites' : 'Товар видалено з обраного')
    } catch (error) {
      console.error('Remove favorite failed', error)
      toast.error(isEn ? 'Failed to remove from favorites' : 'Не вдалося видалити товар з обраного')
    }
  }

  if (status === 'loading') {
    return (
      <p className="mt-6 text-sm text-slate-500">
        {isEn ? 'Checking session...' : 'Перевірка сесії...'}
      </p>
    )
  }

  if (!session?.user) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        {isEn ? 'Sign in to view favorites.' : 'Увійдіть у акаунт, щоб переглядати обране.'}
      </p>
    )
  }

  if (isLoading) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        {isEn ? 'Loading favorites...' : 'Завантаження обраного...'}
      </p>
    )
  }

  if (isError) {
    return (
      <p className="mt-6 text-sm text-red-500">
        {isEn
          ? 'Failed to load favorites. Refresh the page or try again later.'
          : 'Не вдалося завантажити обране. Оновіть сторінку або спробуйте пізніше.'}
      </p>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        {isEn ? 'You have no favorite products yet.' : 'У вас поки немає обраних товарів.'}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((favorite) => {
        const device = favorite.device
        if (!device) return null

        const isRemoving = removeFavoriteMutation.isPending

        return (
          <div key={favorite.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <img
              src={device.imageUrl}
              alt={device.nameLocalized ?? device.name ?? device.slug}
              className="h-44 w-full rounded-xl object-cover"
            />
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              {device.category?.nameLocalized ?? device.category?.name}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {device.nameLocalized ?? device.name ?? device.slug}
            </h3>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {device.priceUah !== null
                  ? `${isEn ? 'from' : 'від'} ${device.priceUah.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴`
                  : isEn
                    ? 'Check price'
                    : 'Ціну уточнюйте'}
              </span>
              <Link href={withLocalePath(`/product/${device.id}`, locale)}>
                <Button variant="black" size="sm">
                  {isEn ? 'Open' : 'До товару'}
                </Button>
              </Link>
            </div>

            <Button
              variant="black_out"
              className="mt-3 w-full"
              onClick={() => void handleRemove(device.id)}
              disabled={isRemoving}
            >
              <HeartOff className="mr-2 h-4 w-4" />
              {isEn ? 'Remove from favorites' : 'Прибрати з обраного'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
