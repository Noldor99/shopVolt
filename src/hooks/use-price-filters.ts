import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IDeviceFiltersResponse } from '@/types/device';
import { stripLocaleFromPathname } from '@/lib/i18n';

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 200000;

export const usePriceFilters = (pathname: string | null) => {
  const searchParams = useSearchParams();
  const [limits, setLimits] = useState({ min: DEFAULT_MIN, max: DEFAULT_MAX });

  const parsePrice = (value: string | null, fallback: number) => {
    if (!value || value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);


  const rawMin = parsePrice(searchParams.get('minPrice'), limits.min);
  const rawMax = parsePrice(searchParams.get('maxPrice'), limits.max);

  const minPrice = clamp(Math.min(rawMin, rawMax), limits.min, limits.max);
  const maxPrice = clamp(Math.max(rawMin, rawMax), limits.min, limits.max);

  useEffect(() => {
    const loadPriceRange = async () => {
      const cleanPathname = stripLocaleFromPathname(pathname);
      const categorySlug = cleanPathname.split('/category/')[1]?.split('/')[0];
      if (!categorySlug) return;

      try {
        const res = await fetch(`/api/devices/filters?categorySlug=${encodeURIComponent(categorySlug)}`);
        const payload = (await res.json()) as IDeviceFiltersResponse;

        if (payload?.priceRange) {
          setLimits({
            min: Math.max(0, payload.priceRange.min ?? DEFAULT_MIN),
            max: Math.max(0, payload.priceRange.max ?? DEFAULT_MAX),
          });
        }
      } catch (error) {
        console.error('Failed to load price range:', error);
      }
    };

    loadPriceRange();
  }, [pathname]);

  return {
    minPrice,
    maxPrice,
    minLimit: limits.min,
    maxLimit: limits.max,
  };
};