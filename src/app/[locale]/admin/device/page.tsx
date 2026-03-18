import { Suspense } from 'react'

import DevicesPageClient from './devices-page-client'

const DevicesPage = () => {
  return (
    <Suspense fallback={<div className="container-sm m-0 py-6">Loading devices...</div>}>
      <DevicesPageClient />
    </Suspense>
  )
}

export default DevicesPage
