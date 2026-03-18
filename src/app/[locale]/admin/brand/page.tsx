'use client'

import { useCreateBrand, useDeleteBrand, useGetBrand, useUpdateBrand } from '@/ahooks/useBrand'
import { useGetCategory } from '@/ahooks/useCategory'

import { FormEvent, useMemo, useState } from 'react'

import DialogDelete from '@/components/ui-assembly/dialog-delete'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

import { cn } from '@/lib/utils'

import type { IBrand } from '@/types/brand'

type CategoryView = {
  id: number
  name: string
}

type CategoryBadgeProps = {
  brand: IBrand
  categoryId: number
  isActive: boolean
}

const CategoryBrandBadge = ({ brand, categoryId, isActive }: CategoryBadgeProps) => {
  const { mutate: updateBrand, isPending } = useUpdateBrand(brand.id)

  const onToggle = () => {
    updateBrand(isActive ? { removeCategoryIds: [categoryId] } : { addCategoryIds: [categoryId] }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: isActive ? 'Brand removed from category' : 'Brand assigned to category',
        })
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to update category assignment',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className={cn(
        'h-8 w-fit rounded-full border px-3 text-sm transition-colors',
        isActive
          ? 'border-emerald-600 bg-emerald-500 text-white shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      )}
      title={isActive ? 'Remove from category' : 'Assign to category'}
    >
      {brand.name}
    </button>
  )
}

