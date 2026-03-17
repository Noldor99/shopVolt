'use client'

import { useGetAttributeValuesByCode } from '@/ahooks/useAttribute'

import { useMemo } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

import { FormAttributeValues } from './FormAttributeValues'
import { FormDeviceInfoManager } from './FormDeviceInfoManager'

type FormDeviceItemsProps = {
  name: 'info'
  selectedCategoryId?: string
  availableInfo?: Array<{
    categoryAttributeId: number
    code: string
    name: string
    values?: string[]
  }>
}

type ValueBadgeSelectorProps = {
  rowIndex: number
  attributeCode?: string
  fallbackValues?: string[]
}

const ValueBadgeSelector = ({
  rowIndex,
  attributeCode,
  fallbackValues = [],
}: ValueBadgeSelectorProps) => {
  const form = useFormContext()
  const currentValue = useWatch({
    control: form.control,
    name: `info.${rowIndex}.value`,
  }) as string | undefined

  const { data: attributeValues = [] } = useGetAttributeValuesByCode(
    attributeCode || '',
    Boolean(attributeCode)
  )

  const dynamicValues = attributeValues
    .map((item) => {
      const uaTranslation = item.translations
        .find((translation) => translation.locale === 'ua')
        ?.value?.trim()
      const enTranslation = item.translations
        .find((translation) => translation.locale === 'en')
        ?.value?.trim()
      return uaTranslation || enTranslation || ''
    })
    .filter(Boolean)

  const options = [
    ...new Set([
      ...(dynamicValues.length ? dynamicValues : fallbackValues),
      (currentValue ?? '').trim(),
    ]),
  ]
    .map((value) => value.trim())
    .filter(Boolean)

  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option === (currentValue ?? '').trim()
        return (
          <button
            key={`${rowIndex}-${option}`}
            type="button"
            onClick={() =>
              form.setValue(`info.${rowIndex}.value`, option, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className={cn(
              'h-8 w-fit rounded-full border px-3 text-sm transition-colors',
              isActive
                ? 'border-black bg-black text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export const FormDeviceInfo = ({
  name,
  selectedCategoryId,
  availableInfo = [],
}: FormDeviceItemsProps) => {
  const form = useFormContext()
  const { control } = form
  const normalizedAvailableInfo = useMemo(() => {
    const uniqueByName = new Map<
      string,
      {
        categoryAttributeId: number
        code: string
        name: string
        values?: string[]
      }
    >()

    availableInfo.forEach((item) => {
      const normalizedName = item.name.trim().toLowerCase()
      if (!normalizedName || uniqueByName.has(normalizedName)) return
      uniqueByName.set(normalizedName, item)
    })

    return [...uniqueByName.values()]
  }, [availableInfo])

  const currentInfo = useWatch({
    control,
    name,
  }) as Array<{ key?: string; value?: string }> | undefined

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  const selectedKeys = new Set(
    (currentInfo ?? []).map((item) => (item?.key ?? '').trim()).filter(Boolean)
  )

  const onToggleInfoBadge = (label: string) => {
    const index = (currentInfo ?? []).findIndex((item) => (item?.key ?? '').trim() === label)
    if (index >= 0) {
      remove(index)
      return
    }
    append({ key: label, value: '' })
  }

  return (
    <div className="paper-sharp space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Device Info
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FormDeviceInfoManager selectedCategoryId={selectedCategoryId} />
          </div>
        </div>

        {normalizedAvailableInfo.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {normalizedAvailableInfo.map((info) => {
              const isActive = selectedKeys.has(info.name)
              return (
                <button
                  key={info.categoryAttributeId}
                  type="button"
                  onClick={() => onToggleInfoBadge(info.name)}
                  className={cn(
                    'h-8 w-fit rounded-full border px-3 text-sm transition-colors',
                    isActive
                      ? 'border-black bg-black text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {info.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
          No info yet. Click Add info row to create one.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {fields.map((field, index) => {
          const selectedInfo = normalizedAvailableInfo.find(
            (item) => item.name.trim() === ((currentInfo ?? [])[index]?.key ?? '').trim()
          )

          return (
            <div key={field.id} className="paper-dark paper-sharp space-y-4 p-[10px]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  {form.watch(`info.${index}.key`)}
                </p>
                <FormAttributeValues
                  attributeCode={selectedInfo?.code}
                  attributeName={selectedInfo?.name}
                />
              </div>
              <ValueBadgeSelector
                rowIndex={index}
                attributeCode={selectedInfo?.code}
                fallbackValues={selectedInfo?.values ?? []}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
