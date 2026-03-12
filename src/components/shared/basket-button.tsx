'use client'

import { useGetBasket } from '@/ahooks/useBasket'
import { ShoppingBasket } from 'lucide-react'

import React, { useEffect, useMemo, useState } from 'react'

import { getOrCreateBasketToken } from '@/lib/basket-token'
import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { BasketDrawer } from './basket-drawer'

interface Props {
  className?: string
}

export const BasketButton: React.FC<Props> = ({ className }) => {
  const [tokenId, setTokenId] = useState('')

  useEffect(() => {
    setTokenId(getOrCreateBasketToken())
  }, [])

  const { data, isLoading } = useGetBasket({
    enabled: Boolean(tokenId),
    params: {
      tokenId,
    },
  })

  const itemsCount = useMemo(
    () => (data?.devices ?? []).reduce((sum, item) => sum + item.quantity, 0),
    [data?.devices]
  )

  const loading = isLoading

  return (
    <BasketDrawer>
      <Button
        loading={loading}
        variant="black_out"
        size="icon"
        className={cn('relative', className)}
      >
        <ShoppingBasket className="h-5 w-5" strokeWidth={2} />
        {itemsCount > 0 && (
          <span
            className={cn(
              'absolute -right-2 -top-2 z-20',
              'flex h-5 min-w-[20px] items-center justify-center rounded-full',
              'bg-black text-white',
              'text-[11px] font-bold italic leading-none',
              'shadow-lg ring-2 ring-background',
              'px-1'
            )}
          >
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        )}
      </Button>
    </BasketDrawer>
  )
}
