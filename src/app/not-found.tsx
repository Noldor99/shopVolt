import Link from "next/link"
import { Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

const NotFoundPage = () => {
  return (
    <main className="flex flex-1 items-center">
      <Container size="sm" className="py-16">
        <div className="rounded-3xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Error 404</p>
          <h1 className="mt-3 text-4xl font-black text-black sm:text-5xl">Page not found</h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-gray-600 sm:text-base">
            Сторінка, яку ви шукаєте, не існує або була переміщена. Перевірте адресу або
            поверніться на головну.
          </p>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="black_out" className="rounded-xl px-6">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                На головну
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  )
}

export default NotFoundPage
