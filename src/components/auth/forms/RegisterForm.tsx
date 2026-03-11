'use client'

import { useRegister } from '@/ahooks/useAuth'

import { signIn } from 'next-auth/react'

import { useForm } from 'react-hook-form'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'

import { IRegisterSchema, RegisterSchema } from '@/actions/client/authAction'

import { zodResolver } from '@hookform/resolvers/zod'

export const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutateAsync: registerUser, isPending } = useRegister()
  const form = useForm<IRegisterSchema>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: IRegisterSchema) => {
    try {
      await registerUser(values)
      await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      toast({ title: 'Акаунт створено' })
      onSuccess()
    } catch {
      toast({ title: 'Помилка', description: 'Email вже зайнятий', variant: 'destructive' })
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput name="fullName" placeholder="Повне ім'я" />
        <FormInput name="email" placeholder="Email" type="email" />
        <FormInput name="password" placeholder="Password" type="password" />
        <FormInput name="confirmPassword" placeholder="Підтвердіть пароль" type="password" />
        <Button type="submit" variant="black" className="w-full" loading={isPending}>
          Зареєструватися
        </Button>
      </form>
    </Form>
  )
}
