import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/prisma/prisma-client'
import {
  createLiqPaySignature,
  getLiqPayConfig,
  parseLiqPayData,
} from '@/lib/privatbank-liqpay'

type LiqPayCallbackPayload = {
  order_id?: string
  status?: string
  transaction_id?: number | string
}

const getOrderStatus = (status?: string): 'PENDING' | 'SUCCEEDED' | 'CANCELLED' => {
  switch (status) {
    case 'success':
    case 'sandbox':
      return 'SUCCEEDED'
    case 'failure':
    case 'error':
    case 'reversed':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

const getLocalOrderId = (merchantOrderId?: string) => {
  if (!merchantOrderId) return null

  const match = merchantOrderId.match(/^order_(\d+)_\d+$/)
  if (match) return Number(match[1])

  const fallbackId = Number(merchantOrderId)
  return Number.isInteger(fallbackId) && fallbackId > 0 ? fallbackId : null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const data = String(formData.get('data') ?? '')
    const signature = String(formData.get('signature') ?? '')

    if (!data || !signature) {
      return NextResponse.json({ error: 'Missing data or signature' }, { status: 400 })
    }

    const { privateKey } = getLiqPayConfig()
    const expectedSignature = createLiqPaySignature(data, privateKey)
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = parseLiqPayData<LiqPayCallbackPayload>(data)
    const orderId = getLocalOrderId(payload.order_id)

    if (!orderId) {
      return NextResponse.json({ error: 'Order not found for callback' }, { status: 404 })
    }

    const paymentStatus = getOrderStatus(payload.status)
    const transactionId = payload.transaction_id ? String(payload.transaction_id) : payload.order_id

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: paymentStatus,
        paymentId: transactionId || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'PrivatBank callback error' }, { status: 400 })
  }
}
