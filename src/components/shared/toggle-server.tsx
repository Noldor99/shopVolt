import Link from 'next/link'

import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type arrtValueType = {
  icon?: ReactNode
  text?: string
  value: string
} & Required<{ icon: ReactNode } | { text: string }>

interface FilterToggleProps {
  paramName: string
  activeValue?: string
  currentParams: { [key: string]: string }[]
  defaultArrValue: arrtValueType[]
  grid?: boolean
  className?: string
  isPathnameMode?: boolean
}

export const ToggleServer = ({
  activeValue,
  currentParams,
  defaultArrValue,
  paramName,
  grid,
  className,
  isPathnameMode = false,
}: FilterToggleProps) => {
  const current = activeValue || defaultArrValue[0].value

  const createHref = (value: string) => {
    const params = new URLSearchParams()

    currentParams.forEach((param) => {
      Object.entries(param).forEach(([key, val]) => {
        if (key !== 'page') params.set(key, val)
      })
    })

    if (isPathnameMode) {
      const queryString = params.toString()
      return `/category/${value}${queryString ? `?${queryString}` : ''}`
    } else {
      params.set(paramName, value)
      return `?${params.toString()}`
    }
  }

  return (
    <div
      className={cn(
        'no-scrollbar flex items-center',
        grid ? 'grid grid-cols-2 gap-3 sm:grid-cols-4' : 'flex-wrap gap-2',
        className
      )}
    >
      {defaultArrValue.map(({ value, text, icon }) => {
        const isActive = current === value

        return (
          <Link
            key={value}
            href={createHref(value)}
            scroll={false}
            className={cn(
              // Базові стилі (прибрали focus:ring-2 та focus:ring-offset-2)
              'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50',

              // Активний стан (чорний бейдж, без бордера)
              isActive
                ? 'scale-[1.02] border-transparent bg-slate-900 text-slate-50 shadow-md'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',

              grid && 'w-full text-center'
            )}
          >
            {icon && (
              <span
                className={cn(
                  'flex items-center justify-center',
                  text ? 'mr-1.5' : '' // Відступ, якщо є текст
                )}
              >
                {icon}
              </span>
            )}
            {text}
          </Link>
        )
      })}
    </div>
  )
}
