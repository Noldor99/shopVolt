'use client'

import { useQueryClient } from '@tanstack/react-query'
import { FolderPen, Pencil, Plus } from 'lucide-react'

import { useMemo, useState } from 'react'

import { useGetAttributeValuesByCode } from '@/ahooks/useAttribute'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import { SmartTranslate } from '@/components/shared/TranslationButton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { api } from '@/lib/axios'

type FormAttributeValuesProps = {
  attributeCode?: string
  attributeName?: string
}

type ValueRow = {
  id: number
  valueUa: string
  valueEn: string
  usageCount: number
}

export const FormAttributeValues = ({ attributeCode, attributeName }: FormAttributeValuesProps) => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [valueUa, setValueUa] = useState('')
  const [valueEn, setValueEn] = useState('')

  const { data: values = [], isFetching } = useGetAttributeValuesByCode(
    attributeCode || '',
    Boolean(isOpen && attributeCode)
  )

  const rows = useMemo<ValueRow[]>(
    () =>
      values.map((item) => ({
        id: item.id,
        valueUa:
          item.translations.find((translation) => translation.locale === 'ua')?.value?.trim() ||
          item.translations.find((translation) => translation.locale === 'en')?.value?.trim() ||
          '',
        valueEn:
          item.translations.find((translation) => translation.locale === 'en')?.value?.trim() ||
          item.translations.find((translation) => translation.locale === 'ua')?.value?.trim() ||
          '',
        usageCount: ((item as { _count?: { deviceInfos?: number; deviceItemProperties?: number } })._count
          ?.deviceInfos ?? 0) +
          ((item as { _count?: { deviceInfos?: number; deviceItemProperties?: number } })._count
            ?.deviceItemProperties ?? 0),
      })),
    [values]
  )

  const resetEditor = () => {
    setEditingId(null)
    setValueUa('')
    setValueEn('')
  }

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['attribute-values', attributeCode],
    })
  }

  const onSave = async () => {
    if (!attributeCode) return
    const nextUa = valueUa.trim()
    const nextEn = valueEn.trim()

    if (!nextUa && !nextEn) {
      toast({
        title: 'Validation error',
        description: 'Enter value in at least one language.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      if (editingId) {
        await api.patch(`/attributes/${attributeCode}/values`, {
          attributeValueId: editingId,
          valueUa: nextUa,
          valueEn: nextEn,
        })
      } else {
        await api.post(`/attributes/${attributeCode}/values`, {
          valueUa: nextUa,
          valueEn: nextEn,
        })
      }

      await invalidate()
      resetEditor()
      toast({
        title: 'Success',
        description: editingId ? 'Value updated' : 'Value created',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save value',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (attributeValueId: number) => {
    if (!attributeCode) return

    try {
      await api.delete(`/attributes/${attributeCode}/values`, {
        data: { attributeValueId },
      })
      if (editingId === attributeValueId) resetEditor()
      await invalidate()
      toast({
        title: 'Success',
        description: 'Value deleted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete value',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetEditor()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!attributeCode}>
          <FolderPen className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Manage values {attributeName ? `for "${attributeName}"` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-600">Value UA</label>
              <input
                value={valueUa}
                onChange={(event) => setValueUa(event.target.value)}
                placeholder="Наприклад: Чорний"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="flex justify-center md:pb-[2px]">
              <SmartTranslate
                firstText={valueUa}
                secondText={valueEn}
                defaultFirstLang="uk"
                defaultSecondLang="en"
                onFirstTranslated={setValueUa}
                onSecondTranslated={setValueEn}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-600">Value EN</label>
              <input
                value={valueEn}
                onChange={(event) => setValueEn(event.target.value)}
                placeholder="For example: Black"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="default_out" onClick={resetEditor}>
                Clear
              </Button>
              <Button type="button" variant="black_out" onClick={onSave} disabled={isSaving}>
                {editingId ? 'Save changes' : 'Create value'}
              </Button>
            </div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1.1fr_1.1fr_110px_140px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <p>Value UA</p>
              <p>Value EN</p>
              <p>Usage</p>
              <p className="text-right">Actions</p>
            </div>

            {isFetching ? (
              <div className="px-4 py-6 text-sm text-slate-500">Loading values...</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No values yet.</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.1fr_1.1fr_110px_140px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm"
                >
                  <p className="truncate">{row.valueUa || '-'}</p>
                  <p className="truncate">{row.valueEn || '-'}</p>
                  <p>{row.usageCount}</p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="black_out"
                      size="sm"
                      onClick={() => {
                        setEditingId(row.id)
                        setValueUa(row.valueUa)
                        setValueEn(row.valueEn)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DialogDelete nameDelete="attribute value" onClick={() => onDelete(row.id)}>
                      <Button type="button" variant="destructive_out" size="sm" disabled={row.usageCount > 0}>
                        Delete
                      </Button>
                    </DialogDelete>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
