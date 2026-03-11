"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export const CabinetSidebar = () => {
  const pathname = usePathname()

  const navs = [
    { title: "Favorites", path: "/cabinet/favorites" },
    { title: "My orders", path: "/cabinet/my-orders" },
    { title: "Profile", path: "/cabinet/profile" },
  ]

  return (
    <aside className="hidden h-auto md:flex md:w-64 md:shrink-0">
      <div className="sticky top-24 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="border-b border-gray-100 px-4 pb-3 pt-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Cabinet</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">My account</p>
        </div>

        <div className="mt-2 flex flex-col gap-1 px-2 pb-2">
          {navs.map((item) => {
            const isCurrentPath = pathname?.startsWith(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900",
                  isCurrentPath && "border-gray-200 bg-white text-black shadow-sm hover:bg-white hover:text-black"
                )}
              >
                <span
                  className={cn(
                    "mr-3 h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors duration-200 group-hover:bg-gray-500",
                    isCurrentPath && "bg-gray-500 group-hover:bg-gray-500"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
