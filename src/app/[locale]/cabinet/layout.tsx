import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { type ReactNode } from 'react'

import { CabinetSidebar } from '@/components/layout/CabinetSidebar'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

import { authOptions } from '@/lib/auth'

type CabinetLayoutProps = {
  children: ReactNode
}

const CabinetLayout = async ({ children }: CabinetLayoutProps) => {
  const session = await getServerSession(authOptions)
  const sessionUserId =
    session?.user && 'id' in session.user ? (session.user as { id?: number | string }).id : undefined
  const userId = Number(sessionUserId)

  if (!Number.isFinite(userId) || userId <= 0) {
    redirect('/api/auth/signin')
  }

  return (
    <>
      <Header />
      <section className="container flex w-full flex-1 items-stretch gap-6 py-6">
        <CabinetSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </section>
      <Footer />
    </>
  )
}

export default CabinetLayout
