import Header from "./_components/header"
import HeaderMobile from "./_components/header-mobile"

import SideNav from "./_components/side-nav"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <SideNav />
      <main className="flex-1">
        <div className="flex flex-col md:ml-60 sm:border-r sm:border-zinc-700 min-h-screen">
          <Header />
          <HeaderMobile />
          <div className="flex flex-col pt-2 px-4 space-y-2 flex-grow pb-4">{children}</div>
        </div>
      </main>
    </div>
  )
}
