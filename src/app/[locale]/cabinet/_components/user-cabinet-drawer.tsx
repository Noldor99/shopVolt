'use client'

import { cabinetNav } from '@/constants/cabinet-nav'
import { UserRound } from 'lucide-react'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Title } from '@/components/ui/title'

import { cn } from '@/lib/utils'

export const UserCabinetDrawer = () => {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="black_out" size="icon" aria-label="Відкрити кабінет">
          <UserRound className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <Title text="Кабінет користувача" size="2xl" />
          <p className="text-sm text-slate-500">{session.user.email}</p>
        </SheetHeader>

        <nav className="mt-6 space-y-2">
          {cabinetNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <SheetClose key={item.href} asChild>
                <Link
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
              </SheetClose>
            )
          })}
        </nav>

        <div className="mt-6">
          <Button
            variant="destructive_out"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Вийти
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
