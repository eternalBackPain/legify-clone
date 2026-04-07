import { createClient } from '@supabase/supabase-js'
import './style.css'

const SEARCH_DEBOUNCE_MS = 150
const RESULT_LIMIT = 10
const CANDIDATE_LIMIT = 30

const form = document.querySelector('.form')
const input = document.querySelector('.form-input')
const app = document.querySelector('#app')

app.innerHTML = `
  <p class="status" aria-live="polite"></p>
  <ul class="results" aria-label="Search results"></ul>
`

const status = app.querySelector('.status')
const results = app.querySelector('.results')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null

let searchTimeoutId = null
let activeSearchToken = 0

form.addEventListener('submit', (event) => {
  event.preventDefault()
})

input.addEventListener('input', () => {
  clearTimeout(searchTimeoutId)
  searchTimeoutId = window.setTimeout(() => {
    void handleSearch(input.value.trim())
  }, SEARCH_DEBOUNCE_MS)
})

input.focus()

async function handleSearch(rawQuery) {
  const searchToken = ++activeSearchToken

  if (!hasSupabaseConfig) {
    renderStatus('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable search.')
    renderResults([])
    return
  }

  if (!rawQuery) {
    renderStatus('')
    renderResults([])
    return
  }

  renderStatus('Searching...')

  const normalizedQuery = rawQuery.trim().toLowerCase()
  const sanitizedQuery = normalizedQuery.replace(/[%_]/g, '')

  const { data, error } = await supabase
    .from('legislation')
    .select('id, title, year, type, url')
    .eq('jurisdiction', 'commonwealth')
    .ilike('title', `%${sanitizedQuery}%`)
    .limit(CANDIDATE_LIMIT)

  if (searchToken !== activeSearchToken) {
    return
  }

  if (error) {
    renderStatus('Search is unavailable right now.')
    renderResults([])
    console.error(error)
    return
  }

  const rankedResults = rankResults(data, normalizedQuery).slice(0, RESULT_LIMIT)

  if (!rankedResults.length) {
    renderStatus('No legislation found.')
    renderResults([])
    return
  }

  renderStatus(`${rankedResults.length} result${rankedResults.length === 1 ? '' : 's'}.`)
  renderResults(rankedResults)
}

function renderStatus(message) {
  status.textContent = message
}

function renderResults(items) {
  results.innerHTML = items
    .map(
      (item) => `
        <li class="results-item">
          <a class="results-link" href="${item.url}" target="_blank" rel="noreferrer">
            <span class="results-title">${escapeHtml(item.title)}</span>
            <span class="results-meta">${formatMeta(item)}</span>
          </a>
        </li>
      `
    )
    .join('')
}

function rankResults(items, query) {
  return [...items].sort((left, right) => {
    const scoreDifference = getRelevanceScore(left.title, query) - getRelevanceScore(right.title, query)

    if (scoreDifference !== 0) {
      return scoreDifference
    }

    return left.title.localeCompare(right.title)
  })
}

function getRelevanceScore(title, query) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle === query) {
    return 0
  }

  if (normalizedTitle.startsWith(query)) {
    return 1
  }

  if (normalizedTitle.split(/\s+/).some((word) => word.startsWith(query))) {
    return 2
  }

  if (normalizedTitle.includes(query)) {
    return 3
  }

  return 4
}

function formatMeta(item) {
  const parts = [item.type]

  if (item.year) {
    parts.push(String(item.year))
  }

  return escapeHtml(parts.join(' | '))
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
