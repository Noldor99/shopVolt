'use server'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import Link from 'next/link'

import React from 'react'

import { cn } from '@/lib/utils'

type PaginationProps = {
  page?: number
  totalPages: number
  hasNextPage: boolean
  saveParam: { [key: string]: string }[]
}

export const PaginationServer = (props: PaginationProps) => {
  const { page = 1, totalPages, hasNextPage, saveParam } = props

  const buildQueryParam = (pageNumber: number) => {
    const queryParams = [`page=${pageNumber}`]

    saveParam.forEach((param) => {
      for (const key in param) {
        queryParams.push(`${key}=${param[key]}`)
      }
    })
    return queryParams.join('&')
  }

  const currentPage = Math.min(Math.max(Number(page), 1), totalPages)

  const getPagesToShow = () => {
    let startPage = currentPage - 2
    let endPage = currentPage + 2

    if (totalPages < 5) {
      startPage = 1
      endPage = totalPages
    } else if (currentPage <= 3) {
      startPage = 1
      endPage = 5
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4
      endPage = totalPages
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  const pages = getPagesToShow()

  return (
    <div className="flex items-center justify-center space-x-6 text-black">
      <Link
        className={cn(
          'rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50',
          currentPage === 1 ? 'pointer-events-none bg-gray-100' : ''
        )}
        href={`?${buildQueryParam(currentPage - 1)}`}
      >
        <span className="sm:hidden" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Previous</span>
      </Link>

      <nav aria-label="Pagination" className="relative z-0 inline-flex -space-x-px rounded-md">
        {pages.map((p, i) => (
          <Link
            key={p}
            className={cn(
              'relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50',
              p === currentPage ? 'pointer-events-none bg-gray-100' : '',
              i === 0 ? 'rounded-l-md' : '',
              i === pages.length - 1 ? 'rounded-r-md' : ''
            )}
            href={`?${buildQueryParam(p)}`}
          >
            {p}
          </Link>
        ))}
      </nav>

      <Link
        className={cn(
          'rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50',
          !hasNextPage || currentPage >= totalPages ? 'pointer-events-none bg-gray-100' : ''
        )}
        href={`?${buildQueryParam(currentPage + 1)}`}
      >
        <span className="sm:hidden" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Next</span>
      </Link>
    </div>
  )
}
