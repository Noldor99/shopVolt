'use client'

import { useGetBasket } from '@/ahooks/useBasket'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { AxiosError } from 'axios'

import { useQueryClient } from '@tanstack/react-query'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'

import { apiBasket } from '@/actions/client/basketAction'
import { type IOrderSchema, OrderSchema } from '@/actions/client/orderAction'

import { zodResolver } from '@hookform/resolvers/zod'

import { api } from '@/lib/axios'
import { getOrCreateBasketToken } from '@/lib/basket-token'
import { Locale, getLocaleFromPathname, withLocalePath } from '@/lib/i18n'

import { IBasketDevice } from '@/types/basket'

const getLineTotal = (item: IBasketDevice) => (item.device?.priceUah ?? 0) * item.quantity

type DeliveryMethod = 'COURIER' | 'NOVA_POSHTA'

type NovaPoshtaOption = {
  ref: string
  name: string
  kind?: 'BRANCH' | 'POSTOMAT'
}

type NovaPoshtaDeliveryType = 'BRANCH' | 'POSTOMAT' | 'COURIER'

type NovaPoshtaOptionsResponse = {
  data: NovaPoshtaOption[]
  error?: string
}

type OrderFormProps = {
  locale?: Locale
}

export const OrderForm = ({ locale }: OrderFormProps) => {
  const pathname = usePathname()
  const resolvedLocale = locale ?? getLocaleFromPathname(pathname)
  const isEn = resolvedLocale === 'en'
  const t = {
    emptyTitle: isEn ? 'Cart is empty' : 'Кошик порожній',
    emptyDesc: isEn
      ? 'Go back to catalog and add products to continue checkout.'
      : 'Поверніться до каталогу та додайте товари, щоб продовжити оформлення.',
    toCatalog: isEn ? 'Back to catalog' : 'До каталогу',
    contacts: isEn ? 'Contact details' : 'Контактні дані',
    contactsHint: isEn
      ? 'Provide delivery details. We will contact you to confirm.'
      : "Вкажіть дані для доставки. Ми зв'яжемось з вами для підтвердження.",
    fullName: isEn ? 'Full name' : "Ім'я та прізвище",
    phone: isEn ? 'Phone' : 'Телефон',
    deliveryMethod: isEn ? 'Delivery method' : 'Спосіб доставки',
    courier: isEn ? 'Courier' : 'Курʼєр',
    novaPoshta: isEn ? 'Nova Poshta' : 'Нова Пошта',
    address: isEn ? 'Delivery address' : 'Адреса доставки',
    city: isEn ? 'City' : 'Місто',
    selectCity: isEn ? 'Select city' : 'Оберіть місто',
    citySearch: isEn ? 'Enter city name' : 'Введіть назву міста',
    cityNotFound: isEn ? 'City not found' : 'Місто не знайдено',
    cityLoading: isEn ? 'Searching Nova Poshta cities...' : 'Шукаємо міста Нової Пошти...',
    cityFetchError: isEn
      ? 'Failed to load Nova Poshta cities'
      : 'Не вдалося завантажити міста Нової Пошти',
    npType: isEn ? 'Nova Poshta delivery type' : 'Тип доставки Новою Поштою',
    branch: isEn ? 'Branch' : 'Відділення',
    postomat: isEn ? 'Parcel locker' : 'Поштомат',
    npCourierAddress: isEn ? 'Address for Nova Poshta courier' : "Адреса для кур'єра Нової Пошти",
    selectWarehouse: isEn ? 'Select branch' : 'Оберіть відділення',
    selectPostomat: isEn ? 'Select parcel locker' : 'Оберіть поштомат',
    warehouseSearchBranch: isEn
      ? 'Enter branch address or number'
      : 'Введіть адресу або номер відділення',
    warehouseSearchPostomat: isEn
      ? 'Enter locker address or number'
      : 'Введіть адресу або номер поштомату',
    warehouseNotFound: isEn ? 'Pickup point not found' : 'Точку видачі не знайдено',
    warehousesLoading: isEn
      ? 'Loading Nova Poshta pickup points...'
      : 'Завантажуємо точки видачі Нової Пошти...',
    warehouseTypeNotFound: isEn ? 'No pickup points found for selected type.' : 'Для обраного типу точок не знайдено.',
    warehouseFetchError: isEn
      ? 'Failed to load Nova Poshta pickup points'
      : 'Не вдалося завантажити точки видачі Нової Пошти',
    orderComment: isEn ? 'Order comment' : 'Коментар до замовлення',
    commentPlaceholder: isEn
      ? 'For example: apartment intercom code, floor, delivery notes'
      : 'Наприклад: код домофона, поверх, побажання до доставки',
    confirm: isEn ? 'Confirm order' : 'Підтвердити замовлення',
    orderSummary: isEn ? 'Your order' : 'Ваше замовлення',
    noPrice: isEn ? 'Check price' : 'Ціну уточнюйте',
    total: isEn ? 'Total' : 'До сплати',
    whatsNext: isEn ? "What's next?" : 'Що далі?',
    whatsNextDesc: isEn
      ? 'After confirmation we will process your order and contact you with delivery details.'
      : "Після підтвердження ми передамо замовлення та зв'яжемося з вами для деталей доставки.",
    cartEmptyToastTitle: isEn ? 'Cart is empty' : 'Кошик порожній',
    cartEmptyToastDesc: isEn
      ? 'Add products before placing an order.'
      : 'Додайте товари перед оформленням замовлення.',
    redirectTitle: isEn ? 'Redirecting to payment' : 'Перенаправляємо на оплату',
    redirectDesc: isEn
      ? 'The PrivatBank payment page will open now.'
      : 'Зараз відкриється сторінка оплати ПриватБанку.',
    errorTitle: isEn ? 'Error' : 'Помилка',
    submitError: isEn ? 'Failed to place order' : 'Не вдалося оформити замовлення',
    loadingBasket: isEn ? 'Loading cart...' : 'Завантаження кошика...',
    itemFallback: isEn ? 'Product' : 'Товар',
    npCourierPrefix: isEn ? 'Nova Poshta (courier)' : "Нова Пошта (кур'єр)",
    npPrefix: isEn ? 'Nova Poshta' : 'Нова Пошта',
    npCourierComment: isEn ? 'Nova Poshta courier' : "Нова Пошта кур'єр",
  }

  const queryClient = useQueryClient()
  const [tokenId, setTokenId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCityPopoverOpen, setIsCityPopoverOpen] = useState(false)
  const [isWarehousePopoverOpen, setIsWarehousePopoverOpen] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [warehouseQuery, setWarehouseQuery] = useState('')
  const [cities, setCities] = useState<NovaPoshtaOption[]>([])
  const [warehouses, setWarehouses] = useState<NovaPoshtaOption[]>([])
  const [citiesError, setCitiesError] = useState('')
  const [warehousesError, setWarehousesError] = useState('')
  const [isCitiesLoading, setIsCitiesLoading] = useState(false)
  const [isWarehousesLoading, setIsWarehousesLoading] = useState(false)

  useEffect(() => {
    setTokenId(getOrCreateBasketToken())
  }, [])

  const form = useForm<IOrderSchema>({
    mode: 'onChange',
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      deliveryMethod: 'COURIER',
      novaPoshtaDeliveryType: 'BRANCH',
      address: '',
      novaPoshtaCityRef: '',
      novaPoshtaCityName: '',
      novaPoshtaWarehouseRef: '',
      novaPoshtaWarehouseName: '',
      comment: '',
      totalAmount: 0,
    },
  })

  const { data, isLoading } = useGetBasket({
    enabled: Boolean(tokenId),
    params: {
      tokenId,
    },
  })
  const currentBasket = data
  const items = currentBasket?.devices ?? []
  const uiTotalAmount = useMemo(
    () => items.reduce((sum, item) => sum + getLineTotal(item), 0),
    [items]
  )
  const deliveryMethod = form.watch('deliveryMethod') as DeliveryMethod
  const selectedCityRef = form.watch('novaPoshtaCityRef')
  const selectedCityName =
    form.watch('novaPoshtaCityName') ||
    cities.find((city) => city.ref === selectedCityRef)?.name ||
    ''
  const selectedWarehouseRef = form.watch('novaPoshtaWarehouseRef')
  const selectedWarehouseName =
    form.watch('novaPoshtaWarehouseName') ||
    warehouses.find((warehouse) => warehouse.ref === selectedWarehouseRef)?.name ||
    ''
  const isNovaPoshtaDelivery = deliveryMethod === 'NOVA_POSHTA'
  const novaPoshtaDeliveryType =
    (form.watch('novaPoshtaDeliveryType') as NovaPoshtaDeliveryType | undefined) || 'BRANCH'
  const isNovaPoshtaCourier = novaPoshtaDeliveryType === 'COURIER'
  const filteredWarehouses = useMemo(() => {
    const normalizedQuery = warehouseQuery.trim().toLowerCase()
    return warehouses.filter((warehouse) => {
      if (warehouse.kind !== novaPoshtaDeliveryType) return false
      if (!normalizedQuery) return true
      return warehouse.name.toLowerCase().includes(normalizedQuery)
    })
  }, [novaPoshtaDeliveryType, warehouseQuery, warehouses])

  useEffect(() => {
    if (!isNovaPoshtaDelivery) {
      setIsCityPopoverOpen(false)
      setIsWarehousePopoverOpen(false)
      setCities([])
      setWarehouses([])
      setCityQuery('')
      setWarehouseQuery('')
      setCitiesError('')
      setWarehousesError('')
      form.setValue('novaPoshtaDeliveryType', 'BRANCH')
      form.setValue('novaPoshtaCityRef', '')
      form.setValue('novaPoshtaCityName', '')
      form.setValue('novaPoshtaWarehouseRef', '')
      form.setValue('novaPoshtaWarehouseName', '')
      return
    }

    form.setValue('address', '')
  }, [form, isNovaPoshtaDelivery])

  useEffect(() => {
    if (!isNovaPoshtaDelivery) return

    const normalizedQuery = cityQuery.trim()
    if (normalizedQuery.length < 2) {
      setCities([])
      setCitiesError('')
      return
    }

    const timeout = setTimeout(async () => {
      setIsCitiesLoading(true)
      setCitiesError('')
      try {
        const response = await api.get<NovaPoshtaOptionsResponse>('/delivery/nova-poshta', {
          params: {
            action: 'cities',
            query: normalizedQuery,
          },
        })

        setCities(response.data.data ?? [])
      } catch (error) {
        const errorMessage =
          ((error as AxiosError)?.response?.data as { error?: string; message?: string })?.error ||
          ((error as AxiosError)?.response?.data as { error?: string; message?: string })
            ?.message ||
          t.cityFetchError
        setCitiesError(errorMessage)
      } finally {
        setIsCitiesLoading(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [cityQuery, isNovaPoshtaDelivery])

  useEffect(() => {
    if (!isNovaPoshtaDelivery || !selectedCityRef || isNovaPoshtaCourier) {
      setWarehouses([])
      setWarehousesError('')
      return
    }

    let isCancelled = false

    ;(async () => {
      setIsWarehousesLoading(true)
      setWarehousesError('')
      try {
        const response = await api.get<NovaPoshtaOptionsResponse>('/delivery/nova-poshta', {
          params: {
            action: 'warehouses',
            cityRef: selectedCityRef,
          },
        })

        if (!isCancelled) {
          setWarehouses(response.data.data ?? [])
        }
      } catch (error) {
        if (isCancelled) return
        const errorMessage =
          ((error as AxiosError)?.response?.data as { error?: string; message?: string })?.error ||
          ((error as AxiosError)?.response?.data as { error?: string; message?: string })
            ?.message ||
          t.warehouseFetchError
        setWarehousesError(errorMessage)
      } finally {
        if (!isCancelled) {
          setIsWarehousesLoading(false)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [isNovaPoshtaCourier, isNovaPoshtaDelivery, selectedCityRef])

  useEffect(() => {
    const currentWarehouseRef = form.getValues('novaPoshtaWarehouseRef')
    if (!currentWarehouseRef) return

    const selectedWarehouse = warehouses.find((warehouse) => warehouse.ref === currentWarehouseRef)
    if (selectedWarehouse && selectedWarehouse.kind !== novaPoshtaDeliveryType) {
      form.setValue('novaPoshtaWarehouseRef', '', { shouldValidate: true })
      form.setValue('novaPoshtaWarehouseName', '')
    }
  }, [form, novaPoshtaDeliveryType, warehouses])

  useEffect(() => {
    if (!isNovaPoshtaDelivery) return

    if (isNovaPoshtaCourier) {
      form.setValue('novaPoshtaWarehouseRef', '', { shouldValidate: true })
      form.setValue('novaPoshtaWarehouseName', '')
      setIsWarehousePopoverOpen(false)
      setWarehouseQuery('')
    }
  }, [form, isNovaPoshtaCourier, isNovaPoshtaDelivery])

  useEffect(() => {
    setWarehouseQuery('')
    setIsWarehousePopoverOpen(false)
  }, [novaPoshtaDeliveryType, selectedCityRef])

  const onSubmit = async (data: IOrderSchema) => {
    setIsSubmitting(true)

    if (!currentBasket || items.length === 0) {
      toast({
        title: t.cartEmptyToastTitle,
        description: t.cartEmptyToastDesc,
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    const orderItems = items.map((item) => ({
      id: item.id,
      deviceId: item.deviceId,
      quantity: item.quantity,
      device: {
        id: item.device?.id ?? null,
        name: item.device?.nameLocalized ?? item.device?.name ?? null,
        imageUrl: item.device?.imageUrl ?? null,
        price: item.device?.priceUah ?? 0,
      },
      lineTotal: getLineTotal(item),
    }))

    try {
      const isNovaPoshta = data.deliveryMethod === 'NOVA_POSHTA'
      const isNovaPoshtaCourierOrder = data.novaPoshtaDeliveryType === 'COURIER'
      const selectedCity = cities.find((city) => city.ref === data.novaPoshtaCityRef)
      const selectedWarehouse = warehouses.find(
        (warehouse) => warehouse.ref === data.novaPoshtaWarehouseRef
      )
      const cityName = data.novaPoshtaCityName || selectedCity?.name || ''
      const warehouseName = data.novaPoshtaWarehouseName || selectedWarehouse?.name || ''
      const courierAddress = data.address?.trim() || ''
      const deliveryAddress = isNovaPoshta
        ? isNovaPoshtaCourierOrder
          ? `${t.npCourierPrefix}, ${cityName}, ${courierAddress}`
          : `${t.npPrefix}, ${cityName}, ${warehouseName}`
        : (data.address?.trim() ?? '')

      const deliveryComment = [
        data.comment?.trim(),
        isNovaPoshta
          ? isNovaPoshtaCourierOrder
            ? `${t.npCourierComment}: ${cityName}, ${courierAddress}`
            : `${t.npPrefix}: ${cityName}, ${warehouseName}`
          : undefined,
      ]
        .filter(Boolean)
        .join('\n')

      const paymentResponse = await api.post<{
        checkoutUrl: string
        data: string
        signature: string
      }>('/payments/privatbank/checkout', {
        ...data,
        address: deliveryAddress,
        comment: deliveryComment || undefined,
        totalAmount: uiTotalAmount,
        items: orderItems,
      })

      await Promise.all(
        items.map((item) =>
          apiBasket.removeDevice({
            basketId: currentBasket.id,
            deviceId: item.deviceId,
          })
        )
      )
      await queryClient.invalidateQueries({ queryKey: ['basket'] })

      toast({
        title: t.redirectTitle,
        description: t.redirectDesc,
      })

      const { checkoutUrl, data: liqPayData, signature } = paymentResponse.data

      const checkoutForm = document.createElement('form')
      checkoutForm.method = 'POST'
      checkoutForm.action = checkoutUrl

      const dataInput = document.createElement('input')
      dataInput.type = 'hidden'
      dataInput.name = 'data'
      dataInput.value = liqPayData

      const signatureInput = document.createElement('input')
      signatureInput.type = 'hidden'
      signatureInput.name = 'signature'
      signatureInput.value = signature

      checkoutForm.append(dataInput, signatureInput)
      document.body.appendChild(checkoutForm)
      checkoutForm.submit()
    } catch (error) {
      setIsSubmitting(false)
      const errorMessage =
        ((error as AxiosError)?.response?.data as { message?: string; error?: string })?.message ||
        ((error as AxiosError)?.response?.data as { message?: string; error?: string })?.error ||
        t.submitError

      toast({
        title: t.errorTitle,
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        {t.loadingBasket}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900">{t.emptyTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">
          {t.emptyDesc}
        </p>
        <Button asChild className="mt-5" variant="black">
          <Link href={withLocalePath('/', resolvedLocale)}>{t.toCatalog}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t.contacts}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t.contactsHint}
        </p>

        <Form {...form}>
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormInput name="fullName" placeholder={t.fullName} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput name="email" placeholder="Email" />
              <FormInput name="phone" placeholder={t.phone} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.deliveryMethod}</label>
              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  type="button"
                  variant={isNovaPoshtaDelivery ? 'black_out' : 'black'}
                  onClick={() =>
                    form.setValue('deliveryMethod', 'COURIER', { shouldValidate: true })
                  }
                >
                  {t.courier}
                </Button>
                <Button
                  type="button"
                  variant={isNovaPoshtaDelivery ? 'black' : 'black_out'}
                  onClick={() =>
                    form.setValue('deliveryMethod', 'NOVA_POSHTA', { shouldValidate: true })
                  }
                >
                  {t.novaPoshta}
                </Button>
              </div>
            </div>

            {!isNovaPoshtaDelivery && <FormInput name="address" placeholder={t.address} />}

            {isNovaPoshtaDelivery && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="novaPoshtaCityRef"
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-medium">{t.city}</label>
                      <FormControl>
                        <Popover open={isCityPopoverOpen} onOpenChange={setIsCityPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="black_out"
                              className="w-full justify-start font-normal"
                            >
                              {selectedCityName || t.selectCity}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <Command shouldFilter={false}>
                              <CommandInput
                                value={cityQuery}
                                onValueChange={setCityQuery}
                                placeholder={t.citySearch}
                              />
                              <CommandList>
                                {!isCitiesLoading &&
                                  cityQuery.trim().length >= 2 &&
                                  cities.length === 0 && (
                                    <CommandEmpty>{t.cityNotFound}</CommandEmpty>
                                  )}
                                <CommandGroup>
                                  {cities.map((city) => (
                                    <CommandItem
                                      key={city.ref}
                                      value={`${city.name} ${city.ref}`}
                                      onSelect={() => {
                                        field.onChange(city.ref)
                                        form.setValue('novaPoshtaCityName', city.name, {
                                          shouldValidate: true,
                                        })
                                        setCityQuery(city.name)
                                        form.setValue('novaPoshtaWarehouseRef', '', {
                                          shouldValidate: true,
                                        })
                                        form.setValue('novaPoshtaWarehouseName', '')
                                        setWarehouseQuery('')
                                        setIsCityPopoverOpen(false)
                                      }}
                                    >
                                      {city.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCitiesLoading && (
                  <p className="text-xs text-slate-500">{t.cityLoading}</p>
                )}
                {citiesError && <p className="text-red-500 text-xs">{citiesError}</p>}

                <FormField
                  control={form.control}
                  name="novaPoshtaDeliveryType"
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-medium">{t.npType}</label>
                      <FormControl>
                        <RadioGroup
                          className="grid gap-2 md:grid-cols-3"
                          value={field.value || 'BRANCH'}
                          onValueChange={(value) => field.onChange(value as NovaPoshtaDeliveryType)}
                        >
                          <div className="flex items-center space-x-2 rounded-xl border border-slate-200 px-3 py-2">
                            <RadioGroupItem value="BRANCH" id="np-branch" />
                            <Label htmlFor="np-branch">{t.branch}</Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-xl border border-slate-200 px-3 py-2">
                            <RadioGroupItem value="POSTOMAT" id="np-postomat" />
                            <Label htmlFor="np-postomat">{t.postomat}</Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-xl border border-slate-200 px-3 py-2">
                            <RadioGroupItem value="COURIER" id="np-courier" />
                            <Label htmlFor="np-courier">{t.courier}</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isNovaPoshtaCourier ? (
                  <FormInput name="address" placeholder={t.npCourierAddress} />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="novaPoshtaWarehouseRef"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Popover
                              open={isWarehousePopoverOpen}
                              onOpenChange={setIsWarehousePopoverOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="black_out"
                                  className="w-full justify-start font-normal"
                                  disabled={!selectedCityRef || isWarehousesLoading}
                                >
                                  {selectedWarehouseName ||
                                    (novaPoshtaDeliveryType === 'POSTOMAT'
                                      ? t.selectPostomat
                                      : t.selectWarehouse)}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                align="start"
                              >
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    value={warehouseQuery}
                                    onValueChange={setWarehouseQuery}
                                    placeholder={
                                      novaPoshtaDeliveryType === 'POSTOMAT'
                                        ? t.warehouseSearchPostomat
                                        : t.warehouseSearchBranch
                                    }
                                  />
                                  <CommandList>
                                    {!isWarehousesLoading &&
                                      selectedCityRef &&
                                      filteredWarehouses.length === 0 && (
                                        <CommandEmpty>{t.warehouseNotFound}</CommandEmpty>
                                      )}
                                    <CommandGroup>
                                      {filteredWarehouses.map((warehouse) => (
                                        <CommandItem
                                          key={warehouse.ref}
                                          value={`${warehouse.name} ${warehouse.ref}`}
                                          onSelect={() => {
                                            field.onChange(warehouse.ref)
                                            form.setValue(
                                              'novaPoshtaWarehouseName',
                                              warehouse.name,
                                              {
                                                shouldValidate: true,
                                              }
                                            )
                                            setWarehouseQuery(warehouse.name)
                                            setIsWarehousePopoverOpen(false)
                                          }}
                                        >
                                          {warehouse.kind === 'POSTOMAT'
                                            ? `[${t.postomat}] `
                                            : `[${t.branch}] `}
                                          {warehouse.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isWarehousesLoading && (
                      <p className="text-xs text-slate-500">
                        {t.warehousesLoading}
                      </p>
                    )}
                    {!isWarehousesLoading && selectedCityRef && filteredWarehouses.length === 0 && (
                      <p className="text-xs text-slate-500">{t.warehouseTypeNotFound}</p>
                    )}
                    {warehousesError && <p className="text-red-500 text-xs">{warehousesError}</p>}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.orderComment}</label>
              <Textarea
                rows={4}
                placeholder={t.commentPlaceholder}
                {...form.register('comment')}
              />
            </div>

            <Button
              type="submit"
              variant="black"
              className="h-11 w-full"
              disabled={!form.formState.isValid || isSubmitting}
              loading={isSubmitting}
            >
              {t.confirm}
            </Button>
          </form>
        </Form>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">{t.orderSummary}</h3>
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const product = item.device
              const lineTotal = getLineTotal(item)

              return (
                <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                  <img
                    src={product?.imageUrl ?? '/logo.svg'}
                    alt={product?.nameLocalized ?? product?.name ?? `${t.itemFallback} #${item.deviceId}`}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {product?.nameLocalized ?? product?.name ?? `${t.itemFallback} #${item.deviceId}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product?.brand?.nameLocalized ?? product?.brand?.name ?? product?.category?.nameLocalized ?? product?.category?.name}
                    </p>
                    {product?.priceUah !== null ? (
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {lineTotal.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-500">{t.noPrice}</p>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">x{item.quantity}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{t.total}</span>
              <span className="text-xl font-bold text-slate-900">
                {uiTotalAmount.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">{t.whatsNext}</h3>
          <p className="mt-2 text-sm text-slate-500">
            {t.whatsNextDesc}
          </p>
        </div>
      </aside>
    </div>
  )
}
