import { UserRole } from '@prisma/client'

export const ADMIN_ACCESS_ROLES = [UserRole.MODER, UserRole.ADMIN] as const;

export type AdminRole = (typeof ADMIN_ACCESS_ROLES)[number];


export const hasAdminAccess = (role?: UserRole): role is AdminRole => {
  return !!role && (ADMIN_ACCESS_ROLES as readonly UserRole[]).includes(role);
};