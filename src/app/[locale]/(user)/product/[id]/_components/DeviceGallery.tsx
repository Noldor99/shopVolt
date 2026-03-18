'use client'

import React from 'react'

import { cn } from '@/lib/utils'

interface DeviceGalleryProps {
  images: string[]
  selectedImage: string
  onSelect: (url: string) => void
  deviceName?: string
  categoryName?: string
  className?: string
}

export const DeviceGallery: React.FC<DeviceGalleryProps> = ({
  images,
  selectedImage,
  onSelect,
  deviceName = 'Товар',
  categoryName,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50',
        className
      )}
    >
      <img
        src={selectedImage || '/logo.svg'}
        alt={deviceName}
        className="h-[320px] w-full object-cover transition-all duration-300 sm:h-[460px]"
      />
      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm">
        {categoryName ?? 'Товар'}
      </div>
      {images.length > 1 && (
        <div className="relative border-t border-slate-100 bg-white px-3 py-3">
          <div className="pointer-events-none absolute inset-y-3 left-3 z-10 w-5 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-3 right-3 z-10 w-5 bg-gradient-to-l from-white to-transparent" />

          <div
            className={cn(
              'flex gap-2 overflow-x-auto px-1 pb-1 pt-0.5',
              'snap-x snap-mandatory scroll-smooth',
              '[&::-webkit-scrollbar]:h-1.5',
              '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100/90',
              '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300',
              '[&::-webkit-scrollbar-thumb:hover]:bg-slate-400',
              '[scrollbar-color:rgb(203_213_225)_rgb(241_245_249)] [scrollbar-width:thin]'
            )}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => onSelect(image)}
                className={cn(
                  'h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl border transition-all duration-200',
                  selectedImage === image
                    ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-sm'
                    : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm'
                )}
              >
                <img
                  src={image}
                  alt={`${deviceName} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
