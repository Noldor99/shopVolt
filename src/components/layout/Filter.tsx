'use client'

import { DeviceFiltersContent } from '@/components/filter/device-filters-content'

export const Filter = () => {
  return (
    <aside className="hidden h-auto lg:flex lg:w-72 lg:shrink-0">
      <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 bg-white">
        <div className="space-y-5 border-t border-gray-100 px-6 py-5">
          <DeviceFiltersContent />
        </div>
      </div>
    </aside>
  )
}
