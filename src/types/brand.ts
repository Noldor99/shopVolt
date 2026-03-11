export interface IBrand {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  _count?: {
    devices: number
  }
}
