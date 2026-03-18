'use client'

import { useGetCategory } from '@/ahooks/useCategory'
import { useDeleteDevice, useGetDevice } from '@/ahooks/useDevice'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useMemo } from 'react'

import { IconPencil, IconPlus } from '@tabler/icons-react'

import FilterSelect from '@/components/filter/filter-select'
import WrapPagination from '@/components/pagination/WrapPagination'
import DialogDelete from '@/components/ui-assembly/dialog-delete'
import SmalCard from '@/components/ui-assembly/smal-card'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

const DEVICE_LIMIT = 6

const DevicesPageClient = () => {
  const searchParams = useSearchParams()
  const page = searchParams?.get('page') || '1'
  const categoryId = searchParams?.get('categoryId')

  const { data: categories } = useGetCategory()
  const { mutate: deleteDevice } = useDeleteDevice()

  const filters = useMemo(
    () => ['all', ...(categories ?? []).map((category) => String(category.id))],
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
      </div>

      <div className={cn('flex flex-col items-center justify-start gap-2')}>
        {devicesData?.data.map((device) => (
          <SmalCard
            key={device.id}
            title={device.name ?? `#${device.id}`}
            subTitle={`Category: ${device.category?.name || `#${device.categoryId}`}`}
          >
            <Link href={`/admin/device/${device.id}`}>
              <Button className="p-2" variant="black_out">
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

export default DevicesPageClient
