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
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const navigateToPage = (page: number) => {
    router.push(pathname + '?' + createQueryString('page', page.toString()), { scroll: false })
  }

  const renderPageNumbers = () => {
    const pageNumbers = []
    let startPage = Math.max(1, currentPage - Math.floor(count / 2))
    let endPage = Math.min(totalPages, startPage + count - 1)

    if (endPage - startPage + 1 < count) {
      startPage = Math.max(1, endPage - count + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant="black_out"
          className={cn(Number(currentPage) === i && 'bg-black text-white hover:bg-black/90')}
          onClick={() => navigateToPage(i)}
        >
          {i}
        </Button>
      )
    }

    return pageNumbers
  }

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      navigateToPage(1)
    }
  }, [totalPages, currentPage])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* Перехід на саму першу сторінку */}
      {currentPage > 1 && (
        <>
          <Button variant="black_out" onClick={() => navigateToPage(1)} title="Перша сторінка">
            «
          </Button>
          <Button variant="black_out" onClick={() => navigateToPage(currentPage - 1)} title="Назад">
            ‹
          </Button>
        </>
      )}

      <div className="flex items-center gap-2">{renderPageNumbers()}</div>

      {/* Перехід на останню сторінку */}
      {currentPage < totalPages && (
        <>
          <Button
            variant="black_out"
            onClick={() => navigateToPage(+currentPage + 1)}
            title="Вперед"
          >
            ›
          </Button>
          <Button
            variant="black_out"
            onClick={() => navigateToPage(totalPages)}
            title="Остання сторінка"
          >
            »
          </Button>
        </>
      )}
    </div>
  )
}
