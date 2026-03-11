import { OrderForm } from './_components/OrderForm'
import { getServerLocale } from '@/lib/server-locale'

export const generateMetadata = async () => {
  const locale = await getServerLocale()
  return {
    title: locale === 'en' ? 'Checkout' : 'Оформлення замовлення',
    description:
      locale === 'en'
        ? 'Enter your details and complete the purchase'
        : 'Введіть дані та завершіть покупку',
  }
}

const OrderPage = async () => {
  const locale = await getServerLocale()
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
