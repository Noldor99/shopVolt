"use client"

import { useQuery } from "@tanstack/react-query"

import { apiAttribute } from "@/actions/client/attributeAction"

export const useGetAttributeValuesByCode = (code: string, enabled = true) =>
  useQuery({
    queryKey: ["attribute-values", code],
    queryFn: () => apiAttribute.getValuesByCode(code),
    enabled: Boolean(code) && enabled,
  })
