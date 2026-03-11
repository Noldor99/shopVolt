import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { PHONE_VALIDATION_MESSAGE, toE164PhoneOrNull } from '@/lib/phone'
import { prisma } from '@/prisma/prisma-client'

const ProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Імʼя закоротке').max(80, 'Імʼя задовге'),
  email: z.string().trim().email('Некоректний email'),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || Boolean(toE164PhoneOrNull(value)), PHONE_VALIDATION_MESSAGE)
    .transform((value) => (value ? toE164PhoneOrNull(value) || undefined : undefined)),
})

const getSessionUserId = async () => {
  const session = await getServerSession(authOptions)
  const sessionUserId =
    session?.user && 'id' in session.user ? (session.user as { id?: number | string }).id : undefined
  const userId = Number(sessionUserId)

  if (!Number.isFinite(userId) || userId <= 0) {
    return null
  }

  return userId
}

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        provider: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    const parsed = ProfileSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.flatten().fieldErrors,
          message: 'Invalid profile payload',
        },
        { status: 400 }
      )
    }

    const { fullName, email, phone } = parsed.data

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existingByEmail && existingByEmail.id !== userId) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phone,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        provider: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
