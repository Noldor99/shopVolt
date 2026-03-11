import { UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'

import { sendRegistrationSuccessEmail } from '@/lib/email'
import { prisma } from '@/prisma/prisma-client'

const getFallbackName = (email?: string | null) => {
  if (!email) return 'User'
  return email.split('@')[0] || 'User'
}

type GitHubEmail = {
  email: string
  primary: boolean
  verified: boolean
}

const getGitHubEmail = async (accessToken?: string | null) => {
  if (!accessToken) return null

  try {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const emails = (await response.json()) as GitHubEmail[]
    const selectedEmail =
      emails.find((item) => item.primary && item.verified) ??
      emails.find((item) => item.verified) ??
      emails[0]

    return selectedEmail?.email ?? null
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret',
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.fullName,
          role: user.role,
        }
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: {
              params: {
                scope: 'read:user user:email',
              },
            },
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') {
        return true
      }

      const githubEmail =
        account.provider === 'github' ? await getGitHubEmail(account.access_token) : null
      const normalizedEmail =
        user.email ??
        githubEmail ??
        (account.provider === 'github'
          ? `${account.providerAccountId}@users.noreply.github.local`
          : null)

      if (!normalizedEmail) {
        return '/api/auth/error?error=OAuthEmailMissing'
      }

      const existingUserByProvider = await prisma.user.findFirst({
        where: {
          provider: account.provider,
          providerId: account.providerAccountId,
        },
      })

      const existingUser =
        existingUserByProvider ??
        (await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        }))

      if (!existingUser) {
        const randomHash = await bcrypt.hash(crypto.randomUUID(), 10)

        const createdUser = await prisma.user.create({
          data: {
            email: normalizedEmail,
            fullName: user.name || getFallbackName(normalizedEmail),
            password: randomHash,
            provider: account.provider,
            providerId: account.providerAccountId,
            role: UserRole.USER,
            verified: new Date(),
          },
        })

        const oauthProvider = account.provider === 'github' || account.provider === 'google'
          ? account.provider
          : null
        if (oauthProvider) {
          try {
            await sendRegistrationSuccessEmail({
              to: createdUser.email,
              fullName: createdUser.fullName,
              provider: oauthProvider,
            })
          } catch (error) {
            console.error('OAuth registration email send error:', error)
          }
        }
      } else {
        const shouldSyncProvider =
          existingUser.provider !== account.provider ||
          existingUser.providerId !== account.providerAccountId
        const shouldUpdateEmailFromGithub =
          account.provider === 'github' &&
          existingUser.email.endsWith('@users.noreply.github.local') &&
          !normalizedEmail.endsWith('@users.noreply.github.local')

        if (!shouldSyncProvider && !shouldUpdateEmailFromGithub) {
          return true
        }

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: shouldUpdateEmailFromGithub ? normalizedEmail : existingUser.email || normalizedEmail,
            provider: account.provider,
            providerId: account.providerAccountId,
            verified: existingUser.verified ?? new Date(),
          },
        })
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = Number(user.id)
        if ("role" in user && user.role) {
          token.role = user.role as UserRole
        }
      }

      if (account && account.provider !== 'credentials') {
        const oauthUser = await prisma.user.findFirst({
          where: {
            provider: account.provider,
            providerId: account.providerAccountId,
          },
        })

        if (oauthUser) {
          token.id = oauthUser.id
          token.role = oauthUser.role
          token.email = oauthUser.email
        }
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: token.email,
          },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.email = dbUser.email
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const user = session.user as typeof session.user & { id: number; role: UserRole }
        user.id = Number(token.id)
        user.role = (token.role as UserRole) ?? UserRole.USER
        if (token.email) {
          user.email = token.email
        }
      }

      return session
    },
  },
}
