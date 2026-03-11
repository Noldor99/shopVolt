'use client'

import { signIn } from 'next-auth/react'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

export const SocialAuth = ({ disabled }: { disabled?: boolean }) => {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div className="mt-4 space-y-2">
      <Button
        variant="black_out"
        className="w-full"
        disabled={disabled}
        loading={loading === 'github'}
        onClick={() => handleOAuth('github')}
      >
        GitHub
      </Button>
      <Button
        variant="black_out"
        className="w-full"
        disabled={disabled}
        loading={loading === 'google'}
        onClick={() => handleOAuth('google')}
      >
        Google
      </Button>
    </div>
  )
}
