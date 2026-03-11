import { prisma } from '@/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { toE164PhoneOrNull } from '@/lib/phone';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const ORDER_STATUSES = ['PENDING', 'SUCCEEDED', 'CANCELLED'] as const;

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page = Math.max(DEFAULT_PAGE, parseNumber(searchParams.get('page')) ?? DEFAULT_PAGE);
    const rawLimit = parseNumber(searchParams.get('limit')) ?? DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      prisma.order.count(),
    ]);

    return NextResponse.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error while receiving orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userId =
      body.userId === null || body.userId === undefined ? undefined : Number(body.userId);
    const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : undefined;
    const totalAmount = Number(body.totalAmount);
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? (toE164PhoneOrNull(body.phone) ?? '') : '';
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : undefined;
    const comment = typeof body.comment === 'string' ? body.comment.trim() : undefined;

    if (userId !== undefined && !Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    if (!Number.isFinite(totalAmount) || !fullName || !address || !email || !phone) {
      return NextResponse.json(
        { error: 'Required fields: fullName, address, email, phone(international), totalAmount' },
        { status: 400 },
      );
    }

    if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const data: {
      userId?: number;
      items?: unknown;
      status?: (typeof ORDER_STATUSES)[number];
      totalAmount: number;
      paymentId?: string;
      fullName: string;
      address: string;
      email: string;
      phone: string;
      comment?: string;
    } = {
      totalAmount,
      fullName,
      address,
      email,
      phone,
    };

    if (userId !== undefined) data.userId = userId;
    if (body.items !== undefined) data.items = body.items;
    if (status) data.status = status as (typeof ORDER_STATUSES)[number];
    if (paymentId) data.paymentId = paymentId;
    if (comment) data.comment = comment;

    const order = await prisma.order.create({
      data,
      include: {
        user: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error while creating order' }, { status: 400 });
  }
}
