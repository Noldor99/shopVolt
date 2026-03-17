import { QueryDeviceFilterParams } from '@/actions/client/deviceAction'

import { getLocaleFromPathname, stripLocaleFromPathname } from '@/lib/i18n'

export const getActiveCategorySlug = (pathname: string) => {
  const cleanPathname = stripLocaleFromPathname(pathname)
  return cleanPathname.split('/category/')[1]?.split('/')[0] ?? ''
}

export const getDeviceFilterParams = (pathname: string): QueryDeviceFilterParams | null => {
  const categorySlug = getActiveCategorySlug(pathname)

  if (!categorySlug) {
    return null
  }

  return {
    categorySlug,
    lang: getLocaleFromPathname(pathname),
  }
}

export const getDeviceFilterQueryKey = (params: QueryDeviceFilterParams | null) =>
  ['device-filter', params ?? {}] as const
