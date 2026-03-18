import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { ProfileForm } from './_components/ProfileForm'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/prisma/prisma-client'

export const generateMetadata = async () => {
  return {
    title: 'Профіль',
    description: 'V3V - Профіль користувача',
  }
}

const ProfilePage = async () => {
  const session = await getServerSession(authOptions)
  const sessionUserId =
    session?.user && 'id' in session.user ? (session.user as { id?: number | string }).id : undefined
  const userId = Number(sessionUserId)

  if (!Number.isFinite(userId) || userId <= 0) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phone: true,
    },
  })

  if (!user) {
    redirect('/api/auth/signin')
  }

  return (
    <>
      <h1 className="text-3xl font-black uppercase">Профіль</h1>
      <p className="mt-2 text-sm text-slate-600">Оновіть ваші персональні дані акаунта.</p>
      <ProfileForm
        initialValues={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '',
        }}
      />
    </>
  )
}

export default ProfilePage
