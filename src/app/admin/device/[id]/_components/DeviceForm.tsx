'use client'

import { useGetBrand } from '@/ahooks/useBrand'
import { useGetCategory, useGetCategoryAttributes } from '@/ahooks/useCategory'
import { useCreateDevice, useUpdateDevice } from '@/ahooks/useDevice'
import type { IDeviceSchema } from '@/schema/device'
import { DeviceSchema } from '@/schema/device'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { FC, useEffect, useMemo, useState } from 'react'
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form'

import { AxiosError } from 'axios'

import { FormBadges } from '@/components/form/FormBadges'
import { FormImageList } from '@/components/form/FormImageList'
import FormInput from '@/components/form/FormInput'
import { FormSwitch } from '@/components/form/FormSwitch'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Title } from '@/components/ui/title'
import { toast } from '@/components/ui/use-toast'

import { zodResolver } from '@hookform/resolvers/zod'

import { DeviceType, IDevice } from '@/types/device'

import { FormDeviceInfo } from './FormDeviceInfo'
import { FormBrand } from './FormBrand'
import { FormCategory } from './FormCategory'
import { FormDeviceItems } from './FormDeviceItems'

type DeviceFormValues = {
  name?: string
  imageUrl: string
  imageUrls: string[]
  deviceType: DeviceType
  categoryId: string
  brandId: string | null
  priceUah: string
  oldPriceUah: string
  rating: string
  reviewsCount: string
  inStock: boolean
  stockCount: string
  info: Array<{
    key?: string
    value?: string
  }>
  items: Array<{
    sku: string
    priceUah: string
    oldPriceUah: string
    stockCount: string
    inStock: boolean
    mainImage: string
    properties: Array<{
      categoryAttributeId: string
      valueUa: string
      valueEn: string
    }>
  }>
}

type DeviceFormProps = {
  device?: IDevice
}

const isBrandInfoKey = (key?: string) => {
  const normalized = (key ?? '').trim().toLowerCase()
  return normalized === 'brand' || normalized === 'бренд'
}

const normalizeItemProperties = (
  properties:
    | Array<{
        categoryAttributeId: string
        valueUa: string
        valueEn: string
      }>
    | undefined
) => {
  const unique = new Map<
    number,
    {
      categoryAttributeId: string
      valueUa: string
      valueEn: string
    }
  >()

  ;(properties ?? []).forEach((property) => {
    const categoryAttributeId = Number(property.categoryAttributeId)
    if (!Number.isInteger(categoryAttributeId) || categoryAttributeId <= 0) return
    if (unique.has(categoryAttributeId)) return

    unique.set(categoryAttributeId, {
      categoryAttributeId: String(categoryAttributeId),
      valueUa: property.valueUa?.trim() ?? '',
      valueEn: property.valueEn?.trim() ?? '',
    })
  })

  return [...unique.values()]
}

