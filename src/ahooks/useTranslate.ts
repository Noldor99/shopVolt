"use client"

import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"

import { api } from "@/lib/axios"

type TranslatePayload = {
  text: string
  source?: string
  target: string
}

type TranslateResponse = {
  text: string
}

export const useTranslate = () =>
  useMutation({
    mutationFn: async (payload: TranslatePayload) => {
      try {
        const response = await api.post<TranslateResponse>("/translate", payload)
        return response.data
      } catch (error) {
        const message =
          ((error as AxiosError<{ error?: string; details?: string }>)?.response?.data?.error as
            | string
            | undefined) ||
          ((error as AxiosError<{ error?: string; details?: string }>)?.response?.data?.details as
            | string
            | undefined) ||
          (error instanceof Error ? error.message : "Translate request failed")
        throw new Error(message)
      }
    },
  })
