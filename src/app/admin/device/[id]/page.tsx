'use client'

import { useGetDeviceById } from '@/ahooks/useDevice'

import { useParams } from 'next/navigation'

import { DeviceForm } from './_components/DeviceForm'

const DeviceEditPage = () => {
  const { id } = useParams<{ id: string }>() ?? { id: '' }
  const { data: device, isFetched } = useGetDeviceById(id as string, id !== 'Add')

  return (
    <div className="container-sm">
      {id === 'Add' ? <DeviceForm /> : isFetched && <DeviceForm device={device} />}
    </div>
  )
}

export default DeviceEditPage
