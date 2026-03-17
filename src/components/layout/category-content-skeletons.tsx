const pulse = 'animate-pulse rounded-md bg-slate-200/80'

export const FilterSkeleton = () => {
  return (
    <aside className="hidden h-auto lg:flex lg:w-72 lg:shrink-0">
      <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 bg-white">
        <div className="space-y-5 border-t border-gray-100 px-6 py-5">
          <div className={`${pulse} h-10 w-full`} />
          <div className="space-y-3">
            <div className={`${pulse} h-5 w-3/4`} />
            <div className={`${pulse} h-4 w-full`} />
            <div className={`${pulse} h-4 w-11/12`} />
            <div className={`${pulse} h-4 w-10/12`} />
          </div>
          <div className="space-y-3">
            <div className={`${pulse} h-5 w-2/3`} />
            <div className={`${pulse} h-4 w-full`} />
            <div className={`${pulse} h-4 w-11/12`} />
          </div>
          <div className="space-y-3">
            <div className={`${pulse} h-5 w-1/2`} />
            <div className={`${pulse} h-4 w-full`} />
            <div className={`${pulse} h-4 w-10/12`} />
            <div className={`${pulse} h-4 w-9/12`} />
          </div>
        </div>
      </div>
    </aside>
  )
}

export const DeviceListSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-0">
            <div className={`${pulse} h-56 w-full rounded-none`} />
            <div className="space-y-3 p-5">
              <div className={`${pulse} h-3 w-1/3`} />
              <div className={`${pulse} h-6 w-11/12`} />
              <div className={`${pulse} h-4 w-2/3`} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <div className={`${pulse} h-7 w-24`} />
              <div className={`${pulse} h-9 w-24`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <div className={`${pulse} h-9 w-80`} />
      </div>
    </div>
  )
}

export const HomePageSkeleton = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className={`${pulse} h-[400px] w-full rounded-3xl`} />
      <div className="container space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className={`${pulse} h-64 rounded-3xl`} />
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${pulse} h-20 rounded-3xl`} />
            ))}
          </div>
        </div>
        <div className={`${pulse} h-80 rounded-3xl`} />
        <div className={`${pulse} h-96 rounded-3xl`} />
      </div>
    </div>
  )
}

export const ProductPageSkeleton = () => {
  return (
    <section className="container py-8 sm:py-10">
      <div className="grid gap-6 rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="space-y-4">
          <div className={`${pulse} aspect-square w-full rounded-[28px]`} />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${pulse} h-16 w-16 rounded-xl`} />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="mb-4 flex gap-2">
              <div className={`${pulse} h-6 w-20 rounded-full`} />
              <div className={`${pulse} h-6 w-24 rounded-full`} />
            </div>
            <div className={`${pulse} h-4 w-32`} />
            <div className={`${pulse} mt-2 h-8 w-3/4`} />
            <div className={`${pulse} mt-3 h-16 w-full`} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${pulse} h-24 rounded-2xl`} />
              ))}
            </div>
          </div>
          <div className={`${pulse} h-48 rounded-[28px]`} />
          <div className={`${pulse} h-64 rounded-[28px]`} />
        </div>
      </div>
    </section>
  )
}

export const BasketDrawerSkeleton = () => {
  return (
    <div className="space-y-3 px-6 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex gap-3">
            <div className={`${pulse} h-16 w-16 rounded-xl`} />
            <div className="flex-1 space-y-2">
              <div className={`${pulse} h-4 w-3/4`} />
              <div className={`${pulse} h-3 w-1/2`} />
              <div className={`${pulse} h-4 w-20`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
