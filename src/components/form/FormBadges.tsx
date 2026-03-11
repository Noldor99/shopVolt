'use client'

import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { cn } from '@/lib/utils'

interface BaseItem {
  id: string | number
  name: string
}

type FormBadgesProps<T extends BaseItem> = {
  name: string
  items: T[]
  label?: string
  className?: string
}

export const FormBadges = <T extends BaseItem>({
  name,
  items,
  label,
  className,
}: FormBadgesProps<T>) => {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedIds: (string | number)[] = Array.isArray(field.value) ? field.value : []

        const toggleItem = (id: string | number) => {
          const isSelected = selectedIds.includes(id)
          const nextIds = isSelected
            ? selectedIds.filter((value) => value !== id)
            : [...selectedIds, id]

          field.onChange(nextIds)
        }

        return (
          <FormItem className={cn('space-y-2', className)}>
            {label && <FormLabel className="font-medium text-black">{label}</FormLabel>}

            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        'cursor-pointer border px-3 py-1 text-sm transition-all active:scale-95',
                        isSelected
                          ? 'hover:bg-primary/90 border-primary bg-primary text-white'
                          : 'hover:border-primary/50 border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      {item.name}
                    </Badge>
                  </button>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
