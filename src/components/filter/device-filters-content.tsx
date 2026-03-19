'use client'

import { FilterCheckboxGroup } from '@/components/filter/filter-checkbox-group'
import { FilterTogleGroup } from '@/components/filter/filter-togle-group'
import CustomAccordion from '@/components/shared/custom-accordion'
import { Button } from '@/components/ui/button'

import { useAccordion } from '@/hooks/useAccordion'

import { useDeviceFilters } from '../../hooks/hook-filter/use-device-filters'
import { FilterPrice } from './filter-price'

type Props = {
  className?: string
}

export const DeviceFiltersContent = ({ className }: Props) => {
  const {
    activeFilters,
    getSelectedOptions,
    onToggleOption,
    hasActiveFilters,
    clearFilters,
    t,
    minLimit,
    maxLimit,
    hasPriceRange,
    initialPrices,
    handlePriceChange,
  } = useDeviceFilters()

  const { isSectionOpen, toggleSection } = useAccordion([])

  return (
    <div className={className}>
      {hasPriceRange && (
        <FilterPrice
          minLimit={minLimit}
          maxLimit={maxLimit}
          initialMin={initialPrices.min}
          initialMax={initialPrices.max}
          onFilterChange={handlePriceChange}
          t={t}
        />
      )}

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
