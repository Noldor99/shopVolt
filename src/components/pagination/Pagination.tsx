'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

type PaginationPropsT = {
  totalCount: number
  items: number
  count: number
  currentPage: number
}

export const Pagination = ({ totalCount, items, count, currentPage }: PaginationPropsT) => {
  const totalPages = Math.ceil(totalCount / items)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()!

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handlePrev = () => {
    if (currentPage > 1) {
      router.push(pathname + '?' + createQueryString('page', (currentPage - 1).toString()))
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      router.push(pathname + '?' + createQueryString('page', (+currentPage + 1).toString()))
    }
  }

  const renderPageNumbers = () => {
    const pageNumbers = []

    const startPage = Math.max(1, currentPage - Math.floor(count / 2))
    const endPage = Math.min(totalPages, startPage + count - 1)

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          className={cn(i === +currentPage && 'bg-black text-white')}
          key={i}
          onClick={() => router.push(pathname + '?' + createQueryString('page', i.toString()))}
        >
          {i}
        </Button>
      )
    }

    return pageNumbers
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      router.push(pathname + '?' + createQueryString('page', '1'))
    }
  }, [totalPages, currentPage, router, pathname, createQueryString])

  return (
    <div className="flex items-center justify-center gap-4">
      {currentPage > 1 && (
        <Button className={cn(currentPage === 1 && 'hidden')} onClick={handlePrev}>
          Prev
        </Button>
      )}
      {renderPageNumbers()}
      {currentPage < totalPages && (
        <Button className={cn(currentPage === totalPages && 'hidden')} onClick={handleNext}>
          Next
        </Button>
      )}
    </div>
  )
}
