import type { Locale } from '@/lib/i18n'

import { OrderForm } from './_components/OrderForm'

type OrderPageProps = {
  params: { locale: string }
}

export const generateMetadata = async ({ params }: OrderPageProps) => {
  const locale = params.locale as Locale
  return {
    title: locale === 'en' ? 'Checkout' : 'Оформлення замовлення',
    description:
      locale === 'en'
        ? 'Enter your details and complete the purchase'
        : 'Введіть дані та завершіть покупку',
  }
}

const OrderPage = async ({ params }: OrderPageProps) => {
  const locale = params.locale as Locale
  const isEn = locale === 'en'
  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase">
            {isEn ? 'Checkout' : 'Оформлення замовлення'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isEn
              ? 'Fill in contact details, review your order and confirm payment.'
              : 'Заповніть контактні дані, перевірте склад замовлення і підтвердіть покупку.'}
          </p>
        </div>
        <OrderForm locale={locale} />
      </div>
    </section>
  )
}

export default OrderPage
