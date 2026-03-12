"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { getLocaleFromPathname, getMessages, withLocalePath } from "@/lib/i18n"

type HomeSlide = {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  href: string
}

type HomeSliderProps = {
  slides: HomeSlide[]
}

export const HomeSlider = ({ slides }: HomeSliderProps) => {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)

  if (!slides.length) return null

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={slides.length > 1}
        pagination={{ clickable: true }}
        navigation
        className="home-slider h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="group/slide relative h-[320px] w-full sm:h-[420px] md:h-[480px]">
              <img 
                src={slide.imageUrl} 
                alt={slide.title} 
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/slide:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/40 sm:to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 pb-14 sm:p-10 md:p-14 text-white">
                <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {slide.subtitle && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow-400 sm:text-sm">
                      {slide.subtitle}
                    </p>
                  )}
                  <h2 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight drop-shadow-md sm:text-4xl md:text-5xl">
                    {slide.title}
                  </h2>
                  <div>
                    <Link
                      href={withLocalePath(slide.href, locale)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold tracking-wide backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      {t.home.openCategory}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
