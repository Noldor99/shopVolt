import { prisma } from '@/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { toE164PhoneOrNull } from '@/lib/phone';

const ORDER_STATUSES = ['PENDING', 'SUCCEEDED', 'CANCELLED'] as const;

type Params = {
  params: {
    id: string;
  };
};

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to receive order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();

    const data: {
      userId?: number | null;
      items?: unknown;
      status?: (typeof ORDER_STATUSES)[number];
      totalAmount?: number;
      paymentId?: string | null;
      fullName?: string;
      address?: string;
      email?: string;
      phone?: string;
      comment?: string | null;
    } = {};

    if (body.userId !== undefined) {
      if (body.userId === null) {
        data.userId = null;
      } else {
        const userId = Number(body.userId);
        if (!Number.isFinite(userId)) {
          return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
        }
        data.userId = userId;
      }
    }

    if (body.items !== undefined) {
      data.items = body.items;
    }

    if (body.status !== undefined) {
      if (typeof body.status !== 'string') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const status = body.status.trim().toUpperCase();
      if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      data.status = status as (typeof ORDER_STATUSES)[number];
    }

    if (body.totalAmount !== undefined) {
      const totalAmount = Number(body.totalAmount);
      if (!Number.isFinite(totalAmount)) {
        return NextResponse.json({ error: 'Invalid totalAmount' }, { status: 400 });
      }
      data.totalAmount = totalAmount;
    }

    if (body.paymentId !== undefined) {
      if (body.paymentId === null) {
        data.paymentId = null;
      } else if (typeof body.paymentId === 'string') {
        data.paymentId = body.paymentId.trim() || null;
      } else {
        return NextResponse.json({ error: 'Invalid paymentId' }, { status: 400 });
      }
    }

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== 'string') {
        return NextResponse.json({ error: 'Invalid fullName' }, { status: 400 });
      }
      data.fullName = body.fullName.trim();
    }

    if (body.address !== undefined) {
      if (typeof body.address !== 'string') {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
      }
      data.address = body.address.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string') {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      data.email = body.email.trim();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string') {
        return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
      }
      const normalizedPhone = toE164PhoneOrNull(body.phone);
      if (!normalizedPhone) {
        return NextResponse.json({ error: 'Phone must be in international format' }, { status: 400 });
      }
      data.phone = normalizedPhone;
    }

    if (body.comment !== undefined) {
      if (body.comment === null) {
        data.comment = null;
      } else if (typeof body.comment === 'string') {
        data.comment = body.comment.trim() || null;
      } else {
        return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Order update failed' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Order removed successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error while deleting order' }, { status: 400 });
  }
}
