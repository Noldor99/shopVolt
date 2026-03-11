export const ROLES = {
  USER: 'USER',
  MODER: 'MODER',
  ADMIN: 'ADMIN',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const ADMIN_ACCESS_ROLES: UserRole[] = [ROLES.MODER, ROLES.ADMIN]