'use client'

import { useQueryClient } from '@tanstack/react-query'
import { FolderPen, Pencil, Plus } from 'lucide-react'

import { useMemo, useState } from 'react'

import { apiCategory } from '@/actions/client/categoryAction'
import { useGetCategoryAttributes } from '@/ahooks/useCategory'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import { SmartTranslate } from '@/components/shared/TranslationButton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { api } from '@/lib/axios'

type FormDeviceInfoManagerProps = {
  selectedCategoryId?: string
}

type InfoAttributeRow = {
  categoryAttributeId: number
  nameUa: string
  nameEn: string
  valuesCount: number
}

const normalizeName = (value: string) => value.trim()

export const FormDeviceInfoManager = ({ selectedCategoryId }: FormDeviceInfoManagerProps) => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nameUa, setNameUa] = useState('')
  const [nameEn, setNameEn] = useState('')

  const { data: attributesUaResponse } = useGetCategoryAttributes(
    selectedCategoryId || '',
    { lang: 'ua' },
    Boolean(isOpen && selectedCategoryId)
  )

  const { data: attributesEnResponse } = useGetCategoryAttributes(
    selectedCategoryId || '',
    { lang: 'en' },
    Boolean(isOpen && selectedCategoryId)
  )

  const rows = useMemo<InfoAttributeRow[]>(() => {
    const uaRows = (attributesUaResponse?.attributes ?? []).filter((item) => !item.isVariant)
    const enRows = (attributesEnResponse?.attributes ?? []).filter((item) => !item.isVariant)
    const map = new Map<number, InfoAttributeRow>()

    uaRows.forEach((item) => {
      map.set(item.categoryAttributeId, {
        categoryAttributeId: item.categoryAttributeId,
        nameUa: item.name,
        nameEn: '',
        valuesCount: item.values?.length ?? 0,
      })
    })

    enRows.forEach((item) => {
      const existing = map.get(item.categoryAttributeId)
      if (existing) {
        existing.nameEn = item.name
        if (!existing.valuesCount) {
          existing.valuesCount = item.values?.length ?? 0
        }
      } else {
        map.set(item.categoryAttributeId, {
          categoryAttributeId: item.categoryAttributeId,
          nameUa: '',
          nameEn: item.name,
          valuesCount: item.values?.length ?? 0,
        })
      }
    })

    return [...map.values()].sort((left, right) =>
      (left.nameUa || left.nameEn).localeCompare(right.nameUa || right.nameEn, 'uk')
    )
  }, [attributesEnResponse?.attributes, attributesUaResponse?.attributes])

  const resetEditor = () => {
    setEditingId(null)
    setNameUa('')
    setNameEn('')
  }

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId, 'attributes'] }),
      queryClient.invalidateQueries({ queryKey: ['category'] }),
    ])
  }

  const onSave = async () => {
    const categoryId = Number(selectedCategoryId)
    const nextUa = normalizeName(nameUa)
    const nextEn = normalizeName(nameEn)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      toast({
        title: 'Choose category first',
        description: 'Device info manager is linked to selected category.',
        variant: 'destructive',
      })
      return
    }

    if (!nextUa && !nextEn) {
      toast({
        title: 'Validation error',
        description: 'Enter name in at least one language.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      if (editingId) {
        await api.patch(`/categories/${categoryId}/attributes`, {
          categoryAttributeId: editingId,
          nameUa: nextUa,
          nameEn: nextEn,
        })
      } else {
        await api.post(`/categories/${categoryId}/attributes`, {
          nameUa: nextUa,
          nameEn: nextEn,
        })
      }
      await invalidate()
      resetEditor()
      toast({
        title: 'Success',
        description: editingId ? 'Device info updated' : 'Device info created',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save device info',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (categoryAttributeId: number) => {
    const categoryId = Number(selectedCategoryId)
    if (!Number.isInteger(categoryId) || categoryId <= 0) return

    try {
      await api.delete(`/categories/${categoryId}/attributes`, {
        data: { categoryAttributeId },
      })
      if (editingId === categoryAttributeId) resetEditor()
      await invalidate()
      toast({
        title: 'Success',
        description: 'Device info deleted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete device info',
        variant: 'destructive',
      })
    }
  }

  const isDisabled = !selectedCategoryId

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetEditor()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={isDisabled}>
          <FolderPen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Device Info for selected category</DialogTitle>
        </DialogHeader>

        {!selectedCategoryId ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Choose category first, then manage Device Info attributes.
          </div>
        ) : (
          <div className="space-y-4">

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-600">Name UA</label>
                <input
                  value={nameUa}
                  onChange={(event) => setNameUa(event.target.value)}
                  placeholder="Наприклад: Тип матриці"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="flex justify-center md:pb-[2px]">
                <SmartTranslate
                  firstText={nameUa}
                  secondText={nameEn}
                  defaultFirstLang="uk"
                  defaultSecondLang="en"
                  onFirstTranslated={setNameUa}
                  onSecondTranslated={setNameEn}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-600">Name EN</label>
                <input
                  value={nameEn}
                  onChange={(event) => setNameEn(event.target.value)}
                  placeholder="For example: Panel type"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="default_out" onClick={resetEditor}>
                  Clear
                </Button>
                <Button type="button" variant="black_out" onClick={onSave} disabled={isSaving}>
                  {editingId ? 'Save changes' : 'Create Device Info'}
                </Button>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.1fr_1.1fr_110px_140px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <p>Name UA</p>
                <p>Name EN</p>
                <p>Values</p>
                <p className="text-right">Actions</p>
              </div>

              {rows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No Device Info attributes for this category.
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.categoryAttributeId}
                    className="grid grid-cols-[1.1fr_1.1fr_110px_140px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm"
                  >
                    <p className="truncate">{row.nameUa || '-'}</p>
                    <p className="truncate">{row.nameEn || '-'}</p>
                    <p>{row.valuesCount}</p>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="black_out"
                        size="sm"
                        onClick={() => {
                          setEditingId(row.categoryAttributeId)
                          setNameUa(row.nameUa)
                          setNameEn(row.nameEn)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DialogDelete nameDelete="device info" onClick={() => onDelete(row.categoryAttributeId)}>
                        <Button type="button" variant="destructive_out" size="sm">
                          Delete
                        </Button>
                      </DialogDelete>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
