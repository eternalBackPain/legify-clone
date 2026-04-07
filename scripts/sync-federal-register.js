import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const API_BASE_URL = 'https://api.prod.legislation.gov.au/v1/titles'
const PAGE_SIZE = 1000
const UPSERT_BATCH_SIZE = 500

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  const records = await fetchFederalTitles()

  console.log(`Fetched ${records.length} legislation records from Federal Register.`)

  for (let index = 0; index < records.length; index += UPSERT_BATCH_SIZE) {
    const batch = records.slice(index, index + UPSERT_BATCH_SIZE)
    const { error } = await supabase.from('legislation').upsert(batch, { onConflict: 'id' })

    if (error) {
      throw error
    }
  }

  console.log(`Upserted ${records.length} legislation records into Supabase.`)
}

async function fetchFederalTitles() {
  const output = []
  let skip = 0

  while (true) {
    const url = new URL(API_BASE_URL)
    url.searchParams.set('$select', 'id,name,year,collection,subCollection')
    url.searchParams.set('$orderby', 'id')
    url.searchParams.set('$top', String(PAGE_SIZE))
    url.searchParams.set('$skip', String(skip))

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Federal Register request failed with ${response.status}.`)
    }

    const payload = await response.json()
    const values = Array.isArray(payload.value) ? payload.value : []
    const mapped = values.map(mapTitleToLegislationRow).filter(Boolean)

    output.push(...mapped)

    if (values.length < PAGE_SIZE) {
      break
    }

    skip += PAGE_SIZE
  }

  return output
}

function mapTitleToLegislationRow(item) {
  if (!item?.id || !item?.name || !item?.year) {
    return null
  }

  const type = mapLegislationType(item.collection, item.subCollection)

  if (!type) {
    return null
  }

  return {
    id: item.id,
    source: 'federal-register',
    jurisdiction: 'commonwealth',
    title: item.name,
    year: item.year,
    url: `https://www.legislation.gov.au/${item.id}`,
    type,
  }
}

function mapLegislationType(collection, subCollection) {
  if (collection === 'Act') {
    return 'Act'
  }

  if (collection === 'LegislativeInstrument' && subCollection === 'Regulations') {
    return 'Regulation'
  }

  return null
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
