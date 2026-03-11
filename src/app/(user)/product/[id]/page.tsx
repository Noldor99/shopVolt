import { notFound } from 'next/navigation'

import { deviceByIdPrefetch } from '@/actions/server/devicePrefetch'
import { getServerLocale } from '@/lib/server-locale'

import { DeviceConfigurator } from './_components/DeviceConfigurator'

type DevicePageProps = {
  params: {
    id: string
  }
}

export const generateMetadata = async ({ params }: DevicePageProps) => {
  const locale = await getServerLocale()
  const device = await deviceByIdPrefetch(params.id).catch(() => null)

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
  const device = await deviceByIdPrefetch(params.id).catch(() => null)

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
