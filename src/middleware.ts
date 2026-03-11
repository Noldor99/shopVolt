import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n"
import { resolveLocaleFromRequest } from "@/lib/request-locale"

const PUBLIC_FILE = /\.[^/]+$/

const shouldIgnorePath = (pathname: string) => {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)
}

const getBasePathname = (pathname: string, pathnameLocale: string | null) => {
  if (!pathnameLocale) return pathname
  const rest = pathname.split("/").filter(Boolean).slice(1).join("/")
  return rest ? `/${rest}` : "/"
}

const toLocalizedPathname = (pathname: string, locale: string) => {
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
  const basePathname = getBasePathname(pathname, pathnameLocale)
  const queryLang = req.nextUrl.searchParams.get("lang")
  const queryLocale = isLocale(queryLang) ? queryLang : null

  if (queryLocale) {
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = toLocalizedPathname(basePathname, queryLocale)
    targetUrl.searchParams.delete("lang")
    const response = NextResponse.redirect(targetUrl)
    response.cookies.set("NEXT_LOCALE", queryLocale, { path: "/" })
    return response
  }

  const locale = pathnameLocale ?? resolveLocaleFromRequest(req)

  if (!pathnameLocale && locale !== DEFAULT_LOCALE) {
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = toLocalizedPathname(basePathname, locale)
    const response = NextResponse.redirect(targetUrl)
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" })
    return response
  }

  if (pathnameLocale === DEFAULT_LOCALE) {
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = `/${segments.slice(1).join("/")}` || "/"
    const response = NextResponse.redirect(targetUrl)
    response.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, { path: "/" })
    return response
  }

  const rewrittenPathname =
    pathnameLocale && pathnameLocale !== DEFAULT_LOCALE
      ? basePathname
      : pathname

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-locale", locale)

  const response = NextResponse.rewrite(
    new URL(rewrittenPathname + req.nextUrl.search, req.url),
    { request: { headers: requestHeaders } }
  )

  response.cookies.set("NEXT_LOCALE", locale, { path: "/" })
  return response
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
