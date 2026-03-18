import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getServerLocale } from '@/lib/server-locale'
import { withLocalePath, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { IDevice } from '@/types/device'

import { DeviceConfigurator } from './_components/DeviceConfigurator'

export const revalidate = 300
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

const fetchDeviceById = async (id: string, locale: Locale): Promise<IDevice | null> => {
  const response = await fetch(`${API_BASE_URL}/devices/${id}?lang=${locale}`, {
    next: { revalidate },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Failed to load device ${id}: ${response.status}`)
  }

  return response.json()
}

type DevicePageProps = {
  params: {
    id: string
  }
}

export const generateStaticParams = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/devices?limit=100&lang=${DEFAULT_LOCALE}`)
    if (!response.ok) return []
    const data = await response.json()
    return (data.data ?? []).map((device: { id: number }) => ({
      id: String(device.id),
    }))
  } catch {
    return []
  }
}

export const generateMetadata = async ({ params }: DevicePageProps): Promise<Metadata> => {
  const locale = await getServerLocale()
  const device = await fetchDeviceById(params.id, locale).catch(() => null)

  if (!device) {
    return {
      title: locale === 'en' ? 'Product not found' : 'Товар не знайдено',
      description: locale === 'en' ? 'Product page is unavailable' : 'Сторінка товару недоступна',
    }
  }

  const deviceName = device.nameLocalized ?? device.name ?? device.slug
  const canonical = withLocalePath(`/product/${device.id}`, locale)

  return {
    title: `${deviceName} - V3V`,
    description:
      locale === 'en'
        ? `Buy ${deviceName} online at V3V. View specs, choose configuration and add to cart.`
        : `Купити ${deviceName} онлайн в V3V. Переглянути характеристики, обрати конфігурацію та додати в кошик.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${deviceName} - V3V`,
      images: device.imageUrl ? [{ url: device.imageUrl }] : undefined,
    },
  }
}

const DevicePage = async ({ params }: DevicePageProps) => {
  const locale = await getServerLocale()
  const device = await fetchDeviceById(params.id, locale).catch(() => null)

  if (!device) {
    notFound()
  }

  return (
    <section className="container py-8 sm:py-10">
      <DeviceConfigurator device={device} locale={locale} />
    </section>
  )
}

export default DevicePage
