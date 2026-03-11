import { Resend } from 'resend'

type RegistrationEmailInput = {
  to: string
  fullName?: string | null
  provider: 'credentials' | 'github' | 'google'
}

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  return new Resend(apiKey)
}

const getFromEmail = () => process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

const providerLabel: Record<RegistrationEmailInput['provider'], string> = {
  credentials: 'email/password',
  github: 'GitHub',
  google: 'Google',
}

export const sendRegistrationSuccessEmail = async ({
  to,
  fullName,
  provider,
}: RegistrationEmailInput) => {
  const client = getResendClient()
  if (!client) return

  const safeName = fullName?.trim() || 'User'
  const loginProvider = providerLabel[provider]

  await client.emails.send({
    from: getFromEmail(),
    to,
    subject: 'Registration successful',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Welcome, ${safeName}!</h2>
        <p style="margin: 0 0 10px;">
          Your account has been created successfully.
        </p>
        <p style="margin: 0 0 10px;">
          Login method: <strong>${loginProvider}</strong>
        </p>
        <p style="margin: 16px 0 0;">
          If this was not you, please contact support.
        </p>
      </div>
    `,
  })
}
