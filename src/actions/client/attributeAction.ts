import { AxiosResponse } from "axios"

import { api } from "@/lib/axios"

export interface IAttributeValueTranslation {
  id: number
  value: string
  locale: string
  attributeValueId: number
}

export interface IAttributeValue {
  id: number
  attributeId: number
  code: string
  visualValue: string | null
  translations: IAttributeValueTranslation[]
}

export interface ApiAttribute {
  getValuesByCode: (code: string) => Promise<IAttributeValue[]>
}

export const apiAttribute: ApiAttribute = {
  getValuesByCode: (code) => api.get(`/attributes/${code}/values`).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
