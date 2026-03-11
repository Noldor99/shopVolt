'use client'

import { Search } from 'lucide-react'

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
      {focused && <div className="fixed bottom-0 left-0 right-0 top-0 z-30 bg-black/50" />}

      <div
        ref={ref}
        className={cn('relative flex h-11 flex-1 justify-between rounded-2xl', focused && 'z-30')}
      >
        <Search className="absolute left-3 top-1/2 h-5 translate-y-[-50%] text-gray-400" />

        <input
          className="w-full rounded-2xl bg-gray-50 p-[15px] pl-11 outline-none"
          type="text"
          placeholder="Знайти піцу..."
          onFocus={() => setFocused(true)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Результати пошуку */}
        {focused && searchQuery.trim() && (
          <div
            className={cn(
              'invisible absolute top-14 z-30 w-full rounded-xl bg-white py-2 opacity-0 shadow-md transition-all duration-200',
              focused && 'visible top-14 opacity-100'
            )}
          >
            {isLoading && <div className="px-3 py-2 text-sm text-gray-500">Пошук...</div>}

            {!isLoading &&
              products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={onClickItem}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 active:bg-gray-200"
                >
                  <img
                    className="h-8 w-8 rounded-sm object-cover"
                    src={product.imageUrl}
                    alt={product.name}
                  />
                  <span>{product.name}</span>
                </Link>
              ))}

            {!isLoading && products.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">Нічого не знайдено</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
