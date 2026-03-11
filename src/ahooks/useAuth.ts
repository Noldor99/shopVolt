'use client'

import { useMutation } from '@tanstack/react-query'

import {
  IPasswordResetConfirmSchema,
  IPasswordResetRequestSchema,
  IRegisterSchema,
  apiAuth,
} from '@/actions/client/authAction'

export const useRegister = () =>
  useMutation({
    mutationFn: (body: IRegisterSchema) => apiAuth.register(body),
  })

export const useRequestPasswordResetCode = () =>
  useMutation({
    mutationFn: (body: IPasswordResetRequestSchema) => apiAuth.requestPasswordResetCode(body),
  })

export const useConfirmPasswordReset = () =>
  useMutation({
    mutationFn: (body: IPasswordResetConfirmSchema) => apiAuth.confirmPasswordReset(body),
  })
