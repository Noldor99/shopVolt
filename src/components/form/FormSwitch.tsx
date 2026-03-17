'use client'

import { useFormContext } from 'react-hook-form'

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'

import { cn } from '@/lib/utils'

interface FormSwitchProps {
  name: string
  label: string
  description?: string
  className?: string
}

export const FormSwitch = ({ name, label, description, className }: FormSwitchProps) => {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            'flex flex-row items-center justify-between rounded-lg border border-slate-200 p-3 shadow-sm',
            className
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base font-medium text-slate-900">{label}</FormLabel>
            {description && (
              <FormDescription className="text-xs text-slate-500">{description}</FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-black"
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
