"use client"

import { useFormContext } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

interface TextareaFormProps {
  name: string
  placeholder?: string
}

export function FormTextarea({ name, placeholder }: TextareaFormProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormDescription>
            You can <span>@mention</span> other users and organizations.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
