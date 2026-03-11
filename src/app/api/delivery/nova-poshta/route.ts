import { NextRequest, NextResponse } from 'next/server'

const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/'

type NovaPoshtaResponse<TData> = {
  success: boolean
  errors: string[]
  data: TData
}

type SettlementAddress = {
  Ref: string
  DeliveryCity?: string
  Present: string
  MainDescription?: string
  Area?: string
}

type SearchSettlementsData = {
  Addresses: SettlementAddress[]
}

type City = {
  Ref: string
  Description: string
  Present?: string
}

type Warehouse = {
  Ref: string
  Description: string
  ShortAddress?: string
}

type WarehouseOption = {
  ref: string
  name: string
  kind: 'BRANCH' | 'POSTOMAT'
}

const sanitize = (value: string | null) => (value ?? '').trim()

async function fetchNovaPoshta<TData>(body: Record<string, unknown>) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error: 'NOVA_POSHTA_API_KEY is not configured',
    } as const
  }

  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      ...body,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      error: 'Nova Poshta API is unavailable',
    } as const
  }

  const payload = (await response.json()) as NovaPoshtaResponse<TData>

  if (!payload.success) {
    return {
      ok: false,
      status: 400,
      error: payload.errors?.[0] ?? 'Nova Poshta request failed',
    } as const
  }

  return {
    ok: true,
    data: payload.data,
  } as const
}

export async function GET(req: NextRequest) {
  try {
    const action = sanitize(req.nextUrl.searchParams.get('action'))

    if (action === 'cities') {
      const query = sanitize(req.nextUrl.searchParams.get('query'))
      if (query.length < 2) {
        return NextResponse.json({ data: [] })
      }

      const result = await fetchNovaPoshta<SearchSettlementsData[]>( {
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          CityName: query,
          Limit: 20,
        },
      })

      if (!result.ok && /city not found/i.test(result.error)) {
        return NextResponse.json({ data: [] })
      }

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      const addresses = result.data?.[0]?.Addresses ?? []
      let cities = addresses
        .map((address) => ({
          ref: address.DeliveryCity || address.Ref,
          name: address.Present || address.MainDescription || '',
        }))
        .filter((city) => city.ref && city.name)

      if (cities.length === 0) {
        const fallbackResult = await fetchNovaPoshta<City[]>({
          modelName: 'Address',
          calledMethod: 'getCities',
          methodProperties: {
            FindByString: query,
            Limit: 20,
          },
        })

        if (fallbackResult.ok) {
          cities = (fallbackResult.data ?? [])
            .map((city) => ({
              ref: city.Ref,
              name: city.Present || city.Description || '',
            }))
            .filter((city) => city.ref && city.name)
        }
      }

      cities = cities.filter(
        (city, index, array) => array.findIndex((other) => other.ref === city.ref) === index
      )

      return NextResponse.json({ data: cities })
    }

    if (action === 'warehouses') {
      const cityRef = sanitize(req.nextUrl.searchParams.get('cityRef'))
      if (!cityRef) {
        return NextResponse.json({ data: [] })
      }

      const result = await fetchNovaPoshta<Warehouse[]>({
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          Limit: 500,
        },
      })

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      const warehouses = (result.data ?? [])
        .map((warehouse): WarehouseOption => {
          const name = warehouse.Description || warehouse.ShortAddress || ''
          const isPostomat = /поштомат/i.test(name)

          return {
            ref: warehouse.Ref,
            name,
            kind: isPostomat ? 'POSTOMAT' : 'BRANCH',
          }
        })
        .filter((warehouse) => warehouse.ref && warehouse.name)

      return NextResponse.json({ data: warehouses })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to request Nova Poshta' }, { status: 500 })
  }
}
