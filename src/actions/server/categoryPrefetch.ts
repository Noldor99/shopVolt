import { queryClient } from "@/lib/queryClient"

import { apiCategory, QueryCategoryParams } from "../client/categoryAction"

export const categoryPrefetch = async (params?: QueryCategoryParams) => {
  const key = ["category", params ?? {}]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiCategory.getAll(params),
  })
}

export const categoryByIdPrefetch = async (id: string | number) => {
  const key = ["category", id]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiCategory.getOne(id),
  })
}
