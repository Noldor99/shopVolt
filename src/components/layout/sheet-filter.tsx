'use client'

import { SlidersHorizontal } from 'lucide-react'

import { DeviceFiltersContent } from '@/components/filter/device-filters-content'
import { FilterChips } from '@/components/filter/filter-chips'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type Props = {
  totalFound: number | null
}

export function SheetFilter({ totalFound }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="success" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Фільтри
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[300px] overflow-y-auto sm:w-[400px]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Фільтри товарів</SheetTitle>
          <SheetDescription>Оберіть параметри для пошуку ідеального пристрою.</SheetDescription>
        </SheetHeader>

        <FilterChips totalFound={totalFound} className="mt-4 lg:hidden" />

        <DeviceFiltersContent className="mt-6" />
      </SheetContent>
    </Sheet>
  )
}
