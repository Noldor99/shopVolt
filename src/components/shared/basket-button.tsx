'use client'

import { useGetBasket } from '@/ahooks/useBasket'
import { ArrowRight, ShoppingBasket } from 'lucide-react'

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
        className={cn('group relative', { 'w-[105px]': loading }, className)}
      >
        <div className="flex items-center gap-1 transition duration-300 group-hover:opacity-0">
          <ShoppingBasket className="relative h-4 w-4" strokeWidth={2} />
          <b>{itemsCount}</b>
        </div>
        <ArrowRight className="absolute right-5 w-5 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </Button>
    </BasketDrawer>
  )
}
