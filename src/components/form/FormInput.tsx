import React from 'react'
import { useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface WrapFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label?: string
}
const FormInput: React.FC<WrapFormInputProps> = ({ name, label, ...props }) => {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full space-y-0">
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              className="w-full"
              {...props}
              name={field.name}
              ref={field.ref}
              value={field.value ?? ''}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default FormInput
