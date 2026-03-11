import { AxiosResponse } from "axios"

import { api } from "@/lib/axios"
import { IAddFavoriteBody, IFavorite } from "@/types/favorite"

export interface ApiFavorite {
  getAll: (userId: string | number) => Promise<IFavorite[]>
  add: (body: IAddFavoriteBody) => Promise<IFavorite>
  remove: (body: IAddFavoriteBody) => Promise<{ ok: boolean }>
}

export const apiFavorite: ApiFavorite = {
  getAll: (userId) => api.get("/favorites", { params: { userId } }).then(unwrapData),
  add: (body) => api.post("/favorites", body).then(unwrapData),
  remove: (body) => api.delete("/favorites", { data: body }).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
