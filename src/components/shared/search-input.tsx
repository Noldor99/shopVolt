'use client'

import { Search } from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'

import React from 'react'
import { useClickAway, useDebounce } from 'react-use'

import { apiDevice } from '@/actions/client/deviceAction'

import { cn } from '@/lib/utils'

type SearchProduct = {
  id: number
  name: string
  imageUrl: string
}

export const SearchInput = () => {
  const [focused, setFocused] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [products, setProducts] = React.useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const requestIdRef = React.useRef(0)

  useClickAway(ref, () => {
    setFocused(false)
  })

  useDebounce(
    async () => {
      const query = searchQuery.trim()
      if (!query) {
        setProducts([])
        setIsLoading(false)
        return
      }

      const currentRequestId = requestIdRef.current + 1
      requestIdRef.current = currentRequestId
      setIsLoading(true)

      try {
        const response = await apiDevice.getAll({
          search: query,
          page: 1,
          limit: 5,
        })
        const data: SearchProduct[] = response.data.map((device) => ({
          id: device.id,
          name: device.nameLocalized ?? device.name ?? device.slug,
          imageUrl: device.imageUrl,
        }))
        if (requestIdRef.current === currentRequestId) {
          setProducts(data)
        }
      } catch {
        if (requestIdRef.current === currentRequestId) {
          setProducts([])
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsLoading(false)
        }
      }
    },
    250,
    [searchQuery]
  )

  const onClickItem = () => {
    setSearchQuery('')
    setFocused(false)
    setProducts([])
  }

  return (
    <>
      {focused && <div className="fixed inset-0 z-30 bg-black/50" />}

      <div
        ref={ref}
        className={cn(
          'relative flex h-11 flex-1 transition-all duration-300',
          focused
            ? 'fixed left-2 right-2 top-2 z-40 md:relative md:left-0 md:right-0 md:top-0'
            : 'z-30'
        )}
      >
        <Search className="absolute left-3 top-1/2 z-50 h-5 translate-y-[-50%] text-gray-400" />

        <input
          className={cn(
            'w-full rounded-2xl bg-gray-50 p-[15px] pl-11 outline-none transition-all',
            'focus:border-primary/20 border border-transparent',
            focused && 'pr-12 md:pr-4'
          )}
          type="text"
          placeholder="Знайти техніку..." // Змінив піцу на техніку :)
          onFocus={() => setFocused(true)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {focused && (
          <button
            onClick={() => setFocused(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 md:hidden"
          >
            Скасувати
          </button>
        )}

        <div
          className={cn(
            'absolute top-14 z-40 w-full rounded-xl border bg-white py-2 shadow-xl transition-all duration-200',
            focused && searchQuery.trim()
              ? 'visible translate-y-0 opacity-100'
              : 'invisible -translate-y-2 opacity-0'
          )}
        >
          {isLoading && (
            <div className="animate-pulse px-3 py-2 text-sm text-gray-500">Пошук...</div>
          )}

          {!isLoading &&
            products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={onClickItem}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-100"
              >
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    fill
                    className="h-8 w-8 rounded-sm object-cover"
                    src={product.imageUrl}
                    alt={product.name}
                  />
                </div>
                <span className="truncate text-sm font-medium">{product.name}</span>
              </Link>
            ))}

          {!isLoading && products.length === 0 && (
            <div className="px-3 py-2 text-center text-sm text-gray-500">Нічого не знайдено</div>
          )}
        </div>
      </div>
    </>
  )
}
