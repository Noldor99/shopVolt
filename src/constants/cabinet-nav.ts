import { Heart, ListOrdered, User } from 'lucide-react'

export const cabinetNav = [
  { href: '/cabinet/profile', label: 'Профіль', icon: User },
  { href: '/cabinet/favorites', label: 'Обране', icon: Heart },
  { href: '/cabinet/my-orders', label: 'Мої замовлення', icon: ListOrdered },
]
