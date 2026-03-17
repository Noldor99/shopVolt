'use client'

import { useGetAttributeValuesByCode } from '@/ahooks/useAttribute'
import { ImagePlus, Loader2, PackageOpen, Pencil, Plus, Trash2 } from 'lucide-react'

import Image from 'next/image'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

import FormInput from '@/components/form/FormInput'
import { FormSwitch } from '@/components/form/FormSwitch'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import SmalCard from '@/components/ui-assembly/smal-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { cn } from '@/lib/utils'

import { FormPropertyValue } from './FormPropertyValue'
import { FormVariationProperties } from './FormVariationProperties'

type CategoryAttributeOption = {
  categoryAttributeId: number
  code: string
  name: string
  values?: string[]
}

type FormDeviceItemListProps = {
  name: 'items'
  selectedCategoryId?: string
  categoryAttributes: CategoryAttributeOption[]
}

type ItemPropertyFormValue = {
  categoryAttributeId?: string | number
  valueUa?: string
  valueEn?: string
}

type DeviceItemPropertyFieldsProps = {
  itemIndex: number
  selectedCategoryId?: string
  categoryAttributes: CategoryAttributeOption[]
}

type DeviceItemImageFieldProps = {
  itemIndex: number
}

type PropertyValueSelectorProps = {
  itemIndex: number
  propertyIndex: number
  attribute: CategoryAttributeOption
}

type AttributeOption = {
  ua: string
  en: string
}

const getNormalizedProperties = (properties: ItemPropertyFormValue[] = []) => {
  const seen = new Set<number>()

  return properties.flatMap((property) => {
    const categoryAttributeId = Number(property.categoryAttributeId)

    if (!Number.isInteger(categoryAttributeId) || categoryAttributeId <= 0) {
      return []
    }

    if (seen.has(categoryAttributeId)) {
      return []
    }

    seen.add(categoryAttributeId)

    return [
      {
        categoryAttributeId: String(categoryAttributeId),
        valueUa: property.valueUa?.trim() ?? '',
        valueEn: property.valueEn?.trim() ?? '',
      },
    ]
  })
}

const isSameProperties = (
  left: ItemPropertyFormValue[] = [],
  right: ItemPropertyFormValue[] = []
) =>
  left.length === right.length &&
  left.every(
    (item, index) =>
      String(item.categoryAttributeId ?? '') === String(right[index]?.categoryAttributeId ?? '') &&
      (item.valueUa ?? '') === (right[index]?.valueUa ?? '') &&
      (item.valueEn ?? '') === (right[index]?.valueEn ?? '')
  )

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })

const buildValueOptions = (
  fetchedValues: Array<{ translations: Array<{ locale: string; value: string }> }>,
  fallbackValues: string[],
  currentUa?: string,
  currentEn?: string
) => {
  const uniqueOptions = new Map<string, AttributeOption>()

  if (fetchedValues.length > 0) {
    fetchedValues.forEach((item) => {
      const ua =
        item.translations.find((translation) => translation.locale === 'ua')?.value?.trim() || ''
      const en =
        item.translations.find((translation) => translation.locale === 'en')?.value?.trim() || ''
      const option = { ua: ua || en, en: en || ua }
      if (option.ua || option.en) {
        uniqueOptions.set(`${option.ua}::${option.en}`, option)
      }
    })
  } else {
    fallbackValues
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => {
        uniqueOptions.set(`${value}::${value}`, { ua: value, en: value })
      })
  }

  const currentOption = {
    ua: currentUa?.trim() ?? '',
    en: currentEn?.trim() ?? currentUa?.trim() ?? '',
  }

  if (currentOption.ua || currentOption.en) {
    uniqueOptions.set(`${currentOption.ua}::${currentOption.en}`, currentOption)
  }

  return [...uniqueOptions.values()]
}

