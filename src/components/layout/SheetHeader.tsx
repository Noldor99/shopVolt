'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useState } from 'react'

import { IconMenuDeep } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { cn } from '@/lib/utils'

type SheetHeaderPropsType = {
  nav: { name: string; url: string }[]
}

export const SheetHeader = ({ nav }: SheetHeaderPropsType) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const handleToggle = () => setIsOpen((prev) => !prev)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="size-10 rounded-xl border-black/30 bg-white p-0 shadow-sm xl:hidden"
          variant="black_out"
        >
          <IconMenuDeep size={'22px'} />
        </Button>
      </SheetTrigger>
      <SheetContent className="!w-full !max-w-full bg-white px-6 pb-8 pt-14 sm:!max-w-sm">
        <div className="mb-6 border-b border-black/10 pb-4 text-right xl:hidden">
          <p className="t-sm1 text-black/50">Navigation</p>
          <p className="mt-1 text-xl font-black uppercase leading-none">Next</p>
        </div>

        <nav className="flex flex-col gap-3 text-right xl:hidden">
          {nav.map(({ name, url }, idx) => (
            <Link
              href={url}
              key={idx}
              onClick={handleToggle}
              className={cn(
                'block rounded-xl border border-black/10 px-4 py-3 text-base font-semibold tracking-wide transition hover:border-black/30 hover:bg-black/5',
                pathname === url &&
                  'rounded-xl border border-black bg-black px-4 py-3 text-base font-semibold tracking-wide text-white'
              )}
            >
              {name}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
