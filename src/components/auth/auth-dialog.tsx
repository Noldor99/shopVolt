'use client'

import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { LoginForm } from './forms/LoginForm'
import { RegisterForm } from './forms/RegisterForm'
import { ResetPasswordFlow } from './forms/ResetPasswordFlow'
import { SocialAuth } from './forms/SocialAuth'

export function AuthDialog() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'login' | 'register' | 'reset'>('login')
  const [resetEmail, setResetEmail] = useState('')

  if (session?.user) return null

  const handleAuthSuccess = () => {
    setOpen(false)
    setTab('login')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="black_out">Увійти</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {tab === 'login' ? 'Вхід' : tab === 'register' ? 'Реєстрація' : 'Відновлення пароля'}
          </DialogTitle>
          <DialogDescription>
            {tab === 'login'
              ? 'Увійдіть в систему'
              : tab === 'register'
                ? 'Створіть акаунт'
                : 'Встановіть новий пароль'}
          </DialogDescription>
        </DialogHeader>

        {tab !== 'reset' && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button
              variant={tab === 'login' ? 'black' : 'black_out'}
              onClick={() => setTab('login')}
            >
              Логін
            </Button>
            <Button
              variant={tab === 'register' ? 'black' : 'black_out'}
              onClick={() => setTab('register')}
            >
              Реєстрація
            </Button>
          </div>
        )}

        {tab === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onForgotPassword={(email) => {
              setResetEmail(email)
              setTab('reset')
            }}
          />
        )}

        {tab === 'register' && <RegisterForm onSuccess={handleAuthSuccess} />}

        {tab === 'reset' && (
          <ResetPasswordFlow
            initialEmail={resetEmail}
            onBackToLogin={() => setTab('login')}
            onSuccess={() => setTab('login')}
          />
        )}

        <SocialAuth disabled={tab === 'reset'} />
      </DialogContent>
    </Dialog>
  )
}
