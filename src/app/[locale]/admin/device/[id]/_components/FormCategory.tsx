'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderPen, Pencil, Plus } from 'lucide-react'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { apiCategory } from '@/actions/client/categoryAction'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SmartTranslate } from '@/components/shared/TranslationButton'
import { toast } from '@/components/ui/use-toast'
import { api } from '@/lib/axios'
import { ICategory } from '@/types/category'

type CategoryManagerRow = {
  id: number
  nameUa: string
  nameEn: string
  devicesCount: number
}

const normalizeName = (value: string) => value.trim()

export const FormCategory = () => {
  const queryClient = useQueryClient()
  const { setValue, watch } = useFormContext<{ categoryId: string }>()
  const selectedCategoryId = watch('categoryId')

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nameUa, setNameUa] = useState('')
  const [nameEn, setNameEn] = useState('')

  const { data: categoriesUa = [] } = useQuery({
    queryKey: ['category-manager', 'ua'],
    queryFn: () => apiCategory.getAll({ lang: 'ua' }),
    enabled: isOpen,
  })

  const { data: categoriesEn = [] } = useQuery({
    queryKey: ['category-manager', 'en'],
    queryFn: () => apiCategory.getAll({ lang: 'en' }),
    enabled: isOpen,
  })

  const rows = useMemo(() => {
    const map = new Map<number, CategoryManagerRow>()

    categoriesUa.forEach((category) => {
      map.set(category.id, {
        id: category.id,
        nameUa: category.name ?? '',
        nameEn: '',
        devicesCount: category._count?.devices ?? 0,
      })
    })

    categoriesEn.forEach((category) => {
      const existing = map.get(category.id)
      if (existing) {
        existing.nameEn = category.name ?? ''
      } else {
        map.set(category.id, {
          id: category.id,
          nameUa: '',
          nameEn: category.name ?? '',
          devicesCount: category._count?.devices ?? 0,
        })
      }
    })

    return [...map.values()].sort((left, right) =>
      (left.nameUa || left.nameEn).localeCompare(right.nameUa || right.nameEn, 'uk')
    )
  }, [categoriesEn, categoriesUa])

  const resetEditor = () => {
    setEditingId(null)
    setNameUa('')
    setNameEn('')
  }

  const openCreate = () => {
    resetEditor()
  }

  const openEdit = (row: CategoryManagerRow) => {
    setEditingId(row.id)
    setNameUa(row.nameUa)
    setNameEn(row.nameEn)
  }

  const refreshCategories = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['category'] }),
      queryClient.invalidateQueries({ queryKey: ['category-manager'] }),
    ])
  }

  const onSave = async () => {
    const nextUa = normalizeName(nameUa)
    const nextEn = normalizeName(nameEn)
    const fallback = nextUa || nextEn

    if (!fallback) {
      toast({
        title: 'Validation error',
        description: 'Enter category name in at least one language.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)

      if (editingId) {
        await api.patch(`/categories/${editingId}?lang=ua`, { name: nextUa || fallback })
        await api.patch(`/categories/${editingId}?lang=en`, { name: nextEn || fallback })
      } else {
        const created = await api.post<ICategory>(`/categories?lang=ua`, { name: nextUa || fallback })
        const createdId = created.data.id
        await api.patch(`/categories/${createdId}?lang=en`, { name: nextEn || fallback })
        setValue('categoryId', String(createdId), { shouldDirty: true, shouldValidate: true })
      }

      await refreshCategories()
      resetEditor()

      toast({
        title: 'Success',
        description: editingId ? 'Category updated' : 'Category created',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (row: CategoryManagerRow) => {
    if (row.devicesCount > 0) {
      toast({
        title: 'Cannot delete category',
        description: 'Category has products. Move products first.',
        variant: 'destructive',
      })
      return
    }

    try {
      await api.delete(`/categories/${row.id}`)

      if (String(selectedCategoryId) === String(row.id)) {
        setValue('categoryId', '', { shouldDirty: true, shouldValidate: true })
      }

      await refreshCategories()
      if (editingId === row.id) resetEditor()

      toast({
        title: 'Success',
        description: 'Category deleted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete category',
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
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
          <FolderPen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-600">Name UA</label>
              <input
                value={nameUa}
                onChange={(event) => setNameUa(event.target.value)}
                placeholder="Наприклад: Ноутбуки"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="flex justify-center md:pb-[2px]">
              <SmartTranslate
                firstText={nameUa}
                secondText={nameEn}
                defaultFirstLang="uk"
                defaultSecondLang="en"
                onFirstTranslated={(translatedText) => setNameUa(translatedText)}
                onSecondTranslated={(translatedText) => setNameEn(translatedText)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-600">Name EN</label>
              <input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="For example: Laptops"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="default_out" onClick={resetEditor}>
                Clear
              </Button>
              <Button type="button" variant="black_out" onClick={onSave} disabled={isSaving}>
                {editingId ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1.1fr_1.1fr_120px_160px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <p>Name UA</p>
              <p>Name EN</p>
              <p>Products</p>
              <p className="text-right">Actions</p>
            </div>

            {rows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No categories yet.</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.1fr_1.1fr_120px_160px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm"
                >
                  <p className="truncate">{row.nameUa || '-'}</p>
                  <p className="truncate">{row.nameEn || '-'}</p>
                  <p>{row.devicesCount}</p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="black_out" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DialogDelete nameDelete="category" onClick={() => onDelete(row)}>
                      <Button
                        type="button"
                        variant="destructive_out"
                        size="sm"
                        disabled={row.devicesCount > 0}
                      >
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
