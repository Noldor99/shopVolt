import { cache } from 'react'

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryOnMount: false,
      retry: false,
      staleTime: 0,
    },
  },
})
export const queryClientCache = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retryOnMount: false,
          retry: false,
          staleTime: 0,
        },
      },
    })
)
