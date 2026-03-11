'use client'

import { useGetCategory } from '@/ahooks/useCategory'
import { useDeleteDevice, useGetDevice } from '@/ahooks/useDevice'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ChangeEvent, useMemo, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { IconFileSpreadsheet, IconPencil, IconPlus, IconUpload } from '@tabler/icons-react'

import FilterSelect from '@/components/filter/filter-select'
import WrapPagination from '@/components/pagination/WrapPagination'
import DialogDelete from '@/components/shared/dialog-delete'
import SmalCard from '@/components/shared/smal-card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

import { cn } from '@/lib/utils'

const DEVICE_LIMIT = 6

const DevicesPage = () => {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const page = searchParams?.get('page') || '1'
  const categoryId = searchParams?.get('categoryId')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const { data: categories } = useGetCategory()
  const { mutate: deleteDevice } = useDeleteDevice()

  const filters = useMemo(
    () => [
      'all',
      ...(categories ?? []).map((category) => String(category.id)),
    ],
    [categories]
  )

  const { data: devicesData } = useGetDevice({
    enabled: true,
    params: {
      limit: String(DEVICE_LIMIT),
      page,
      categoryId: categoryId || undefined,
    },
  })

  const handleExportDevices = async () => {
    try {
      const response = await fetch('/api/devices/export')

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+?)"/)

      link.href = downloadUrl
      link.download = filenameMatch?.[1] || 'devices.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Unable to export devices to Excel',
        variant: 'destructive',
      })
    }
  }

  const handleImportDevices = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/devices/import', {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as {
        error?: string
        created?: number
        updated?: number
        skipped?: number
      }

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      await queryClient.invalidateQueries({ queryKey: ['device'] })

      toast({
        title: 'Success',
        description: `Imported: ${result.created ?? 0}, updated: ${result.updated ?? 0}, skipped: ${
          result.skipped ?? 0
        }`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unable to import devices from Excel',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <div className="container-sm m-0">
      <div className="mb-5 flex flex-wrap items-start justify-start gap-4">
        <Button asChild variant="black_out">
          <Link href="/admin/device/Add">
            <IconPlus className="mr-2" />
            Add device
          </Link>
        </Button>

        {filters.length > 1 && <FilterSelect arrValue={filters} paramName="categoryId" />}

        <Button variant="default_out" onClick={handleExportDevices}>
          <IconFileSpreadsheet className="mr-2" />
          Export Excel
        </Button>

        <Button
          variant="default_out"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <IconUpload className="mr-2" />
          {isImporting ? 'Importing...' : 'Import Excel'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportDevices}
        />
      </div>

      <div className={cn('flex flex-col items-center justify-start gap-2')}>
        {devicesData?.data.map((device) => (
          <SmalCard
            key={device.id}
            title={device.name ?? `#${device.id}`}
            subTitle={`Category: ${device.category?.name || `#${device.categoryId}`}`}
          >
            <Link href={`/admin/device/${device.id}`}>
              <Button className="p-2">
                <IconPencil />
              </Button>
            </Link>

            <DialogDelete
              nameDelete={`device "${device.name}"`}
              onClick={() => {
                deleteDevice(device.id)
              }}
            />
          </SmalCard>
        ))}
      </div>

      {devicesData?.pagination.total === 0 && (
        <div className="paper-rounded flex justify-center">~list empty~</div>
      )}

      {devicesData && devicesData.pagination.total > DEVICE_LIMIT && (
        <div className="mt-8">
          <WrapPagination totalCount={devicesData.pagination.total} />
        </div>
      )}
    </div>
  )
}

export default DevicesPage
