import { ReactNode } from "react"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

type RootLayoutPropsType = {
  children: ReactNode
}

const RootLayout = async ({ children }: RootLayoutPropsType) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

export default RootLayout
