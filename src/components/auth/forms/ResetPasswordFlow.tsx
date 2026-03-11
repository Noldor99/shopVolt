'use client'

import { useConfirmPasswordReset, useRequestPasswordResetCode } from '@/ahooks/useAuth'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import axios from 'axios'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'

import {
  IPasswordResetConfirmSchema,
  IPasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
} from '@/actions/client/authAction'

import { zodResolver } from '@hookform/resolvers/zod'

interface Props {
  initialEmail?: string
  onBackToLogin: () => void
  onSuccess: () => void
}

export const ResetPasswordFlow = ({ initialEmail = '', onBackToLogin, onSuccess }: Props) => {
  const [step, setStep] = useState<'request' | 'confirm'>('request')

  const { mutateAsync: requestResetCode, isPending: isRequestPending } =
    useRequestPasswordResetCode()
  const { mutateAsync: confirmPasswordReset, isPending: isConfirmPending } =
    useConfirmPasswordReset()

  const requestForm = useForm<IPasswordResetRequestSchema>({
    resolver: zodResolver(PasswordResetRequestSchema),
    defaultValues: { email: initialEmail },
  })

  const confirmForm = useForm<IPasswordResetConfirmSchema>({
    resolver: zodResolver(PasswordResetConfirmSchema),
    defaultValues: { email: initialEmail, code: '', password: '', confirmPassword: '' },
  })

  const handleRequest = async (values: IPasswordResetRequestSchema) => {
    try {
      await requestResetCode(values)
      confirmForm.setValue('email', values.email)
      setStep('confirm')
      toast({ title: 'Код надіслано', description: 'Перевірте вашу пошту' })
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined
      toast({
        title: 'Помилка',
        description: message || 'Спробуйте ще раз',
        variant: 'destructive',
      })
    }
  }

  const handleConfirm = async (values: IPasswordResetConfirmSchema) => {
    try {
      await confirmPasswordReset(values)
      toast({ title: 'Пароль оновлено', description: 'Тепер ви можете увійти' })
      onSuccess()
    } catch {
      toast({ title: 'Помилка', description: 'Невірний код або дані', variant: 'destructive' })
    }
  }

  if (step === 'request') {
    return (
      <Form {...requestForm}>
        <form className="space-y-3" onSubmit={requestForm.handleSubmit(handleRequest)}>
          <FormInput name="email" placeholder="Email" type="email" />
          <Button type="submit" variant="black" className="w-full" loading={isRequestPending}>
            Надіслати код
          </Button>
          <Button type="button" variant="black_out" className="w-full" onClick={onBackToLogin}>
            Повернутися до входу
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...confirmForm}>
      <form className="space-y-3" onSubmit={confirmForm.handleSubmit(handleConfirm)}>
        <FormInput name="email" placeholder="Email" type="email" />
        <FormInput name="code" placeholder="Код підтвердження" />
        <FormInput name="password" placeholder="Новий пароль" type="password" />
        <FormInput name="confirmPassword" placeholder="Підтвердіть пароль" type="password" />
        <Button type="submit" variant="black" className="w-full" loading={isConfirmPending}>
          Змінити пароль
        </Button>
        <Button
          type="button"
          variant="black_out"
          className="w-full"
          onClick={() => setStep('request')}
        >
          Надіслати код повторно
        </Button>
      </form>
    </Form>
  )
}
