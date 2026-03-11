'use client'

import { DeviceType } from '@/types/device'

import { useGetCategory } from '@/ahooks/useCategory'
import { useCreateDevice, useUpdateDevice } from '@/ahooks/useDevice'
import { useGetBrand } from '@/ahooks/useBrand'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ChangeEvent, FC } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'

import { AxiosError } from 'axios'

import FormInput from '@/components/form/FormInput'
import { SelectForm } from '@/components/form/FormSelect'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Title } from '@/components/ui/title'
import { toast } from '@/components/ui/use-toast'

import { DeviceSchema, IDeviceSchema } from '@/actions/client/deviceAction'

import { zodResolver } from '@hookform/resolvers/zod'

import { IDevice } from '@/types/device'

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
}

type DeviceFormProps = {
  device?: IDevice
}

export const DeviceForm: FC<DeviceFormProps> = ({ device }) => {
  const router = useRouter()
  const { data: categories } = useGetCategory()
  const { data: brands } = useGetBrand()

  const categoryOptions = (categories ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
  }))
  const deviceTypeOptions = [
    { value: 'TABLET', label: 'Tablet' },
    { value: 'MONITOR', label: 'Monitor' },
    { value: 'OTHER', label: 'Other' },
  ] as const

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
      deviceType: device?.deviceType ?? 'OTHER',
      categoryId: device?.categoryId ? String(device.categoryId) : '',
      brandId: device?.brandId ? String(device.brandId) : null,
      priceUah: device?.priceUah !== null && device?.priceUah !== undefined ? String(device.priceUah) : '',
      oldPriceUah:
        device?.oldPriceUah !== null && device?.oldPriceUah !== undefined ? String(device.oldPriceUah) : '',
      rating: device?.rating !== null && device?.rating !== undefined ? String(device.rating) : '',
      reviewsCount:
        device?.reviewsCount !== null && device?.reviewsCount !== undefined
          ? String(device.reviewsCount)
          : '',
      inStock: device?.inStock ?? true,
      stockCount:
        device?.stockCount !== null && device?.stockCount !== undefined ? String(device.stockCount) : '',
      info:
        device?.info?.map((item) => ({
          key: item.key ?? '',
          value: item.value ?? '',
        })) ?? [],
    },
  })

  const { formState, handleSubmit } = form
  const { mutateAsync: createDevice, isPending: pendingCreate } = useCreateDevice()
  const { mutateAsync: updateDevice, isPending: pendingUpdate } = useUpdateDevice(device?.id || '')
  const isPending = pendingCreate || pendingUpdate
  const formTitle = device ? 'Edit device' : 'Add device'

  const toNullableNumber = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    return Number(trimmed)
  }

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })

  const onSubmit: SubmitHandler<DeviceFormValues> = async (values) => {
    const imageUrls = values.imageUrls ?? []
    const info = (values.info ?? [])
      .map((item) => ({
        key: item.key?.trim() ?? '',
        value: item.value?.trim() ?? '',
      }))
      .filter((item) => item.key.length > 0 && item.value.length > 0)

    const payload: IDeviceSchema = {
      name: values.name?.trim() || undefined,
      imageUrl: imageUrls[0],
      imageUrls,
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

  const imageUrls = form.watch('imageUrls') ?? []

  const handleAddImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    const encodedImages = await Promise.all(files.map((file) => toBase64(file)))
    const nextImages = [...imageUrls, ...encodedImages]
    form.setValue('imageUrls', nextImages, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('imageUrl', nextImages[0] ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    const nextImages = imageUrls.filter((_, imageIndex) => imageIndex !== index)
    form.setValue(
      'imageUrls',
      nextImages,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
    form.setValue('imageUrl', nextImages[0] ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleSetMainImage = (index: number) => {
    if (index === 0) {
      return
    }

    const nextImages = [...imageUrls]
    const [selectedImage] = nextImages.splice(index, 1)
    nextImages.unshift(selectedImage)

    form.setValue('imageUrls', nextImages, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('imageUrl', nextImages[0] ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="paper-rounded">
      <div className="mb-4 w-full">
        <Title size="2xl" text={formTitle} />
      </div>

      <div className="paper-sharp my-2 mb-[40px] flex items-center justify-center gap-4">
        <Form {...form}>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormInput name="name" placeholder="Device name" />
              <SelectForm
                name="categoryId"
                placeholder="Select category"
                selectItems={categoryOptions}
              />
              <SelectForm
                name="deviceType"
                placeholder="Device type"
                selectItems={[...deviceTypeOptions]}
              />
            </div>

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Brand</FormLabel>
                  <Select
                    value={field.value === null ? 'null' : String(field.value ?? 'null')}
                    onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No brand</SelectItem>
                      {(brands ?? []).map((brand) => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormInput name="priceUah" type="number" placeholder="Price UAH" min={0} step={1} />
              <FormInput name="oldPriceUah" type="number" placeholder="Old price UAH" min={0} step={1} />
              <FormInput name="rating" type="number" placeholder="Rating" min={0} step={0.1} />
              <FormInput
                name="reviewsCount"
                type="number"
                placeholder="Reviews count"
                min={0}
                step={1}
              />
              <FormInput name="stockCount" type="number" placeholder="Stock count" min={0} step={1} />
            </div>

            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <FormLabel className="mb-0">In stock</FormLabel>
                  <FormControl>
                    <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <input type="hidden" {...form.register('imageUrl')} />

            <div>
              {form.formState.errors.imageUrl?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Device images</p>
                <label className="inline-flex cursor-pointer items-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90">
                  Upload images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />
                </label>
              </div>

              {imageUrls.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imageUrls.map((image, index) => {
                    const src = typeof image === 'string' ? image : ''

                    return (
                      <div
                        key={`${src}-${index}`}
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={src}
                          alt={`Device image ${index + 1}`}
                          className="h-36 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 bg-slate-50 p-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={index === 0 ? 'black' : 'default_out'}
                            onClick={() => handleSetMainImage(index)}
                            disabled={index === 0}
                          >
                            {index === 0 ? 'Main image' : 'Set as main'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveImage(index)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Add at least one device image
                </div>
              )}

              {form.formState.errors.imageUrls?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.imageUrls.message}
                </p>
              )}
            </div>

            <FormDeviceItems name="info" />

            <div>
              <Button type="submit" className="mt-6" disabled={isPending || !formState.isValid}>
                Save device
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
        {device && (
          <Button asChild variant="black_out">
            <Link href={`/admin/device/${device.id}`} target="_blank" rel="noreferrer">
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
