'use client'

import { FilterCheckboxGroup } from '@/components/filter/filter-checkbox-group'
import { FilterPrice } from '@/components/filter/filter-price'
import { FilterTogleGroup } from '@/components/filter/filter-togle-group'
import CustomAccordion from '@/components/shared/custom-accordion'
import { Button } from '@/components/ui/button'

import { FilterConfig } from '@/types/filter'

import { useDeviceFilters } from '../layout/hook/use-device-filters'

type Props = {
  className?: string
}

export const DeviceFiltersContent = ({ className }: Props) => {
  const {
    activeFilters,
    minPrice,
    maxPrice,
    minLimit,
    maxLimit,
    isSectionOpen,
    toggleSection,
    getSelectedOptions,
    onToggleOption,
    hasActiveFilters,
    updateQueryParams,
    clearFilters,
  } = useDeviceFilters()

  return (
    <div className={className}>
      <FilterPrice
        minPrice={minPrice}
        maxPrice={maxPrice}
        minLimit={minLimit}
        maxLimit={maxLimit}
        onChange={(values) => updateQueryParams(values)}
      />

      {activeFilters.map((filter) => (
        <CustomAccordion
          key={filter.id}
          title={filter.title}
          isOpen={isSectionOpen(filter.id)}
          onToggle={() => toggleSection(filter.id)}
        >
          {filter.id === 'diagonal' ? (
            <FilterTogleGroup
              items={filter.options.map((option) => ({ text: option, value: option }))}
              selectedIds={getSelectedOptions(filter.id)}
              onClickCheckbox={(value) => onToggleOption(filter.id, value)}
            />
          ) : (
            <FilterCheckboxGroup
              name={filter.id}
              items={filter.options.map((option) => ({ text: option, value: option }))}
              selectedIds={getSelectedOptions(filter.id)}
              onClickCheckbox={(value) => onToggleOption(filter.id, value)}
            />
          )}
        </CustomAccordion>
      ))}

      <Button
        variant="black_out"
        disabled={!hasActiveFilters}
        onClick={clearFilters}
        className="w-full"
      >
        Очистити фільтр
      </Button>
    </div>
  )
}