export const DeviceForm: FC<DeviceFormProps> = ({ device }) => {
  const router = useRouter()
  const { data: categories } = useGetCategory()
  const { data: brands } = useGetBrand()
  const [brandSearch, setBrandSearch] = useState('')

  const form = useForm<DeviceFormValues>({
    mode: 'onChange',
    resolver: zodResolver(DeviceSchema),
    defaultValues: {
      name: device?.name || '',
      imageUrl: device?.imageUrl || '',
      imageUrls: device?.imageUrls?.length
        ? device.imageUrls
        : device?.imageUrl
          ? [device.imageUrl]
          : [],
      deviceType: 'OTHER',
      categoryId: device?.categoryId ? String(device.categoryId) : '',
      brandId: device?.brandId ? String(device.brandId) : null,
      priceUah:
        device?.priceUah !== null && device?.priceUah !== undefined ? String(device.priceUah) : '',
      oldPriceUah:
        device?.oldPriceUah !== null && device?.oldPriceUah !== undefined
          ? String(device.oldPriceUah)
          : '',
      rating: device?.rating !== null && device?.rating !== undefined ? String(device.rating) : '',
      reviewsCount:
        device?.reviewsCount !== null && device?.reviewsCount !== undefined
          ? String(device.reviewsCount)
          : '',
      inStock: device?.inStock ?? true,
      stockCount:
        device?.stockCount !== null && device?.stockCount !== undefined
          ? String(device.stockCount)
          : '',
      info:
        device?.info
          ?.map((item) => ({
            key: item.key ?? item.keyLocalized ?? '',
            value: item.value ?? item.valueLocalized ?? '',
          }))
          ?.filter((item) => (item.key || item.value) && !isBrandInfoKey(item.key)) ?? [],
      items:
        device?.items?.map((item) => ({
          sku: item.sku ?? '',
          priceUah: String(item.priceUah ?? 0),
          oldPriceUah:
            item.oldPriceUah === null || item.oldPriceUah === undefined
              ? ''
              : String(item.oldPriceUah),
          stockCount: String(item.stockCount ?? 0),
          inStock: item.inStock ?? true,
          mainImage: item.mainImage ?? '',
          properties: normalizeItemProperties(
            item.properties?.map((property) => ({
              categoryAttributeId: String(property.categoryAttributeId),
              valueUa: property.valueUa ?? '',
              valueEn: property.valueEn ?? '',
            }))
          ),
        })) ?? [],
    },
  })

  const { handleSubmit } = form
  const { mutateAsync: createDevice, isPending: pendingCreate } = useCreateDevice()
  const { mutateAsync: updateDevice, isPending: pendingUpdate } = useUpdateDevice(device?.id || '')
  const isPending = pendingCreate || pendingUpdate
  const formTitle = device ? 'Edit device' : 'Add device'

  const toNullableNumber = (value: unknown) => {
    const normalized =
      typeof value === 'string'
        ? value.trim()
        : value === null || value === undefined
          ? ''
          : String(value).trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const selectedCategoryId = form.watch('categoryId')

  const { data: categoryAttributesResponse, isFetching: isCategoryAttributesFetching } =
    useGetCategoryAttributes(
    selectedCategoryId || '',
    { lang: 'ua' },
    Boolean(selectedCategoryId)
  )

  const filteredBrands = useMemo(() => {
    const search = brandSearch.trim().toLowerCase()
    return (brands ?? []).filter((brand) => {
      const matchesSearch = !search || brand.name.toLowerCase().includes(search)
      const matchesCategory =
        !selectedCategoryId ||
        (brand.categories ?? []).some(
          (category) => String(category.id) === String(selectedCategoryId)
        )
      return matchesSearch && matchesCategory
    })
  }, [brands, brandSearch, selectedCategoryId])

  const categoryAttributeOptions = useMemo(
    () => {
      if (!categoryAttributesResponse) return []
      if (
        selectedCategoryId &&
        String(categoryAttributesResponse.category?.id ?? '') !== String(selectedCategoryId)
      ) {
        return []
      }

      return Array.from(
        new Map(
          (categoryAttributesResponse?.attributes ?? [])
            .filter((attribute) => {
              const normalizedCode = attribute.code.trim().toLowerCase()
              const normalizedName = attribute.name.trim().toLowerCase()
              return (
                normalizedCode !== 'brand' &&
                normalizedName !== 'бренд' &&
                normalizedName !== 'brand'
              )
            })
            .map((attribute) => [
              attribute.categoryAttributeId,
              {
                categoryAttributeId: attribute.categoryAttributeId,
                code: attribute.code,
                name: attribute.name,
                isVariant: attribute.isVariant,
                values: attribute.values ?? [],
              },
            ])
        ).values()
      )
    },
    [categoryAttributesResponse, selectedCategoryId]
  )

  const infoAttributeOptions = useMemo(
    () => categoryAttributeOptions.filter((attribute) => !attribute.isVariant),
    [categoryAttributeOptions]
  )

  const itemAttributeOptions = useMemo(
    () => categoryAttributeOptions.filter((attribute) => attribute.isVariant),
    [categoryAttributeOptions]
  )

  useEffect(() => {
    if (!selectedCategoryId || isCategoryAttributesFetching) return

    const availableInfoKeys = new Set(
      infoAttributeOptions.map((attribute) => attribute.name.trim().toLowerCase())
    )
    const availableVariantAttributeIds = new Set(
      itemAttributeOptions.map((attribute) => Number(attribute.categoryAttributeId))
    )

    const currentInfo = form.getValues('info') ?? []
    const filteredInfo = currentInfo.filter((item) =>
      availableInfoKeys.has((item.key ?? '').trim().toLowerCase())
    )

    if (filteredInfo.length !== currentInfo.length) {
      form.setValue('info', filteredInfo, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    const currentItems = form.getValues('items') ?? []
    const nextItems = currentItems.map((item) => ({
      ...item,
      properties: normalizeItemProperties(item.properties).filter((property) =>
        availableVariantAttributeIds.has(Number(property.categoryAttributeId))
      ),
    }))

    const propertiesChanged = nextItems.some((item, index) => {
      const prev = currentItems[index]?.properties ?? []
      const next = item.properties ?? []
      if (prev.length !== next.length) return true
      return prev.some(
        (property, pIndex) =>
          String(property.categoryAttributeId) !== String(next[pIndex]?.categoryAttributeId)
      )
    })

    if (propertiesChanged) {
      form.setValue('items', nextItems, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [
    form,
    infoAttributeOptions,
    isCategoryAttributesFetching,
    itemAttributeOptions,
    selectedCategoryId,
  ])

  const onError = (errors: FieldErrors<DeviceFormValues>) => {
    const messages: string[] = []

    for (const [key, err] of Object.entries(errors)) {
      if (key === 'items' || key === 'info') continue
      if (err && 'message' in err && typeof err.message === 'string') {
        messages.push(`${key}: ${err.message}`)
      }
    }

    const itemErrors = errors.items
    if (Array.isArray(itemErrors)) {
      itemErrors.forEach((itemErr, idx) => {
        if (!itemErr) return
        for (const [field, fieldErr] of Object.entries(itemErr)) {
          if (
            fieldErr &&
            typeof fieldErr === 'object' &&
            'message' in fieldErr &&
            typeof fieldErr.message === 'string'
          ) {
            messages.push(`Item #${idx + 1} → ${field}: ${fieldErr.message}`)
          }
        }
      })
    }

    toast({
      title: 'Validation failed',
      description: messages.length > 0 ? messages.slice(0, 6).join('; ') : 'Check form fields',
      variant: 'destructive',
    })
  }

  const onSubmit: SubmitHandler<DeviceFormValues> = async (values) => {
    const nextImageUrls = values.imageUrls ?? []
    const info = (values.info ?? [])
      .map((item) => ({
        key: item.key?.trim() ?? '',
        value: item.value?.trim() ?? '',
      }))
      .filter((item) => item.key.length > 0 && item.value.length > 0 && !isBrandInfoKey(item.key))

    const items = (values.items ?? [])
      .map((item) => ({
        sku: item.sku.trim(),
        priceUah: Number(item.priceUah),
        oldPriceUah: toNullableNumber(item.oldPriceUah),
        stockCount: Number(item.stockCount),
        inStock: item.inStock,
        mainImage: item.mainImage.trim(),
        properties: normalizeItemProperties(item.properties)
          .map((property) => ({
            categoryAttributeId: Number(property.categoryAttributeId),
            valueUa: property.valueUa.trim(),
            valueEn: property.valueEn.trim(),
          }))
          .filter(
            (property) =>
              Number.isInteger(property.categoryAttributeId) &&
              property.categoryAttributeId > 0 &&
              property.valueUa.length > 0 &&
              property.valueEn.length > 0
          ),
      }))
      .filter(
        (item) =>
          item.sku.length > 0 &&
          item.mainImage.length > 0 &&
          Number.isFinite(item.priceUah) &&
          Number.isFinite(item.stockCount)
      )

    const payload: IDeviceSchema = {
      name: values.name?.trim() || undefined,
      imageUrl: nextImageUrls[0] || '',
      imageUrls: nextImageUrls,
      deviceType: values.deviceType,
      categoryId: Number(values.categoryId),
      brandId: values.brandId === null ? null : Number(values.brandId),
      priceUah: toNullableNumber(values.priceUah),
      oldPriceUah: toNullableNumber(values.oldPriceUah),
      rating: toNullableNumber(values.rating),
      reviewsCount: toNullableNumber(values.reviewsCount),
      inStock: values.inStock,
      stockCount: toNullableNumber(values.stockCount),
      info,
      items,
    }

    const mutation = device ? updateDevice : createDevice

    mutation(payload, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: device ? 'Device updated' : 'Device created',
        })
      },
      onError: (error) => {
        const errorMessage =
          ((error as AxiosError)?.response?.data as { message?: string })?.message ||
          'Unknown error'

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <div className="paper-rounded">
      <div className="mb-4 w-full">
        <Title size="2xl" text={formTitle} />
      </div>

      <div className="my-2 mb-[40px] flex items-center justify-center gap-4">
        <Form {...form}>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit, onError)}>
            <div className="paper-sharp w-full space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Device
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormInput name="name" placeholder="Device name" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Category</p>
                <FormCategory />
              </div>

              <FormBadges
                name="categoryId"
                items={categories || []}
                isMulti={false}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Brand</p>
                  <FormBrand />
                </div>

                <input
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  placeholder="Search brand..."
                  className="h-9 w-full max-w-[260px] rounded-md border border-slate-300 px-3 text-sm"
                />
              </div>
              <FormBadges name="brandId" items={filteredBrands} isMulti={false} />
              {filteredBrands.length === 0 && (
                <p className="text-sm text-slate-500">No brands found for current filters</p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormInput name="priceUah" type="number" placeholder="Price UAH" min={0} step={1} />
                <FormInput
                  name="oldPriceUah"
                  type="number"
                  placeholder="Old price UAH"
                  min={0}
                  step={1}
                />
                <FormInput name="rating" type="number" placeholder="Rating" min={0} step={0.1} />
                <FormInput
                  name="reviewsCount"
                  type="number"
                  placeholder="Reviews count"
                  min={0}
                  step={1}
                />
                <FormInput
                  name="stockCount"
                  type="number"
                  placeholder="Stock count"
                  min={0}
                  step={1}
                />
              </div>

              <FormSwitch
                name="inStock"
                label="In stock"
                description="Whether the product is available for ordering now"
              />

              <FormImageList name="imageUrls" mainImageName="imageUrl" />
            </div>

            <FormDeviceInfo
              name="info"
              selectedCategoryId={selectedCategoryId}
              availableInfo={infoAttributeOptions}
            />

            <FormDeviceItems
              name="items"
              selectedCategoryId={selectedCategoryId}
              categoryAttributes={itemAttributeOptions}
            />
            <div>
              <Button type="submit" className="mt-6" disabled={isPending}>
                Save device
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
        {device && (
          <Button asChild variant="black_out">
            <Link href={`/product/${device.id}`} target="_blank" rel="noreferrer">
              Open device page
            </Link>
          </Button>
        )}
        <Button type="button" variant="default_out" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  )
}
