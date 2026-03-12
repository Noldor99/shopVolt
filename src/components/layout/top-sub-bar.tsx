import React from 'react'

import { UserCabinetDrawer } from '@/app/cabinet/_components/user-cabinet-drawer'

import { getMessages } from '@/lib/i18n'
import { getServerLocale } from '@/lib/server-locale'

import { AuthDialog } from '../auth/auth-dialog'
import { LanguageSwitcher } from '../shared/LanguageSwitcher'
import { Container } from '../ui/container'

export const TopSubBar = async () => {
  const locale = await getServerLocale()
  const t = getMessages(locale)

  return (
    <Container>
      <div className="flex items-center justify-between py-2">
        <div className="flex gap-3 md:hidden">
          <AuthDialog />
          <UserCabinetDrawer />
        </div>

        <div className="hidden md:block" />

        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
    </Container>
  )
}
