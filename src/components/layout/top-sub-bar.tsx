import React, { Suspense } from 'react'

import { UserCabinetDrawer } from '@/app/[locale]/cabinet/_components/user-cabinet-drawer'

import type { Locale } from '@/lib/i18n'

import { AuthDialog } from '../auth/auth-dialog'
import { LanguageSwitcher } from '../shared/LanguageSwitcher'
import { Container } from '../ui/container'

type TopSubBarProps = {
  locale?: Locale
}

export const TopSubBar = ({ locale = 'ua' }: TopSubBarProps) => {
  void locale
  return (
    <Container>
      <div className="flex items-center justify-between py-2">
        <div className="flex gap-3 md:hidden">
          <AuthDialog />
          <UserCabinetDrawer />
        </div>

        <div className="hidden md:block" />

        <div className="ml-auto">
          <Suspense fallback={<div className="h-7 w-[86px]" />}>
            <LanguageSwitcher />
          </Suspense>
        </div>
      </div>
    </Container>
  )
}
