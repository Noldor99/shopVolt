import { useState } from "react"

export const useAccordion = (defaultOpenSections: string[]) => {
  const [openSections, setOpenSections] = useState<string[]>(defaultOpenSections)

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  const isSectionOpen = (sectionId: string) => openSections.includes(sectionId)

  return { isSectionOpen, toggleSection }
}
