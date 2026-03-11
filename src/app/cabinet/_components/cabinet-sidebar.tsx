'use client'

import { cabinetNav } from '@/constants/cabinet-nav'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

export const CabinetSidebar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="px-2 text-sm text-slate-500">
          {session?.user?.email || 'Кабінет користувача'}
        </p>

        <nav className="mt-4 space-y-2">
          {cabinetNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4">
          <Button
            variant="destructive_out"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Вийти
          </Button>
        </div>
      </div>
    </aside>
  )
}
