import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/i18n"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  const pathnameLocale = isLocale(firstSegment) ? firstSegment : null

  const queryLang = req.nextUrl.searchParams.get("lang")
  const queryLocale = isLocale(queryLang) ? queryLang : null

  if (queryLocale) {
    const basePath = pathnameLocale
      ? "/" + segments.slice(1).join("/") || "/"
      : pathname
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = queryLocale === DEFAULT_LOCALE
      ? basePath
      : basePath === "/" ? `/${queryLocale}` : `/${queryLocale}${basePath}`
    targetUrl.searchParams.delete("lang")
    return NextResponse.redirect(targetUrl)
  }

  if (pathnameLocale === DEFAULT_LOCALE) {
    const targetUrl = req.nextUrl.clone()
    targetUrl.pathname = "/" + segments.slice(1).join("/") || "/"
    return NextResponse.redirect(targetUrl)
  }

  if (pathnameLocale) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(
    new URL(`/${DEFAULT_LOCALE}${pathname}${req.nextUrl.search}`, req.url)
  )
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
