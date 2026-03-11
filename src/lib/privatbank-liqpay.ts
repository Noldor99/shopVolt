import crypto from 'crypto'

export const LIQPAY_CHECKOUT_URL = 'https://www.liqpay.ua/api/3/checkout'

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/$/, '') || ''

export const getAppBaseUrl = () => {
  const explicitAppUrl = normalizeBaseUrl(process.env.APP_URL)
  if (explicitAppUrl) return explicitAppUrl

  const nextAuthUrl = normalizeBaseUrl(process.env.NEXTAUTH_URL)
  if (nextAuthUrl) return nextAuthUrl

  const publicApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
  if (publicApiUrl) return publicApiUrl.replace(/\/api$/, '')

  return 'http://localhost:3000'
}

export const getLiqPayConfig = () => {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim()
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim()

  if (!publicKey || !privateKey) {
    throw new Error('LIQPAY_PUBLIC_KEY and LIQPAY_PRIVATE_KEY are required')
  }

  return { publicKey, privateKey }
}

export const createLiqPayData = (payload: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(payload)).toString('base64')

export const createLiqPaySignature = (data: string, privateKey: string) =>
  crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64')

export const parseLiqPayData = <T = Record<string, unknown>>(data: string) =>
  JSON.parse(Buffer.from(data, 'base64').toString('utf-8')) as T

export type LiqPayPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'CANCELLED'

type LiqPayStatusResponse = {
  status?: string
  transaction_id?: number | string
}

export const mapLiqPayStatusToOrderStatus = (status?: string): LiqPayPaymentStatus => {
  switch (status) {
    case 'success':
    case 'sandbox':
      return 'SUCCEEDED'
    case 'failure':
    case 'error':
    case 'reversed':
    case 'unsubscribed':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

export const fetchLiqPayOrderStatus = async (merchantOrderId: string) => {
  const { publicKey, privateKey } = getLiqPayConfig()
  const payload = {
    version: '3',
    action: 'status',
    public_key: publicKey,
    order_id: merchantOrderId,
  }

  const data = createLiqPayData(payload)
  const signature = createLiqPaySignature(data, privateKey)

  const body = new URLSearchParams({ data, signature }).toString()
  const response = await fetch('https://www.liqpay.ua/api/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('LiqPay status request failed')
  }

  const parsed = (await response.json()) as LiqPayStatusResponse
  return {
    status: mapLiqPayStatusToOrderStatus(parsed.status),
    transactionId: parsed.transaction_id ? String(parsed.transaction_id) : undefined,
  }
}
