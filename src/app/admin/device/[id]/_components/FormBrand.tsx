'use client'

import { useQueryClient } from '@tanstack/react-query'
import { FolderPen, Pencil, Plus } from 'lucide-react'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { apiBrand } from '@/actions/client/brandAction'
import { useGetCategoryBrands } from '@/ahooks/useCategory'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

const normalizeName = (value: string) => value.trim()

export const FormBrand = () => {
  const queryClient = useQueryClient()
  const { watch, setValue } = useFormContext<{ categoryId: string; brandId: string | null }>()
  const selectedCategoryId = watch('categoryId')
  const selectedBrandId = watch('brandId')

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')

  const { data: brandsResponse, isFetching } = useGetCategoryBrands(
    selectedCategoryId || '',
    { lang: 'ua' },
    Boolean(isOpen && selectedCategoryId)
  )

  const rows = useMemo(() => brandsResponse?.brands ?? [], [brandsResponse])

  const resetEditor = () => {
    setEditingId(null)
    setName('')
  }

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand'] }),
      queryClient.invalidateQueries({ queryKey: ['category'] }),
      queryClient.invalidateQueries({
        queryKey: ['category', selectedCategoryId, 'brands'],
      }),
    ])
  }

  const onCreate = async () => {
    const nextName = normalizeName(name)
    const categoryId = Number(selectedCategoryId)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      toast({
        title: 'Choose category first',
        description: 'Brand manager is linked to selected category.',
        variant: 'destructive',
      })
      return
    }

    if (!nextName) {
      toast({
        title: 'Validation error',
        description: 'Brand name is required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      const created = await apiBrand.create({
        name: nextName,
        categoryIds: [categoryId],
      })
      setValue('brandId', String(created.id), { shouldDirty: true, shouldValidate: true })
      resetEditor()
      await invalidate()
      toast({ title: 'Success', description: 'Brand created and linked to category' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create brand',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onEdit = async () => {
    const nextName = normalizeName(name)
    const categoryId = Number(selectedCategoryId)

    if (!editingId) return
    if (!nextName) {
      toast({
        title: 'Validation error',
        description: 'Brand name is required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      await apiBrand.update(editingId, {
        name: nextName,
        addCategoryIds: Number.isInteger(categoryId) && categoryId > 0 ? [categoryId] : [],
      })
      resetEditor()
      await invalidate()
      toast({ title: 'Success', description: 'Brand updated' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update brand',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (brandId: number) => {
    const categoryId = Number(selectedCategoryId)
    if (!Number.isInteger(categoryId) || categoryId <= 0) return

    try {
      const fullBrand = await apiBrand.getOne(brandId)

      if ((fullBrand.devices ?? []).length > 0) {
        toast({
          title: 'Cannot delete brand',
          description: 'Brand has products. Move products first.',
          variant: 'destructive',
        })
        return
      }

      const categories = fullBrand.categories ?? []
      if (categories.length > 1) {
        await apiBrand.update(brandId, { removeCategoryIds: [categoryId] })
        toast({ title: 'Success', description: 'Brand unlinked from selected category' })
      } else {
        await apiBrand.remove(brandId)
        toast({ title: 'Success', description: 'Brand deleted' })
      }

      if (String(selectedBrandId) === String(brandId)) {
        setValue('brandId', null, { shouldDirty: true, shouldValidate: true })
      }
      if (editingId === brandId) resetEditor()
      await invalidate()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove brand',
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage brands for selected category</DialogTitle>
        </DialogHeader>

        {!selectedCategoryId ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Choose category first, then manage brands.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="black_out" onClick={resetEditor}>
                <Plus className="mr-2 h-4 w-4" />
                Add brand
              </Button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-600">Brand name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="For example: Apple"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="default_out" onClick={resetEditor}>
                  Clear
                </Button>
                <Button type="button" variant="black" onClick={editingId ? onEdit : onCreate} disabled={isSaving}>
                  {editingId ? 'Save changes' : 'Create brand'}
                </Button>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1fr_120px_170px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <p>Brand</p>
                <p>Products</p>
                <p className="text-right">Actions</p>
              </div>

              {isFetching ? (
                <div className="px-4 py-6 text-sm text-slate-500">Loading brands...</div>
              ) : rows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No brands linked to selected category yet.
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_120px_170px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm"
                  >
                    <p className="truncate">{row.name}</p>
                    <p>{row._count?.devices ?? 0}</p>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="black_out"
                        size="sm"
                        onClick={() => {
                          setEditingId(row.id)
                          setName(row.name)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DialogDelete nameDelete="brand" onClick={() => onDelete(row.id)}>
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