const BrandAdminPage = () => {
  const { data: categoriesData = [] } = useGetCategory()
  const { data: brandsData = [] } = useGetBrand()
  const { mutate: createBrand, isPending: isCreatePending } = useCreateBrand()
  const { mutate: deleteBrand, isPending: isDeletePending } = useDeleteBrand()

  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandCategoryId, setNewBrandCategoryId] = useState('')
  const [manageBrandId, setManageBrandId] = useState('')
  const [manageBrandName, setManageBrandName] = useState('')
  const [manageBrandCategoryId, setManageBrandCategoryId] = useState('')

  const categories = useMemo(
    () =>
      categoriesData.map((category) => ({ id: category.id, name: category.name }) as CategoryView),
    [categoriesData]
  )

  const sortedBrands = useMemo(
    () => [...brandsData].sort((a, b) => a.name.localeCompare(b.name)),
    [brandsData]
  )
  const brandsWithoutCategory = useMemo(
    () => sortedBrands.filter((brand) => (brand.categories ?? []).length === 0),
    [sortedBrands]
  )
  const selectedBrand = useMemo(
    () => sortedBrands.find((brand) => String(brand.id) === manageBrandId) ?? null,
    [sortedBrands, manageBrandId]
  )
  const { mutate: updateManagedBrand, isPending: isManagePending } = useUpdateBrand(
    selectedBrand?.id ?? 0
  )

  const onCreateBrand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newBrandName.trim()
    if (!name) return

    createBrand(
      {
        name,
        ...(newBrandCategoryId ? { categoryIds: [Number(newBrandCategoryId)] } : {}),
      },
      {
        onSuccess: () => {
          setNewBrandName('')
          setNewBrandCategoryId('')
          toast({ title: 'Success', description: 'Brand created' })
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to create brand',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const onSelectManagedBrand = (nextId: string) => {
    setManageBrandId(nextId)
    const brand = sortedBrands.find((item) => String(item.id) === nextId)
    setManageBrandName(brand?.name ?? '')
    setManageBrandCategoryId('')
  }

  const onRenameBrand = () => {
    if (!selectedBrand || !manageBrandName.trim()) return
    updateManagedBrand(
      { name: manageBrandName.trim() },
      {
        onSuccess: () => toast({ title: 'Success', description: 'Brand renamed' }),
        onError: (error) =>
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to rename brand',
            variant: 'destructive',
          }),
      }
    )
  }

  const onAssignManagedBrand = () => {
    if (!selectedBrand || !manageBrandCategoryId) return
    updateManagedBrand(
      { addCategoryIds: [Number(manageBrandCategoryId)] },
      {
        onSuccess: () => {
          setManageBrandCategoryId('')
          toast({ title: 'Success', description: 'Category assigned to brand' })
        },
        onError: (error) =>
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to assign category',
            variant: 'destructive',
          }),
      }
    )
  }

  return (
    <div className="container-sm m-0 space-y-4">
      <h1 className="text-2xl font-semibold">Brands by categories</h1>

      <form
        onSubmit={onCreateBrand}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="mb-3 text-sm font-medium text-slate-700">Create brand and assign category</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newBrandName}
            onChange={(event) => setNewBrandName(event.target.value)}
            className="h-9 min-w-[240px] rounded-md border border-slate-300 px-3"
            placeholder="New brand name"
          />
          <select
            value={newBrandCategoryId}
            onChange={(event) => setNewBrandCategoryId(event.target.value)}
            className="h-9 min-w-[240px] rounded-md border border-slate-300 px-3"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            variant="black_out"
            loading={isCreatePending}
            disabled={!newBrandName.trim()}
          >
            Add brand
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Manage brand (rename, delete, assign if missing)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={manageBrandId}
            onChange={(event) => onSelectManagedBrand(event.target.value)}
            className="h-9 min-w-[220px] rounded-md border border-slate-300 px-3"
          >
            <option value="">Select brand</option>
            {sortedBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <input
            value={manageBrandName}
            onChange={(event) => setManageBrandName(event.target.value)}
            className="h-9 min-w-[220px] rounded-md border border-slate-300 px-3"
            placeholder="New brand name"
            disabled={!selectedBrand}
          />
          <Button
            variant="black_out"
            onClick={onRenameBrand}
            disabled={!selectedBrand || !manageBrandName.trim() || isManagePending}
          >
            Save name
          </Button>
          <select
            value={manageBrandCategoryId}
            onChange={(event) => setManageBrandCategoryId(event.target.value)}
            className="h-9 min-w-[220px] rounded-md border border-slate-300 px-3"
            disabled={!selectedBrand}
          >
            <option value="">Assign category...</option>
            {categories
              .filter(
                (category) =>
                  !(selectedBrand?.categories ?? []).some(
                    (brandCategory) => brandCategory.id === category.id
                  )
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
          <Button
            variant="default_out"
            onClick={onAssignManagedBrand}
            disabled={!selectedBrand || !manageBrandCategoryId || isManagePending}
          >
            Assign
          </Button>
          {selectedBrand && (
            <DialogDelete
              nameDelete={`brand "${selectedBrand.name}"`}
              onClick={() =>
                deleteBrand(selectedBrand.id, {
                  onSuccess: () => {
                    setManageBrandId('')
                    setManageBrandName('')
                    toast({ title: 'Success', description: 'Brand deleted' })
                  },
                  onError: (error) =>
                    toast({
                      title: 'Error',
                      description:
                        error instanceof Error ? error.message : 'Failed to delete brand',
                      variant: 'destructive',
                    }),
                })
              }
            >
              <Button variant="destructive_out" loading={isDeletePending}>
                Delete brand
              </Button>
            </DialogDelete>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 text-lg font-medium">{category.name}</h2>
            <div className="flex flex-wrap gap-2">
              {sortedBrands.map((brand) => {
                const isActive = (brand.categories ?? []).some(
                  (brandCategory) => brandCategory.id === category.id
                )
                return (
                  <CategoryBrandBadge
                    key={`${category.id}-${brand.id}`}
                    brand={brand}
                    categoryId={category.id}
                    isActive={isActive}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Без категорії</h2>
        <div className="flex flex-wrap gap-2">
          {brandsWithoutCategory.map((brand) => (
            <span
              key={`no-category-${brand.id}`}
              className="h-8 w-fit rounded-full border border-amber-300 bg-amber-100 px-3 text-sm leading-8 text-amber-900"
            >
              {brand.name}
            </span>
          ))}
        </div>
      </div>

      {brandsWithoutCategory.length === 0 && (
        <div className="paper-rounded flex justify-center text-slate-500">
          All brands are assigned to at least one category
        </div>
      )}
    </div>
  )
}

export default BrandAdminPage
