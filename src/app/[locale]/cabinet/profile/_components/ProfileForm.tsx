'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import { api } from '@/lib/axios'
import { PHONE_VALIDATION_MESSAGE, toE164PhoneOrNull } from '@/lib/phone'

const ProfileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Вкажіть імʼя та прізвище'),
  email: z.string().trim().email('Некоректний email'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || !/\p{L}/u.test(value),
      'Телефон не може містити літери'
    )
    .refine((value) => !value || Boolean(toE164PhoneOrNull(value)), PHONE_VALIDATION_MESSAGE)
    .transform((value) => (value ? toE164PhoneOrNull(value) || value : '')),
})

type ProfileFormValues = z.infer<typeof ProfileFormSchema>

type ProfileFormProps = {
  initialValues: {
    fullName: string
    email: string
    phone?: string
  }
}

export const ProfileForm = ({ initialValues }: ProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    mode: 'onChange',
    defaultValues: initialValues,
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.patch<{ fullName: string; email: string; phone?: string }>(
        '/profile',
        values
      )
      form.reset({
        fullName: response.data.fullName,
        email: response.data.email,
        phone: response.data.phone || '',
      })

      toast({
        title: 'Профіль оновлено',
        description: 'Зміни успішно збережено.',
      })
    } catch (error) {
      const message =
        ((error as AxiosError)?.response?.data as { error?: string; message?: string })?.message ||
        ((error as AxiosError)?.response?.data as { error?: string; message?: string })?.error ||
        'Не вдалося оновити профіль'

      toast({
        title: 'Помилка',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormInput name="fullName" placeholder="Імʼя та прізвище" />
          <FormInput name="email" placeholder="Email" />
          <FormInput
            name="phone"
            placeholder="Телефон (+380...)"
            inputMode="tel"
            autoComplete="tel"
          />

          <Button
            type="submit"
            variant="black"
            className="h-11 w-full md:w-auto"
            disabled={!form.formState.isDirty || !form.formState.isValid || isSubmitting}
            loading={isSubmitting}
          >
            Зберегти зміни
          </Button>
        </form>
      </Form>
    </div>
  )
}
