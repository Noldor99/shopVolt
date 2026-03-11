"use client"
import React from "react"
import { Pagination } from "./Pagination"
import { useSearchParams } from "next/navigation"

interface WrapPaginationParam {
  totalCount: number
}

const WrapPagination = ({ totalCount }: WrapPaginationParam) => {
  const searchParams = useSearchParams()

  const initialPage = searchParams?.get("page") || "1"

  return (
    <div>
      <Pagination
        totalCount={totalCount}
        currentPage={Number(initialPage)}
        items={6}
        count={6}
      />
    </div>
  )
}

export default WrapPagination
