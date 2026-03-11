import { AxiosResponse } from 'axios'
import axios from 'axios'
import { z } from 'zod'

import { IAuthUser } from '@/types/auth'

const authApi = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
})

export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(80),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must contain at least 6 symbols').max(100),
  confirmPassword: z.string().min(6, 'Password confirmation is required').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must contain at least 6 symbols').max(100),
})

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const PasswordResetConfirmSchema = z
  .object({
    email: z.string().email('Invalid email'),
    code: z.string().min(4, 'Code is required').max(20),
    password: z.string().min(6, 'Password must contain at least 6 symbols').max(100),
    confirmPassword: z.string().min(6, 'Password confirmation is required').max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

export type IRegisterSchema = z.infer<typeof RegisterSchema>
export type ILoginSchema = z.infer<typeof LoginSchema>
export type IPasswordResetRequestSchema = z.infer<typeof PasswordResetRequestSchema>
export type IPasswordResetConfirmSchema = z.infer<typeof PasswordResetConfirmSchema>

type RegisterResponse = Omit<IAuthUser, 'updatedAt' | 'verified' | 'providerId'>

export interface ApiAuth {
  register: (body: IRegisterSchema) => Promise<RegisterResponse>
  requestPasswordResetCode: (body: IPasswordResetRequestSchema) => Promise<{ message: string }>
  confirmPasswordReset: (body: IPasswordResetConfirmSchema) => Promise<{ message: string }>
}

export const apiAuth: ApiAuth = {
  register: (body) => authApi.post('/register', body).then(unwrapData),
  requestPasswordResetCode: (body) => authApi.post('/password-reset/request', body).then(unwrapData),
  confirmPasswordReset: (body) => authApi.post('/password-reset/confirm', body).then(unwrapData),
}

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data
