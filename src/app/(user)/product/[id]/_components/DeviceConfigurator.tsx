'use client'

import { PackageCheck, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useQueryClient } from '@tanstack/react-query'

import { QuantitySelector } from '@/components/shared/QuantitySelector'
import { Button } from '@/components/ui/button'
import { GroupVariants } from '@/components/ui/group-variants'

import { apiBasket } from '@/actions/client/basketAction'

import { useDeviceGallery } from '@/hooks/useDeviceGallery'
import { useQuantitySelector } from '@/hooks/useQuantitySelector'

import { getOrCreateBasketToken } from '@/lib/basket-token'
import { Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { IDevice } from '@/types/device'

import { DeviceGallery } from './DeviceGallery'

type DeviceConfiguratorProps = {
  device: IDevice
  locale?: Locale
}

const DEVICE_TYPE_LABELS: Record<Locale, Record<IDevice['deviceType'], string>> = {
  ua: {
    TABLET: 'Планшет',
    MONITOR: 'Монітор',
    OTHER: 'Техніка',
  },
  en: {
    TABLET: 'Tablet',
    MONITOR: 'Monitor',
    OTHER: 'Device',
  },
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

const COLOR_KEYWORDS = ['color', 'colour', 'колір']

const COLOR_SWATCHES = [
  { match: ['black', 'graphite', 'space gray', 'чорн', 'графіт'], color: '#111827' },
  { match: ['white', 'silver', 'starlight', 'білий', 'срібл', 'silver'], color: '#e5e7eb' },
  { match: ['blue', 'син', 'блакит'], color: '#3b82f6' },
  { match: ['green', 'зел'], color: '#22c55e' },
  { match: ['red', 'черв'], color: '#ef4444' },
  { match: ['pink', 'рож'], color: '#ec4899' },
  { match: ['purple', 'violet', 'фіолет'], color: '#8b5cf6' },
  { match: ['gold', 'yellow', 'золот', 'жовт'], color: '#f59e0b' },
]

const normalizeValue = (value?: string | null) => value?.trim().toLowerCase() ?? ''

const isColorKey = (value: string) =>
  COLOR_KEYWORDS.some((keyword) => normalizeValue(value).includes(keyword))

const getInfoLabel = (
  key?: string | null,
  keyLocalized?: string | null,
  fallback = 'Specification'
) => keyLocalized?.trim() || key?.trim() || fallback

const getInfoValue = (value?: string | null, valueLocalized?: string | null) =>
  valueLocalized?.trim() || value?.trim() || 'N/A'

const getColorSwatch = (value: string) => {
  const normalized = normalizeValue(value)
  const preset = COLOR_SWATCHES.find((item) =>
    item.match.some((keyword) => normalized.includes(keyword))
  )

  return preset?.color ?? '#cbd5e1'
}

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
      ? 'Modern device for work, study and entertainment. Choose a color, review specs and add to cart in seconds.'
      : 'Сучасний девайс для щоденної роботи, навчання та розваг. Обери колір, переглянь характеристики та швидко додай модель у кошик.',
    rating: isEn ? 'Rating' : 'Рейтинг',
    color: isEn ? 'Color' : 'Колір',
    availableShade: isEn ? 'Available shade' : 'Доступний відтінок',
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

  const queryClient = useQueryClient()
  const { quantity, handleDecrease, handleIncrease, handleChangeInput } = useQuantitySelector(1)
  const [isAdding, setIsAdding] = useState(false)

  const displayName = isEn
    ? (device.name ?? device.nameLocalized ?? device.slug)
    : (device.nameLocalized ?? device.name ?? device.slug)
  const categoryName = isEn
    ? (device.category?.name ?? device.category?.nameLocalized ?? t.categoryFallback)
    : (device.category?.nameLocalized ?? device.category?.name ?? t.categoryFallback)
  const brandName = isEn
    ? (device.brand?.name ?? device.brand?.nameLocalized ?? t.brandFallback)
    : (device.brand?.nameLocalized ?? device.brand?.name ?? t.brandFallback)

  const { galleryImages, selectedImage, setSelectedImage } = useDeviceGallery({
    imageUrl: device.imageUrl,
    imageUrls: device.imageUrls,
  })

  const groupedSpecs = useMemo(() => {
    const map = new Map<string, { key: string; label: string; values: string[] }>()

    for (const item of device.info ?? []) {
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

    return [...map.values()].sort((a, b) => {
      const aIndex = SPEC_PRIORITY.findIndex((item) => a.key.includes(item))
      const bIndex = SPEC_PRIORITY.findIndex((item) => b.key.includes(item))
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex

      if (normalizedA !== normalizedB) return normalizedA - normalizedB
      return a.label.localeCompare(b.label, isEn ? 'en' : 'uk')
    })
  }, [device.info, isEn])

  const colorSpec = useMemo(() => groupedSpecs.find((spec) => isColorKey(spec.key)), [groupedSpecs])

  const colorOptions = colorSpec?.values ?? []
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? '')
  useEffect(() => {
    if (!selectedColor || !colorOptions.includes(selectedColor)) {
      setSelectedColor(colorOptions[0] ?? '')
    }
  }, [colorOptions, selectedColor])

  const keySpecs = groupedSpecs.filter((spec) => !isColorKey(spec.key)).slice(0, 6)
  const otherSpecs = groupedSpecs.filter((spec) => !keySpecs.includes(spec))

  const totalPrice = device.priceUah !== null ? device.priceUah * quantity : null
  const hasDiscount =
    device.oldPriceUah !== null && device.priceUah !== null && device.oldPriceUah > device.priceUah
  const discountPercent = hasDiscount
    ? Math.round(((device.oldPriceUah! - device.priceUah!) / device.oldPriceUah!) * 100)
    : 0

  const handleAddToBasket = async () => {
    try {
      setIsAdding(true)
      const tokenId = getOrCreateBasketToken()

      let basket = await apiBasket.getOne({ tokenId })
      if (!basket) {
        basket = await apiBasket.create({ tokenId })
      }

      await apiBasket.addDevice({
        basketId: basket.id,
        deviceId: device.id,
        quantity,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['basket'] }),
        queryClient.invalidateQueries({ queryKey: ['basket', { tokenId }] }),
      ])

      toast.success(
        selectedColor
          ? `${displayName} (${selectedColor}) ${t.cartAdded}`
          : `${displayName} ${t.cartAdded}`
      )
    } catch (error) {
      console.error(error)
      toast.error(t.addError)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="grid gap-6 rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.35)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_460px]">
      <DeviceGallery
        images={galleryImages}
        selectedImage={selectedImage}
        onSelect={setSelectedImage}
        deviceName={displayName}
        categoryName={categoryName}
        className="border-white/60 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.4)]"
      />

      <div className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {categoryName}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {DEVICE_TYPE_LABELS[locale][device.deviceType]}
            </span>
            {device.inStock ? (
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
                {device.stockCount !== null ? `${device.stockCount} ${t.units}` : t.checkStock}
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

        {colorOptions.length > 0 && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t.color}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-950">
                  {selectedColor || colorOptions[0]}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span
                  className={cn(
                    'h-4 w-4 rounded-full border border-slate-300 shadow-inner',
                    selectedColor &&
                      getColorSwatch(selectedColor) === '#e5e7eb' &&
                      'border-slate-400'
                  )}
                  style={{ backgroundColor: getColorSwatch(selectedColor || colorOptions[0]) }}
                />
                {t.availableShade}
              </div>
            </div>

            <GroupVariants
              items={colorOptions.map((value) => ({
                name: value,
                value,
              }))}
              selectedValue={selectedColor}
              onClick={(value) => setSelectedColor(value)}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {colorOptions.map((value) => (
                <div
                  key={value}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    value === selectedColor
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/10"
                    style={{ backgroundColor: getColorSwatch(value) }}
                  />
                  {value}
                </div>
              ))}
            </div>
          </div>
        )}

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

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t.quantity}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedColor ? `${t.selected}: ${selectedColor}` : t.defaultConfig}
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
                {hasDiscount && device.oldPriceUah !== null && (
                  <div className="mt-1 text-sm text-white/50 line-through">
                    {(device.oldPriceUah * quantity).toLocaleString(isEn ? 'en-US' : 'uk-UA')} ₴
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
              disabled={!device.inStock}
            >
              {device.inStock ? t.addToCart : t.unavailable}
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
