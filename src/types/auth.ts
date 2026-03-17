import type { Prisma } from "@prisma/client"

type AuthUserPayload = Prisma.UserGetPayload<Record<string, never>>

export type IAuthUser = Omit<AuthUserPayload, "verified" | "createdAt" | "updatedAt"> & {
  verified: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}
