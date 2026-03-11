export const LOCALES = ['ua', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ua'

export const isLocale = (value: string | null | undefined): value is Locale => {
  if (!value) return false
  return LOCALES.includes(value as Locale)
}

export const getLocaleFromPathname = (pathname: string | null | undefined): Locale => {
  if (!pathname) return DEFAULT_LOCALE
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : DEFAULT_LOCALE
}

export const stripLocaleFromPathname = (pathname: string | null | undefined): string => {
  if (!pathname) return '/'
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const segments = normalized.split('/').filter(Boolean)

  if (!segments.length) return '/'
  if (!isLocale(segments[0])) return normalized

  const rest = segments.slice(1).join('/')
  return rest ? `/${rest}` : '/'
}

export const withLocalePath = (pathname: string, locale: Locale): string => {
  if (!pathname) return `/${locale}`
  if (!pathname.startsWith('/')) return pathname

  const basePath = stripLocaleFromPathname(pathname)
  return basePath === '/' ? `/${locale}` : `/${locale}${basePath}`
}

type Messages = {
  nav: {
    home: string
    about: string
    news: string
    cabinet: string
    admin: string
    navigation: string
    account: string
  }
  common: {
    allParameters: string
    foundProducts: string
    from: string
    to: string
    prev: string
    next: string
  }
  filter: {
    priceRange: string
    searchPlaceholder: string
    showAll: string
    hide: string
  }
  notFound: {
    title: string
    description: string
    toHome: string
  }
  home: {
    openCategory: string
  }
  cabinet: {
    favorites: string
    myOrders: string
    profile: string
    savedItems: string
    orderHistory: string
    profileDetails: string
  }
  footer: {
    contact: string
    privacy: string
    investorInquiries: string
  }
}

const messages: Record<Locale, Messages> = {
  ua: {
    nav: {
      home: 'Головна',
      about: 'Про нас',
      news: 'Новини',
      cabinet: 'Кабінет',
      admin: 'Адмін панель',
      navigation: 'Навігація',
      account: 'Мій акаунт',
    },
    common: {
      allParameters: 'Всі параметри',
      foundProducts: 'Знайдено товарів',
      from: 'Від',
      to: 'До',
      prev: 'Назад',
      next: 'Далі',
    },
    filter: {
      priceRange: 'Ціна від і до',
      searchPlaceholder: 'Пошук...',
      showAll: 'Показати все',
      hide: 'Сховати',
    },
    notFound: {
      title: 'Сторінку не знайдено',
      description:
        'Сторінка, яку ви шукаєте, не існує або була переміщена. Перевірте адресу або поверніться на головну.',
      toHome: 'На головну',
    },
    home: {
      openCategory: 'Перейти до категорії',
    },
    cabinet: {
      favorites: 'Обране',
      myOrders: 'Мої замовлення',
      profile: 'Профіль',
      savedItems: 'Тут будуть збережені товари.',
      orderHistory: 'Тут буде історія ваших замовлень.',
      profileDetails: 'На цій сторінці ви можете керувати даними профілю.',
    },
    footer: {
      contact: 'Контакти',
      privacy: 'Конфіденційність для нас понад усе',
      investorInquiries: 'Запити інвесторів',
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      news: 'News',
      cabinet: 'Cabinet',
      admin: 'Admin panel',
      navigation: 'Navigation',
      account: 'My account',
    },
    common: {
      allParameters: 'All parameters',
      foundProducts: 'Products found',
      from: 'From',
      to: 'To',
      prev: 'Previous',
      next: 'Next',
    },
    filter: {
      priceRange: 'Price range',
      searchPlaceholder: 'Search...',
      showAll: 'Show all',
      hide: 'Hide',
    },
    notFound: {
      title: 'Page not found',
      description:
        'The page you are looking for does not exist or has been moved. Check the URL or go back to home.',
      toHome: 'Back to home',
    },
    home: {
      openCategory: 'Open category',
    },
    cabinet: {
      favorites: 'Favorites',
      myOrders: 'My orders',
      profile: 'Profile',
      savedItems: 'Your saved items will be shown here.',
      orderHistory: 'Your order history will be shown here.',
      profileDetails: 'Manage your profile details on this page.',
    },
    footer: {
      contact: 'Contact',
      privacy: 'Privacy is our paramount',
      investorInquiries: 'Investor inquiries',
    },
  },
}

export const getMessages = (locale: Locale): Messages => messages[locale]