const DeviceItemImageField = ({ itemIndex }: DeviceItemImageFieldProps) => {
  const form = useFormContext()
  const [isUploading, setIsUploading] = useState(false)
  const image = useWatch({
    control: form.control,
    name: `items.${itemIndex}.mainImage`,
  }) as string | undefined

  const fieldState = form.getFieldState(`items.${itemIndex}.mainImage`, form.formState)

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      setIsUploading(true)
      const encodedImage = await toBase64(file)
      form.setValue(`items.${itemIndex}.mainImage`, encodedImage, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" {...form.register(`items.${itemIndex}.mainImage`)} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Main image</p>
          <p className="text-xs text-slate-500">
            This image belongs to the specific `DeviceItem` variation.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}

          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {image ? (
        <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image
            src={image}
            alt="Variant preview"
            width={960}
            height={960}
            unoptimized
            className="aspect-[3/4] w-full object-cover"
          />
          <div className="flex justify-end border-t border-slate-200 p-3">
            <Button
              type="button"
              variant="destructive_out"
              onClick={() =>
                form.setValue(`items.${itemIndex}.mainImage`, '', {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              Delete image
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex aspect-[3/4] w-full max-w-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
          {isUploading ? 'Preparing image...' : 'No image selected yet'}
        </div>
      )}

      {fieldState.error?.message ? (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      ) : null}
    </div>
  )
}

const PropertyValueSelector = ({
  itemIndex,
  propertyIndex,
  attribute,
}: PropertyValueSelectorProps) => {
  const form = useFormContext()
  const { data: attributeValues = [], isLoading } = useGetAttributeValuesByCode(
    attribute.code,
    Boolean(attribute.code)
  )

  const valueUa = useWatch({
    control: form.control,
    name: `items.${itemIndex}.properties.${propertyIndex}.valueUa`,
  }) as string | undefined
  const valueEn = useWatch({
    control: form.control,
    name: `items.${itemIndex}.properties.${propertyIndex}.valueEn`,
  }) as string | undefined

  const options = useMemo(
    () => buildValueOptions(attributeValues, attribute.values ?? [], valueUa, valueEn),
    [attribute.values, attributeValues, valueEn, valueUa]
  )

  const valueState = form.getFieldState(
    `items.${itemIndex}.properties.${propertyIndex}.valueUa`,
    form.formState
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading values for {attribute.name}...
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Value UA</label>
          <input
            {...form.register(`items.${itemIndex}.properties.${propertyIndex}.valueUa`)}
            placeholder="Наприклад: Чорний"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Value EN</label>
          <input
            {...form.register(`items.${itemIndex}.properties.${propertyIndex}.valueEn`)}
            placeholder="For example: Black"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive =
            option.ua === (valueUa ?? '').trim() && option.en === (valueEn ?? '').trim()

          return (
            <button
              key={`${attribute.categoryAttributeId}-${option.ua}-${option.en}`}
              type="button"
              onClick={() => {
                form.setValue(`items.${itemIndex}.properties.${propertyIndex}.valueUa`, option.ua, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                form.setValue(`items.${itemIndex}.properties.${propertyIndex}.valueEn`, option.en, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              className={cn(
                'min-h-9 rounded-full border px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
              )}
            >
              {option.ua}
            </button>
          )
        })}
      </div>

      {valueState.error?.message ? (
        <p className="text-xs text-destructive">{valueState.error.message}</p>
      ) : (
        <p className="text-xs text-slate-500">
          One `DeviceItemProperty` = one selected value for one attribute.
        </p>
      )}
    </div>
  )
}

const DeviceItemPropertyFields = ({
  itemIndex,
  selectedCategoryId,
  categoryAttributes,
}: DeviceItemPropertyFieldsProps) => {
  const form = useFormContext()
  const { control, register } = form
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `items.${itemIndex}.properties`,
  })

  const properties =
    (useWatch({
      control,
      name: `items.${itemIndex}.properties`,
    }) as ItemPropertyFormValue[] | undefined) ?? []

  useEffect(() => {
    const normalized = getNormalizedProperties(properties)
    if (!isSameProperties(properties, normalized)) {
      replace(normalized)
    }
  }, [properties, replace])

  const selectedIds = new Set(
    getNormalizedProperties(properties).map((property) => Number(property.categoryAttributeId))
  )

  const toggleProperty = (attribute: CategoryAttributeOption) => {
    const index = properties.findIndex(
      (property) => Number(property.categoryAttributeId) === attribute.categoryAttributeId
    )

    if (index >= 0) {
      remove(index)
      return
    }

    append({
      categoryAttributeId: String(attribute.categoryAttributeId),
      valueUa: '',
      valueEn: '',
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900">Variation properties</h4>
          <p className="text-xs text-slate-500">
            Select only the attributes that make this specific variation different.
          </p>
        </div>
        <FormVariationProperties selectedCategoryId={selectedCategoryId} />
      </div>

      {categoryAttributes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categoryAttributes.map((attribute) => {
            const isActive = selectedIds.has(attribute.categoryAttributeId)

            return (
              <button
                key={attribute.categoryAttributeId}
                type="button"
                onClick={() => toggleProperty(attribute)}
                className={cn(
                  'h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                )}
              >
                {attribute.name}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
          No variant attributes configured for this category yet.
        </div>
      )}

      {fields.length > 0 ? (
        <div className="space-y-3">
          {fields.map((field, propertyIndex) => {
            const categoryAttributeId = Number(properties[propertyIndex]?.categoryAttributeId)
            const attribute = categoryAttributes.find(
              (item) => item.categoryAttributeId === categoryAttributeId
            )

            if (!attribute) {
              return null
            }

            return (
              <div
                key={field.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{attribute.name}</p>
                    <p className="text-xs text-slate-500">{attribute.code}</p>
                  </div>
                  <FormPropertyValue attributeCode={attribute.code} attributeName={attribute.name} />
                </div>

                <input
                  type="hidden"
                  {...register(
                    `items.${itemIndex}.properties.${propertyIndex}.categoryAttributeId`
                  )}
                />

                <PropertyValueSelector
                  itemIndex={itemIndex}
                  propertyIndex={propertyIndex}
                  attribute={attribute}
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export const FormDeviceItems = ({
  name,
  selectedCategoryId,
  categoryAttributes,
}: FormDeviceItemListProps) => {
  const { control, trigger } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const items =
    (useWatch({
      control,
      name,
    }) as
      | Array<{
          sku?: string
          priceUah?: string
          oldPriceUah?: string
          stockCount?: string
          inStock?: boolean
          mainImage?: string
          properties?: ItemPropertyFormValue[]
        }>
      | undefined) ?? []
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorIndex, setEditorIndex] = useState<number | null>(null)

  const uniqueCategoryAttributes = useMemo(() => {
    const map = new Map<number, CategoryAttributeOption>()
    categoryAttributes.forEach((attribute) => {
      if (!map.has(attribute.categoryAttributeId)) {
        map.set(attribute.categoryAttributeId, attribute)
      }
    })
    return [...map.values()]
  }, [categoryAttributes])

  const openCreateModal = () => {
    const nextIndex = fields.length
    append({
      sku: '',
      priceUah: '0',
      oldPriceUah: '',
      stockCount: '0',
      inStock: true,
      mainImage: '',
      properties: [],
    })
    setEditorIndex(nextIndex)
    setIsEditorOpen(true)
  }

  const openEditModal = (index: number) => {
    setEditorIndex(index)
    setIsEditorOpen(true)
  }

  const activeItem =
    editorIndex !== null && editorIndex >= 0 && editorIndex < fields.length
      ? fields[editorIndex]
      : null

  return (
    <div className="paper-sharp space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Device items
          </p>
        </div>
        <Button type="button" variant="black_out" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12">
          <PackageOpen className="mb-2 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No variants added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const item = items[index]
            const price = item?.priceUah?.trim() || '0'
            const stock = item?.stockCount?.trim() || '0'
            const propertiesCount = (item?.properties ?? []).filter(
              (property) => Number(property?.categoryAttributeId) > 0
            ).length

            return (
              <SmalCard
                key={field.id}
                title={item?.sku?.trim() || `Variant #${index + 1}`}
                subTitle={`Price: ${price} UAH | Stock: ${stock} | Properties: ${propertiesCount}`}
                img={
                  <div className="relative h-[110px] w-full sm:w-[140px]">
                    {item?.mainImage ? (
                      <Image
                        src={item.mainImage}
                        alt={item?.sku?.trim() || `Variant #${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                }
                imgWidth="140"
              >
                <Button
                  type="button"
                  variant="black_out"
                  size="sm"
                  className="min-w-[92px] gap-2"
                  onClick={() => openEditModal(index)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>

                <DialogDelete
                  nameDelete="variant"
                  onClick={() => {
                    if (editorIndex === index) {
                      setIsEditorOpen(false)
                      setEditorIndex(null)
                    }
                    remove(index)
                  }}
                >
                  <Button
                    type="button"
                    variant="destructive_out"
                    size="sm"
                    className="min-w-[92px] gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </DialogDelete>
              </SmalCard>
            )
          })}
        </div>
      )}

      <Dialog
        open={isEditorOpen}
        onOpenChange={(open) => {
          setIsEditorOpen(open)
          if (!open) setEditorIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editorIndex === null ? 'Device item' : `Variant #${editorIndex + 1}`}
            </DialogTitle>
            <DialogDescription>
              Edit image, price and variation properties for this DeviceItem.
            </DialogDescription>
          </DialogHeader>

          {activeItem ? (
            <div
              key={activeItem.id}
              className={cn(
                'max-h-[70vh] space-y-5 overflow-y-auto pr-2',
                '[&::-webkit-scrollbar]:w-2',
                '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100/90',
                '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300',
                '[&::-webkit-scrollbar-thumb:hover]:bg-slate-400',
                '[scrollbar-color:rgb(203_213_225)_rgb(241_245_249)] [scrollbar-width:thin]'
              )}
            >
              <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <div className="lg:sticky lg:top-0">
                  <DeviceItemImageField itemIndex={editorIndex!} />
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      name={`items.${editorIndex}.priceUah`}
                      label="Price (UAH)"
                      type="number"
                      min={0}
                      step={1}
                    />
                    <FormInput
                      name={`items.${editorIndex}.oldPriceUah`}
                      label="Old price (UAH)"
                      type="number"
                      min={0}
                      step={1}
                    />
                    <FormInput name={`items.${editorIndex}.sku`} label="SKU" />
                    <FormInput
                      name={`items.${editorIndex}.stockCount`}
                      label="Stock count"
                      type="number"
                      min={0}
                      step={1}
                    />
                  </div>

                  <FormSwitch
                    name={`items.${editorIndex}.inStock`}
                    label="In stock"
                    className="h-[58px]"
                  />

                  <DeviceItemPropertyFields
                    itemIndex={editorIndex!}
                    selectedCategoryId={selectedCategoryId}
                    categoryAttributes={uniqueCategoryAttributes}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                <Button type="button" variant="default_out" onClick={() => setIsEditorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="black_out"
                  onClick={async () => {
                    if (editorIndex === null) return
                    const isValid = await trigger(`items.${editorIndex}`)
                    if (isValid) {
                      setIsEditorOpen(false)
                      setEditorIndex(null)
                    }
                  }}
                >
                  Save variant
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
