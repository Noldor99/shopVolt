import { notFound } from 'next/navigation'

import { getServerLocale } from '@/lib/server-locale'
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

export const generateMetadata = async ({ params }: DevicePageProps) => {
  const locale = await getServerLocale()
  const device = await fetchDeviceById(params.id, locale).catch(() => null)

  if (!device) {
    return {
      title: locale === 'en' ? 'Product not found' : 'Товар не знайдено',
      description: locale === 'en' ? 'Product page is unavailable' : 'Сторінка товару недоступна',
    }
  }

  const deviceName = device.nameLocalized ?? device.name ?? device.slug
  return {
    title: `${deviceName} - V3V`,
    description:
      locale === 'en'
        ? `Configure ${deviceName} and add it to cart`
        : `Сконфігуруйте ${deviceName} та додайте в кошик`,
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
