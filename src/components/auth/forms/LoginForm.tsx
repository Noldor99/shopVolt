'use client'

import { signIn } from 'next-auth/react'

import { useForm } from 'react-hook-form'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'

import { ILoginSchema, LoginSchema } from '@/actions/client/authAction'

import { zodResolver } from '@hookform/resolvers/zod'

interface Props {
  onSuccess: () => void
  onForgotPassword: (email: string) => void
}

export const LoginForm = ({ onSuccess, onForgotPassword }: Props) => {
  const form = useForm<ILoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: ILoginSchema) => {
    const result = await signIn('credentials', { ...values, redirect: false })

    if (result?.error) {
      return toast({
        title: 'Помилка',
        description: 'Невірний email або пароль',
        variant: 'destructive',
      })
    }

    toast({ title: 'Вхід виконано' })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput name="email" placeholder="Email" type="email" />
        <FormInput name="password" placeholder="Password" type="password" />
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={() => onForgotPassword(form.getValues('email'))}
        >
          Забули пароль?
        </Button>
        <Button type="submit" variant="black" className="w-full">
          Увійти
        </Button>
      </form>
    </Form>
  )
}
