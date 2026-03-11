import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { sendRegistrationSuccessEmail } from '@/lib/email'
import { prisma } from '@/prisma/prisma-client'

const RegisterSchema = z
  .object({
    fullName: z.string().min(2).max(80).optional(),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Invalid registration payload',
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { email, password, fullName } = parsed.data

    const exists = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (exists) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const fallbackName = email.split('@')[0] || 'User'

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        fullName: fullName || fallbackName,
        provider: 'credentials',
        verified: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        provider: true,
        createdAt: true,
      },
    })

    try {
      await sendRegistrationSuccessEmail({
        to: user.email,
        fullName: user.fullName,
        provider: 'credentials',
      })
    } catch (error) {
      console.error('Registration email send error:', error)
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 })
  }
}
