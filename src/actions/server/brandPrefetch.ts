import { queryClient } from "@/lib/queryClient"

import { apiBrand } from "../client/brandAction"

export const brandPrefetch = async () => {
  const key = ["brand"]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiBrand.getAll(),
  })
}

export const brandByIdPrefetch = async (id: string | number) => {
  const key = ["brand", id]
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => apiBrand.getOne(id),
  })
}
