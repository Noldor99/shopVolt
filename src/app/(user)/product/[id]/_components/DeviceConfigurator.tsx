'use client'

import { PackageCheck, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useAddBasketDevice, useCreateBasket, useGetBasket } from '@/ahooks/useBasket'

import { QuantitySelector } from '@/components/shared/QuantitySelector'
import { Button } from '@/components/ui/button'

import { useDeviceGallery } from '@/hooks/useDeviceGallery'
import { useQuantitySelector } from '@/hooks/useQuantitySelector'

import { getOrCreateBasketToken } from '@/lib/basket-token'
import { Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { IDevice, IDeviceItem, IDeviceItemProperty } from '@/types/device'

import { DeviceGallery } from './DeviceGallery'

type DeviceConfiguratorProps = {
  device: IDevice
  locale?: Locale
}

const SPEC_PRIORITY = [
  'display',
  'screen',
  'діагональ',
  'diagonal',
  'resolution',
  'роздільна',
  'refresh',
  'герц',
  'processor',
  'процесор',
  'chip',
  'ram',
  'оператив',
  'memory',
  'storage',
  'накопичувач',
  'ssd',
  'battery',
  'акумулятор',
] as const

const normalizeValue = (value?: string | null) => value?.trim().toLowerCase() ?? ''
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const getInfoLabel = (
  key?: string | null,
  keyLocalized?: string | null,
  fallback = 'Specification'
) => keyLocalized?.trim() || key?.trim() || fallback

const getInfoValue = (value?: string | null, valueLocalized?: string | null) =>
  valueLocalized?.trim() || value?.trim() || 'N/A'

const isHexColor = (value?: string | null) => HEX_COLOR_RE.test(value?.trim() ?? '')

const getLocalizedAttributeName = (
  property: IDeviceItemProperty,
  locale: Locale,
  fallback = 'Option'
) => {
  const translations = property.categoryAttribute?.attribute?.translations ?? []
  const preferredLocale = locale === 'en' ? 'en' : 'ua'
  const fallbackLocale = preferredLocale === 'en' ? 'ua' : 'en'

  return (
    translations.find((item) => item.locale === preferredLocale)?.name?.trim() ||
    translations.find((item) => item.locale === fallbackLocale)?.name?.trim() ||
    property.categoryAttribute?.attribute?.code?.trim() ||
    fallback
  )
}

const getLocalizedPropertyValue = (property: IDeviceItemProperty, locale: Locale) =>
  (locale === 'en' ? property.valueEn : property.valueUa)?.trim() ||
  (locale === 'en' ? property.valueUa : property.valueEn)?.trim() ||
  property.attributeValue?.code?.trim() ||
  ''

export const DeviceConfigurator = ({ device, locale = 'ua' }: DeviceConfiguratorProps) => {
  const isEn = locale === 'en'
  const t = {
    inStock: isEn ? 'In stock' : 'В наявності',
    outOfStock: isEn ? 'Out of stock' : 'Немає в наявності',
    save: isEn ? 'Save' : 'Економія',
    brandFallback: isEn ? 'No brand' : 'Без бренду',
    categoryFallback: isEn ? 'Category' : 'Категорія',
    newProduct: isEn ? 'New' : 'Новинка',
    reviewsSuffix: isEn ? 'reviews' : 'відгуків',
    firstReviewsSoon: isEn ? 'First reviews coming soon' : 'Перші оцінки вже скоро',
    stock: isEn ? 'Stock' : 'Наявність',
    units: isEn ? 'pcs' : 'шт.',
    checkStock: isEn ? 'Check availability' : 'Уточнюйте',
    stockRealtime: isEn ? 'Stock updates in real time' : 'Оновлюємо залишки в реальному часі',
    delivery: isEn ? 'Delivery' : 'Доставка',
    deliveryTime: isEn ? '1-3 days' : '1-3 дні',
    deliveryHint: isEn ? 'Fast shipping across Ukraine' : 'Швидка відправка по Україні',
    warranty: isEn ? 'Warranty' : 'Гарантія',
    warrantyTime: isEn ? '12 months' : '12 міс.',
    warrantyHint: isEn ? 'Support and service after purchase' : 'Підтримка та сервіс після покупки',
    intro: isEn
      ? 'Modern device for work, study and entertainment. Choose the right configuration, review specs and add it to cart in seconds.'
      : 'Сучасний девайс для щоденної роботи, навчання та розваг. Обери потрібну конфігурацію, переглянь характеристики та швидко додай модель у кошик.',
    rating: isEn ? 'Rating' : 'Рейтинг',
    options: isEn ? 'Available options' : 'Доступні варіанти',
    keySpecs: isEn ? 'Key specifications' : 'Ключові характеристики',
    quantity: isEn ? 'Quantity' : 'Кількість',
    selected: isEn ? 'Selected' : 'Обрано',
    defaultConfig: isEn ? 'Default configuration' : 'Стандартна комплектація',
    total: isEn ? 'Total' : 'До сплати',
    checkPrice: isEn ? 'Check price' : 'Ціну уточнюйте',
    paymentHint: isEn
      ? 'Pay on delivery, online, or in installments'
      : 'Оплата при отриманні, онлайн або частинами',
    officialWarranty: isEn ? 'Official warranty' : 'Офіційна гарантія',
    preShipmentCheck: isEn ? 'Pre-shipment check' : 'Перевірка перед відправкою',
    returns: isEn ? '14-day returns & exchange' : 'Обмін та повернення 14 днів',
    addToCart: isEn ? 'Add to cart' : 'Додати в кошик',
    unavailable: isEn ? 'Temporarily unavailable' : 'Тимчасово недоступно',
    fullSpecs: isEn ? 'Full specifications' : 'Повний опис характеристик',
    specsSoon: isEn
      ? 'Specifications for this item will appear soon. You can already view photos, price and place an order.'
      : 'Характеристики для цього товару скоро зʼявляться. Зараз уже можна переглянути фото, ціну та оформити покупку.',
    cartAdded: isEn ? 'added to cart' : 'додано в кошик',
    addError: isEn ? 'Failed to add item to cart' : 'Не вдалося додати товар у кошик',
  }

  const [tokenId, setTokenId] = useState('')
  useEffect(() => {
    setTokenId(getOrCreateBasketToken())
  }, [])

  const { data: existingBasket } = useGetBasket({
    enabled: Boolean(tokenId),
    params: { tokenId },
  })
  const createBasketMutation = useCreateBasket()
  const addDeviceMutation = useAddBasketDevice()

  const { quantity, handleDecrease, handleIncrease, handleChangeInput } = useQuantitySelector(1)
  const isAdding = addDeviceMutation.isPending || createBasketMutation.isPending

  const displayName = isEn
    ? (device.name ?? device.nameLocalized ?? device.slug)
    : (device.nameLocalized ?? device.name ?? device.slug)
  const categoryName = isEn
    ? (device.category?.name ?? device.category?.nameLocalized ?? t.categoryFallback)
    : (device.category?.nameLocalized ?? device.category?.name ?? t.categoryFallback)
  const brandName = isEn
    ? (device.brand?.name ?? device.brand?.nameLocalized ?? t.brandFallback)
    : (device.brand?.nameLocalized ?? device.brand?.name ?? t.brandFallback)

  const deviceItems = useMemo(() => device.items ?? [], [device.items])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(deviceItems[0]?.id ?? null)

  useEffect(() => {
    if (deviceItems.length === 0) {
      setSelectedItemId(null)
      return
    }

    if (!deviceItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(deviceItems[0]?.id ?? null)
    }
  }, [deviceItems, selectedItemId])

  const selectedItem = useMemo(
    () => deviceItems.find((item) => item.id === selectedItemId) ?? deviceItems[0] ?? null,
    [deviceItems, selectedItemId]
  )

  const allPropertyGroups = useMemo(() => {
    const groupMap = new Map<
      number,
      {
        categoryAttributeId: number
        code: string
        name: string
        options: Map<
          number,
          {
            attributeValueId: number
            label: string
            displayValue: string
            visualValue: string | null
          }
        >
      }
    >()

    deviceItems.forEach((item) => {
      ;(item.properties ?? []).forEach((property) => {
        const categoryAttributeId = Number(property.categoryAttributeId)
        const attributeValueId = Number(property.attributeValueId)
        if (!Number.isInteger(categoryAttributeId) || !Number.isInteger(attributeValueId)) return

        const groupName = getLocalizedAttributeName(property, locale, isEn ? 'Option' : 'Опція')
        const optionLabel = getLocalizedPropertyValue(property, locale)
        const visualValue =
          (
            property.attributeValue as
              | {
                  visualValue?: string | null
                }
              | null
              | undefined
          )?.visualValue?.trim() || null

        const existingGroup =
          groupMap.get(categoryAttributeId) ??
          {
            categoryAttributeId,
            code: property.categoryAttribute?.attribute?.code ?? String(categoryAttributeId),
            name: groupName,
            options: new Map<number, { attributeValueId: number; label: string; displayValue: string; visualValue: string | null }>(),
          }

        existingGroup.options.set(attributeValueId, {
          attributeValueId,
          label: optionLabel,
          displayValue: !isHexColor(visualValue) && visualValue ? visualValue : optionLabel,
          visualValue,
        })

        groupMap.set(categoryAttributeId, existingGroup)
      })
    })

    return [...groupMap.values()]
      .map((group) => ({
        categoryAttributeId: group.categoryAttributeId,
        code: group.code,
        name: group.name,
        options: [...group.options.values()],
      }))
      .sort((left, right) => left.name.localeCompare(right.name, isEn ? 'en' : 'uk'))
  }, [deviceItems, isEn, locale])

  const variationGroups = useMemo(
    () => allPropertyGroups.filter((group) => group.options.length > 1),
    [allPropertyGroups]
  )

  const staticPropertyGroups = useMemo(
    () => allPropertyGroups.filter((group) => group.options.length <= 1),
    [allPropertyGroups]
  )

  const selectedOptions = useMemo(() => {
    return new Map(
      (selectedItem?.properties ?? []).map((property) => [
        Number(property.categoryAttributeId),
        Number(property.attributeValueId),
      ])
    )
  }, [selectedItem])

  const activeGallerySources = useMemo(() => {
    const values = [
      selectedItem?.mainImage,
      ...(device.imageUrls ?? []),
      device.imageUrl,
    ].filter((value): value is string => Boolean(value?.trim()))

    return [...new Set(values)]
  }, [device.imageUrl, device.imageUrls, selectedItem?.mainImage])

  const { galleryImages, selectedImage, setSelectedImage } = useDeviceGallery({
    imageUrl: activeGallerySources[0] ?? device.imageUrl,
    imageUrls: activeGallerySources,
  })

  const variationAttributeIds = useMemo(
    () => new Set(variationGroups.map((group) => group.categoryAttributeId)),
    [variationGroups]
  )

  const groupedSpecs = useMemo(() => {
    const map = new Map<string, { key: string; label: string; values: string[] }>()

    for (const item of (device.info ?? []).filter(
      (infoItem) => !variationAttributeIds.has(Number(infoItem.categoryAttributeId))
    )) {
      const label = getInfoLabel(
        item.key,
        item.keyLocalized,
        isEn ? 'Specification' : 'Характеристика'
      )
      const value = getInfoValue(item.value, item.valueLocalized)
      const key = normalizeValue(label)

      if (!key) continue

      const existing = map.get(key)
      if (existing) {
        if (!existing.values.includes(value)) {
          existing.values.push(value)
        }
      } else {
        map.set(key, { key, label, values: [value] })
      }
    }

    for (const group of staticPropertyGroups) {
      const firstOption = group.options[0]
      const key = normalizeValue(group.name)
      const value = firstOption?.label?.trim() || firstOption?.displayValue?.trim() || ''
      if (!key || !value) continue

      const existing = map.get(key)
      if (existing) {
        if (!existing.values.includes(value)) {
          existing.values.push(value)
        }
      } else {
        map.set(key, {
          key,
          label: group.name,
          values: [value],
        })
      }
    }

    return [...map.values()].sort((a, b) => {
      const aIndex = SPEC_PRIORITY.findIndex((item) => a.key.includes(item))
      const bIndex = SPEC_PRIORITY.findIndex((item) => b.key.includes(item))
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex

      if (normalizedA !== normalizedB) return normalizedA - normalizedB
      return a.label.localeCompare(b.label, isEn ? 'en' : 'uk')
    })
  }, [device.info, isEn, staticPropertyGroups, variationAttributeIds])

  const keySpecs = groupedSpecs.slice(0, 6)
  const otherSpecs = groupedSpecs.slice(6)

  const activePrice = selectedItem?.priceUah ?? device.priceUah
  const activeOldPrice = selectedItem?.oldPriceUah ?? device.oldPriceUah
  const activeInStock = selectedItem?.inStock ?? device.inStock
  const activeStockCount = selectedItem?.stockCount ?? device.stockCount
  const totalPrice = activePrice !== null ? activePrice * quantity : null
  const hasDiscount =
    activeOldPrice !== null && activePrice !== null && activeOldPrice > activePrice
  const discountPercent = hasDiscount
    ? Math.round(((activeOldPrice! - activePrice!) / activeOldPrice!) * 100)
    : 0

  const selectedVariantSummary = useMemo(() => {
    return variationGroups
      .map((group) => {
        const selectedValueId = selectedOptions.get(group.categoryAttributeId)
        const selectedOption = group.options.find(
          (option) => option.attributeValueId === selectedValueId
        )
        return selectedOption ? `${group.name}: ${selectedOption.label}` : null
      })
      .filter(Boolean)
      .join(' / ')
  }, [selectedOptions, variationGroups])

  const hasMatchingItem = (categoryAttributeId: number, attributeValueId: number) => {
    return deviceItems.some((item) =>
      variationGroups.every((group) => {
        const expectedValueId =
          group.categoryAttributeId === categoryAttributeId
            ? attributeValueId
            : selectedOptions.get(group.categoryAttributeId)

        if (!expectedValueId) return true

        return (item.properties ?? []).some(
          (property) =>
            Number(property.categoryAttributeId) === group.categoryAttributeId &&
            Number(property.attributeValueId) === expectedValueId
        )
      })
    )
  }

  const handleSelectVariantOption = (categoryAttributeId: number, attributeValueId: number) => {
    const exactMatch = deviceItems.find((item) =>
      variationGroups.every((group) => {
        const expectedValueId =
          group.categoryAttributeId === categoryAttributeId
            ? attributeValueId
            : selectedOptions.get(group.categoryAttributeId)

        if (!expectedValueId) return true

        return (item.properties ?? []).some(
          (property) =>
            Number(property.categoryAttributeId) === group.categoryAttributeId &&
            Number(property.attributeValueId) === expectedValueId
        )
      })
    )

    const fallbackMatch = deviceItems.find((item) =>
      (item.properties ?? []).some(
        (property) =>
          Number(property.categoryAttributeId) === categoryAttributeId &&
          Number(property.attributeValueId) === attributeValueId
      )
    )

    setSelectedItemId(exactMatch?.id ?? fallbackMatch?.id ?? selectedItem?.id ?? null)
  }

  const handleAddToBasket = useCallback(async () => {
    try {
      const currentToken = tokenId || getOrCreateBasketToken()
      let basket = existingBasket

      if (!basket) {
        basket = await createBasketMutation.mutateAsync({ tokenId: currentToken })
      }

      addDeviceMutation.mutate(
        {
          basketId: basket.id,
          ...(selectedItem?.id ? { deviceItemId: selectedItem.id } : { deviceId: device.id }),
          quantity,
        },
        {
          onSuccess: () => {
            toast.success(
              selectedVariantSummary
                ? `${displayName} (${selectedVariantSummary}) ${t.cartAdded}`
                : `${displayName} ${t.cartAdded}`
            )
          },
          onError: () => {
            toast.error(t.addError)
          },
        }
      )
    } catch {
      toast.error(t.addError)
    }
  }, [
    tokenId,
    existingBasket,
    createBasketMutation,
    addDeviceMutation,
    selectedItem?.id,
    device.id,
    quantity,
    selectedVariantSummary,
    displayName,
    t.cartAdded,
    t.addError,
  ])

  return (
    <div className="grid gap-6 rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.35)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_460px]">
      <div>
        <DeviceGallery
          images={galleryImages}
          selectedImage={selectedImage}
          onSelect={setSelectedImage}
          deviceName={displayName}
          categoryName={categoryName}
          className="border-white/60 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.4)]"
        />
        {keySpecs.length > 0 && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-950">{t.keySpecs}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {keySpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {spec.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                    {spec.values.join(' / ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {categoryName}
            </span>
            {activeInStock ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {t.inStock}
              </span>
            ) : (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                {t.outOfStock}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                {t.save} {discountPercent}%
              </span>
            )}
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {brandName}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{displayName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{t.intro}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Star className="h-4 w-4 text-amber-500" />
                {t.rating}
              </div>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {device.rating !== null ? device.rating.toFixed(1) : t.newProduct}
              </p>
              <p className="text-xs text-slate-500">
                {device.reviewsCount
                  ? `${device.reviewsCount} ${t.reviewsSuffix}`
                  : t.firstReviewsSoon}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                {t.stock}
              </div>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {activeStockCount !== null ? `${activeStockCount} ${t.units}` : t.checkStock}
              </p>
              <p className="text-xs text-slate-500">{t.stockRealtime}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Truck className="h-4 w-4 text-sky-600" />
                {t.delivery}
              </div>
              <p className="mt-2 text-lg font-bold text-slate-950">{t.deliveryTime}</p>
              <p className="text-xs text-slate-500">{t.deliveryHint}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                {t.warranty}
              </div>
              <p className="mt-2 text-lg font-bold text-slate-950">{t.warrantyTime}</p>
              <p className="text-xs text-slate-500">{t.warrantyHint}</p>
            </div>
          </div>
        </div>

        {variationGroups.length > 0 && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t.options}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedVariantSummary || t.defaultConfig}
              </div>
            </div>

            <div className="space-y-4">
              {variationGroups.map((group) => (
                <div key={group.categoryAttributeId} className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isSelected =
                        selectedOptions.get(group.categoryAttributeId) === option.attributeValueId
                      const isAvailable = hasMatchingItem(
                        group.categoryAttributeId,
                        option.attributeValueId
                      )
                      const showColor = isHexColor(option.visualValue)

                      return (
                        <button
                          key={`${group.categoryAttributeId}-${option.attributeValueId}`}
                          type="button"
                          onClick={() =>
                            handleSelectVariantOption(
                              group.categoryAttributeId,
                              option.attributeValueId
                            )
                          }
                          disabled={!isAvailable}
                          className={cn(
                            'inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700',
                            !isAvailable && 'cursor-not-allowed opacity-40'
                          )}
                        >
                          {showColor ? (
                            <span
                              className={cn(
                                'h-5 w-5 rounded-full border shadow-inner',
                                isSelected ? 'border-white/60' : 'border-slate-300'
                              )}
                              style={{ backgroundColor: option.visualValue! }}
                            />
                          ) : null}
                          <span>{option.displayValue || option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t.quantity}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedVariantSummary ? `${t.selected}: ${selectedVariantSummary}` : t.defaultConfig}
              </div>
            </div>
            <QuantitySelector
              value={quantity}
              onDecrease={handleDecrease}
              onIncrease={handleIncrease}
              onChangeInput={handleChangeInput}
            />
          </div>

          <div className="mt-5 rounded-[24px] bg-slate-950 p-5 text-white">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm text-white/60">{t.total}</div>
                <div className="mt-1 text-3xl font-black tracking-tight">
                  {totalPrice !== null
                    ? `${totalPrice.toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴`
                    : t.checkPrice}
                </div>
                {hasDiscount && activeOldPrice !== null && (
                  <div className="mt-1 text-sm text-white/50 line-through">
                    {(activeOldPrice * quantity).toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {t.paymentHint}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {t.officialWarranty}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {t.preShipmentCheck}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {t.returns}
              </div>
            </div>

            <Button
              className="mt-5 h-12 w-full rounded-2xl bg-white text-base font-semibold text-slate-950 hover:opacity-90"
              onClick={handleAddToBasket}
              loading={isAdding}
              disabled={!activeInStock}
            >
              {activeInStock ? t.addToCart : t.unavailable}
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">{t.fullSpecs}</h2>

          {groupedSpecs.length > 0 ? (
            <div className="mt-4 space-y-3">
              {[...keySpecs, ...otherSpecs].map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-semibold text-slate-500">{spec.label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {spec.values.join(' / ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              {t.specsSoon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
