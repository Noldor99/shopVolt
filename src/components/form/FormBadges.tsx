'use client'

import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { cn } from '@/lib/utils'

// Описуємо базовий інтерфейс для об'єктів (категорій, брендів тощо)
interface BaseItem {
  id: string | number
  name: string
}

type FormBadgesProps<T extends BaseItem> = {
  name: string
  items: T[]
  label?: string
  className?: string
  isMulti?: boolean // Якщо true — працює як чекбокси, якщо false — як радіокнопки
}

export const FormBadges = <T extends BaseItem>({
  name,
  items,
  label,
  className,
  isMulti = false,
}: FormBadgesProps<T>) => {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isSelected = (id: string | number) => {
          if (isMulti) {
            return Array.isArray(field.value) && field.value.some((v) => String(v) === String(id))
          }
          return (
            field.value !== undefined && field.value !== null && String(field.value) === String(id)
          )
        }

        const toggleItem = (id: string | number) => {
          const normalizedId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id

          if (isMulti) {
            const currentValues = Array.isArray(field.value) ? field.value : []
            const nextValues = currentValues.includes(normalizedId)
              ? currentValues.filter((v: string | number) => v !== normalizedId)
              : [...currentValues, normalizedId]
            field.onChange(nextValues)
          } else {
            field.onChange(field.value === normalizedId ? null : normalizedId)
          }
        }

        return (
          <FormItem className={cn('space-y-3', className)}>
            {label && (
              <FormLabel className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </FormLabel>
            )}

            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const active = isSelected(item.id)

                return (
                  <button key={item.id} type="button" onClick={() => toggleItem(item.id)}>
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-6 w-fit rounded-full border px-4 text-sm transition-colors',
                        active
                          ? 'border-black bg-black text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {item.name}
                    </Badge>
                  </button>
                )
              })}

              {items.length === 0 && (
                <p className="text-xs italic text-slate-400">Список порожній...</p>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
