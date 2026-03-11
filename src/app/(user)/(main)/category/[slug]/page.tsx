import React from 'react'

import { QueryDeviceParams } from '@/actions/client/deviceAction'

import { DeviceCard } from './_components/DeviceCard'

export type PageProps = {
  params: { [key: string]: string | string[] | undefined }
  searchParams?: QueryDeviceParams
}

const card = async (props: PageProps) => {
  return (
    <main className="flex-1">
      <div className="md:paper-sharp flex flex-col gap-[30px]">
        <DeviceCard {...props} />
      </div>
    </main>
  )
}

export default card
