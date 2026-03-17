'use client'

import { useGetBasket } from '@/ahooks/useBasket'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { usePathname, useRouter } from 'next/navigation'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { apiBasket } from '@/actions/client/basketAction'

import { getOrCreateBasketToken } from '@/lib/basket-token'
import { getLocaleFromPathname, withLocalePath } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { IBasketDevice } from '@/types/basket'

import { Button } from '../ui/button'
import { Title } from '../ui/title'

const getLineTotal = (item: IBasketDevice) => (item.device?.priceUah ?? 0) * item.quantity

export const BasketDrawer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const isEn = locale === 'en'
  const t = {
    basketTitle: isEn ? 'Cart' : 'В кошику',
    loading: isEn ? 'Loading cart...' : 'Завантаження кошика...',
    empty: isEn ? 'Your cart is empty. Add some devices.' : 'Кошик порожній. Додай девайси у кошик.',
    updateError: isEn ? 'Failed to update quantity' : 'Не вдалося оновити кількість',
    removeError: isEn ? 'Failed to remove item' : 'Не вдалося видалити позицію',
    removeAria: isEn ? 'Remove item' : 'Видалити позицію',
    decreaseAria: isEn ? 'Decrease quantity' : 'Зменшити кількість',
    increaseAria: isEn ? 'Increase quantity' : 'Збільшити кількість',
    itemFallback: isEn ? 'Product' : 'Товар',
    noPrice: isEn ? 'Check price' : 'Ціну уточнюйте',
    total: isEn ? 'Total' : 'До сплати',
    checkout: isEn ? 'Place order' : 'Оформити замовлення',
  }

  const router = useRouter()
  const queryClient = useQueryClient()
  const [tokenId, setTokenId] = useState('')
  const [updatingDeviceId, setUpdatingDeviceId] = useState<number | null>(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  useEffect(() => {
    setTokenId(getOrCreateBasketToken())
  }, [])

  const { data, isLoading } = useGetBasket({
    enabled: Boolean(tokenId),
    params: {
      tokenId,
    },
  })

  const currentBasket = data
  const items = currentBasket?.devices ?? []
  const uiTotalAmount = items.reduce((sum, item) => sum + getLineTotal(item), 0)
  const getBasketItemKey = (item: IBasketDevice) => item.deviceItemId ?? item.deviceId ?? item.id

  const handleIncrease = async (targetItem: IBasketDevice) => {
    if (!currentBasket) return
    try {
      setUpdatingDeviceId(getBasketItemKey(targetItem))
      await apiBasket.updateDevice({
        basketId: currentBasket.id,
        deviceItemId: targetItem.deviceItemId,
        quantity: targetItem.quantity + 1,
      })
      await queryClient.invalidateQueries({ queryKey: ['basket'] })
    } catch (error) {
      console.error(error)
      toast.error(t.updateError)
    } finally {
      setUpdatingDeviceId(null)
    }
  }

  const handleDecrease = async (targetItem: IBasketDevice) => {
    if (!currentBasket) return
    try {
      setUpdatingDeviceId(getBasketItemKey(targetItem))
      if (targetItem.quantity <= 1) {
        await apiBasket.removeDevice({
          basketId: currentBasket.id,
          deviceItemId: targetItem.deviceItemId,
        })
      } else {
        await apiBasket.updateDevice({
          basketId: currentBasket.id,
          deviceItemId: targetItem.deviceItemId,
          quantity: targetItem.quantity - 1,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['basket'] })
    } catch (error) {
      console.error(error)
      toast.error(t.updateError)
    } finally {
      setUpdatingDeviceId(null)
    }
  }

  const handleRemove = async (targetItem: IBasketDevice) => {
    if (!currentBasket) return
    try {
      setUpdatingDeviceId(getBasketItemKey(targetItem))
      await apiBasket.removeDevice({
        basketId: currentBasket.id,
        deviceItemId: targetItem.deviceItemId,
      })
      await queryClient.invalidateQueries({ queryKey: ['basket'] })
    } catch (error) {
      console.error(error)
      toast.error(t.removeError)
    } finally {
      setUpdatingDeviceId(null)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex flex-col justify-between bg-[#F4F1EE] pb-0"
      >
        <div className={cn('flex h-full flex-col')}>
          <SheetHeader>
            <Title size="2xl" text={t.basketTitle} />
          </SheetHeader>

          <div className="-mx-6 mt-5 flex-1 overflow-auto px-6 pb-4">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                {t.loading}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                {t.empty}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const rowKey = getBasketItemKey(item)
                  const isRowLoading = updatingDeviceId === rowKey
                  const product = item.device
                  const lineTotal = getLineTotal(item)
                  const fallbackId = item.deviceId ?? item.deviceItemId

                  return (
                    <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex gap-3">
                        <img
                          src={product?.imageUrl ?? '/logo.svg'}
                          alt={product?.nameLocalized ?? product?.name ?? `${t.itemFallback} #${fallbackId}`}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">
                            {product?.nameLocalized ?? product?.name ?? `${t.itemFallback} #${fallbackId}`}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {product?.brand?.nameLocalized ?? product?.brand?.name ?? product?.category?.nameLocalized ?? product?.category?.name}
                          </div>
                          {product?.priceUah !== null ? (
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                              {lineTotal.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
                            </div>
                          ) : (
                            <div className="mt-2 text-sm font-semibold text-slate-500">{t.noPrice}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          disabled={isRowLoading}
                          className="hover:text-red-500 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={t.removeAria}
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          disabled={isRowLoading}
                          className="h-8 w-8 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={t.decreaseAria}
                        >
                          <Minus className="mx-auto h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          disabled={isRowLoading}
                          className="h-8 w-8 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={t.increaseAria}
                        >
                          <Plus className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <SheetFooter className="-mx-6 bg-white p-8">
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t.total}</span>
                <span className="text-xl font-bold text-slate-900">
                  {uiTotalAmount.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
                </span>
              </div>
              <SheetClose asChild>
                <Button
                  className="h-11 w-full"
                  variant="black"
                  loading={isCheckoutLoading}
                  disabled={items.length === 0 || isCheckoutLoading}
                  onClick={() => {
                    setIsCheckoutLoading(true)
                    router.push(withLocalePath('/order', locale))
                  }}
                >
                  {t.checkout}
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
