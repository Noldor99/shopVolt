'use client'

import { useState, useMemo, useEffect } from 'react'

interface UseDeviceGalleryProps {
  imageUrl?: string
  imageUrls?: (string | null | undefined)[]
}

export const useDeviceGallery = ({ imageUrl, imageUrls }: UseDeviceGalleryProps) => {
  const galleryImages = useMemo(() => {
    const urls = (imageUrls ?? []).filter((url): url is string => Boolean(url))
    if (urls.length > 0) return urls
    return imageUrl ? [imageUrl] : []
  }, [imageUrl, imageUrls])

  const [selectedImage, setSelectedImage] = useState<string>(galleryImages[0] ?? '')

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImage(galleryImages[0])
    }
  }, [galleryImages])

  return {
    galleryImages,
    selectedImage,
    setSelectedImage,
    hasGallery: galleryImages.length > 1
  }
}