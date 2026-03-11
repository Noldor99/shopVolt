export interface IAuthUser {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: 'USER' | 'MODER' | 'ADMIN'
  provider: string | null
  providerId: string | null
  verified: string | null
  createdAt: string
  updatedAt: string
}
