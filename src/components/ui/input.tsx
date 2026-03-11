import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      type,
      onBlur,
      onChange,
      onFocus,
      placeholder,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const floatingText =
      label ??
      (typeof placeholder === 'string' && placeholder.trim().length > 0 ? placeholder : undefined)

    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(() =>
      value !== undefined ? String(value).length > 0 : String(defaultValue ?? '').length > 0
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(String(value).length > 0)
      }
    }, [value])

    const isFloating = isFocused || hasValue

    return (
      <div className={cn('relative w-full', containerClassName)}>
        <input
          type={type}
          {...props}
          className={cn(
            'peer flex h-12 w-full',
            'text-black',
            'rounded-xl border border-zinc-300 bg-white',
            'px-4 py-0 text-base leading-6 shadow-sm transition-all duration-200 ease-out',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground/80',
            'focus-visible:border-[#6764F1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6764F1]/15',
            'hover:border-zinc-400',
            'disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60',
            className
          )}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          placeholder={floatingText ? ' ' : placeholder}
          onFocus={(event) => {
            setIsFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setIsFocused(false)
            setHasValue(event.currentTarget.value.length > 0)
            onBlur?.(event)
          }}
          onChange={(event) => {
            if (value === undefined) {
              setHasValue(event.currentTarget.value.length > 0)
            }
            onChange?.(event)
          }}
        />

        {floatingText ? (
          <label
            className={cn(
              'pointer-events-none absolute left-4 select-none rounded-lg',
              'origin-[0] transition-all duration-200 ease-out',
              isFloating
                ? 'top-0 z-10 -translate-y-1/2 scale-90 bg-white px-1 text-sm text-gray-500'
                : 'top-1/2 -translate-y-1/2 scale-100 text-sm text-zinc-500'
            )}
          >
            {floatingText}
          </label>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
