import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/prisma/prisma-client'
import {
  LIQPAY_CHECKOUT_URL,
  createLiqPayData,
  createLiqPaySignature,
  getAppBaseUrl,
  getLiqPayConfig,
} from '@/lib/privatbank-liqpay'
import { toE164PhoneOrNull } from '@/lib/phone'

const sanitizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getServerSession(authOptions)
    const sessionUserId =
      session?.user && 'id' in session.user ? (session.user as { id?: number | string }).id : undefined

    const userId = Number.isFinite(Number(sessionUserId)) ? Number(sessionUserId) : undefined
    const totalAmount = Number(body.totalAmount)
    const fullName = sanitizeString(body.fullName)
    const address = sanitizeString(body.address)
    const email = sanitizeString(body.email)
    const phone = toE164PhoneOrNull(sanitizeString(body.phone)) || ''
    const comment = sanitizeString(body.comment) || undefined

    if (!Number.isFinite(totalAmount) || totalAmount <= 0 || !fullName || !address || !email || !phone) {
      return NextResponse.json(
        { error: 'Required fields: fullName, address, email, phone(international), totalAmount' },
        { status: 400 },
      )
    }

    const { publicKey, privateKey } = getLiqPayConfig()

    const order = await prisma.order.create({
      data: {
        userId,
        items: body.items,
        totalAmount,
        fullName,
        address,
        email,
        phone,
        comment,
      },
    })

    const merchantOrderId = `order_${order.id}_${Date.now()}`

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: merchantOrderId },
    })

    const appUrl = getAppBaseUrl()
    const requestOrigin = req.nextUrl.origin
    const resultUrl =
      process.env.LIQPAY_RESULT_URL?.trim() ||
      `${requestOrigin}/cabinet/my-orders?orderId=${order.id}`
    const serverUrl =
      process.env.LIQPAY_SERVER_URL?.trim() || `${appUrl}/api/payments/privatbank/callback`

    const liqPayPayload = {
      version: '3',
      public_key: publicKey,
      action: 'pay',
      amount: totalAmount.toFixed(2),
      currency: 'UAH',
      description: `Оплата замовлення #${order.id}`,
      order_id: merchantOrderId,
      result_url: resultUrl,
      server_url: serverUrl,
      language: 'uk',
      sandbox: process.env.LIQPAY_SANDBOX === 'true' ? '1' : '0',
    }

    const data = createLiqPayData(liqPayPayload)
    const signature = createLiqPaySignature(data, privateKey)

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: LIQPAY_CHECKOUT_URL,
      data,
      signature,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error while creating PrivatBank payment' }, { status: 400 })
  }
}
