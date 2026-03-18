import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n"

const PUBLIC_FILE = /\.[^/]+$/

const shouldIgnorePath = (pathname: string) => {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)
}

const stripLocalePrefix = (pathname: string, locale: string) => {
  const rest = pathname.split("/").filter(Boolean).slice(1).join("/")
  return rest ? `/${rest}` : "/"
}

const prefixPathname = (pathname: string, locale: string) => {
  if (locale === DEFAULT_LOCALE) return pathname
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (shouldIgnorePath(pathname)) {
    return NextResponse.next()
  }

  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  const pathnameLocale = isLocale(firstSegment) ? firstSegment : null

  const queryLang = req.nextUrl.searchParams.get("lang")
  const queryLocale = isLocale(queryLang) ? queryLang : null

  if (queryLocale) {
    const basePath = pathnameLocale ? stripLocalePrefix(pathname, pathnameLocale) : pathname
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = prefixPathname(basePath, queryLocale)
    targetUrl.searchParams.delete("lang")
    return NextResponse.redirect(targetUrl)
  }

  if (pathnameLocale === DEFAULT_LOCALE) {
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = stripLocalePrefix(pathname, pathnameLocale)
    return NextResponse.redirect(targetUrl)
  }

  const locale = pathnameLocale ?? DEFAULT_LOCALE

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-locale", locale)

  if (pathnameLocale && pathnameLocale !== DEFAULT_LOCALE) {
    const basePath = stripLocalePrefix(pathname, pathnameLocale)
    return NextResponse.rewrite(
      new URL(basePath + req.nextUrl.search, req.url),
      { request: { headers: requestHeaders } }
    )
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
