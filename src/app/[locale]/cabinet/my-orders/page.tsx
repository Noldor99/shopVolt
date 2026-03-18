import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { Badge } from '@/components/ui/badge'
import { authOptions } from '@/lib/auth'
import { fetchLiqPayOrderStatus } from '@/lib/privatbank-liqpay'
import { prisma } from '@/prisma/prisma-client'

export const generateMetadata = async () => {
  return {
    title: 'Мої замовлення',
    description: 'V3V - Історія замовлень',
  }
}

type OrderItem = {
  id?: number
  quantity?: number
  product?: {
    name?: string | null
    imageUrl?: string | null
  }
  lineTotal?: number
  ingredients?: Array<{
    name?: string
  }>
}

const statusMap: Record<
  'PENDING' | 'SUCCEEDED' | 'CANCELLED',
  { label: string; variant: 'secondary' | 'default' | 'destructive' }
> = {
  PENDING: { label: 'Очікує оплату', variant: 'secondary' },
  SUCCEEDED: { label: 'Сплачено', variant: 'default' },
  CANCELLED: { label: 'Скасовано', variant: 'destructive' },
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

const toOrderItems = (items: unknown): OrderItem[] => (Array.isArray(items) ? (items as OrderItem[]) : [])

const MyOrdersPage = async ({
  searchParams,
}: {
  searchParams?: { orderId?: string }
}) => {
  const session = await getServerSession(authOptions)
  const userId =
    session?.user && 'id' in session.user ? (session.user as { id?: number | null }).id ?? null : null
  const userEmail = session?.user?.email

  if (!userId) {
    redirect('/api/auth/signin')
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId },
        ...(userEmail ? [{ userId: null, email: userEmail }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const paymentOrderId = Number(searchParams?.orderId)
  let highlightedOrder = Number.isInteger(paymentOrderId)
    ? orders.find((order: (typeof orders)[number]) => order.id === paymentOrderId)
    : undefined

  // Fallback status sync when webhook callback didn't reach our server.
  if (
    highlightedOrder?.status === 'PENDING' &&
    highlightedOrder.paymentId &&
    highlightedOrder.paymentId.startsWith('order_')
  ) {
    try {
      const paymentStatus = await fetchLiqPayOrderStatus(highlightedOrder.paymentId)

      if (paymentStatus.status !== 'PENDING') {
        const updated = await prisma.order.update({
          where: { id: highlightedOrder.id },
          data: {
            status: paymentStatus.status,
            paymentId: paymentStatus.transactionId || highlightedOrder.paymentId,
          },
        })

        highlightedOrder = updated
      }
    } catch (error) {
      console.error('Unable to sync payment status from LiqPay', error)
    }
  }

  return (
    <>
      <h1 className="text-3xl font-black uppercase">Мої замовлення</h1>
      <p className="mt-2 text-sm text-slate-600">Історія ваших оформлених замовлень та статус оплати.</p>

      {highlightedOrder?.status === 'SUCCEEDED' && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Оплату прийнято. Замовлення #{highlightedOrder.id} успішно обробляється.
        </div>
      )}

      {highlightedOrder?.status === 'CANCELLED' && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Оплата не пройшла або була скасована. Спробуйте повторити оплату пізніше.
        </div>
      )}

      {highlightedOrder?.status === 'PENDING' && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Оплата ще підтверджується банком. Оновіть сторінку за декілька секунд.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">У вас ще немає оформлених замовлень.</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-80"
          >
            Перейти до каталогу
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order: (typeof orders)[number]) => {
            const items = toOrderItems(order.items)
            const orderStatus = statusMap[order.status as keyof typeof statusMap]

            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Замовлення #{order.id}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant={orderStatus.variant}>{orderStatus.label}</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500">Склад замовлення недоступний.</p>
                  ) : (
                    items.map((item, index) => (
                      <div
                        key={`${order.id}-item-${item.id ?? index}`}
                        className="flex gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <img
                          src={item.product?.imageUrl || '/logo.svg'}
                          alt={item.product?.name || 'Товар'}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.product?.name || `Товар #${item.id ?? index + 1}`}
                          </p>
                          <p className="text-xs text-slate-500">Кількість: {item.quantity || 1}</p>
                          {!!item.ingredients?.length && (
                            <p className="line-clamp-2 text-xs text-slate-500">
                              {item.ingredients
                                .map((ingredient) => ingredient.name)
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {(item.lineTotal || 0).toLocaleString('uk-UA')} ₴
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500">
                    Оплата: {order.paymentId ? `ID ${order.paymentId}` : 'ще не підтверджено'}
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {order.totalAmount.toLocaleString('uk-UA')} ₴
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

export default MyOrdersPage
