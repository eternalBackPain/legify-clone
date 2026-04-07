import { createClient } from '@supabase/supabase-js'
import './style.css'

const SEARCH_DEBOUNCE_MS = 150
const RESULT_LIMIT = 10

const form = document.querySelector('.form')
const input = document.querySelector('.form-input')
const app = document.querySelector('#app')

app.innerHTML = `
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
  if (!hasSupabaseConfig) {
    renderStatus('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable search.')
    renderResults([])
    return
  }

  if (!rawQuery) {
    renderStatus('Start typing to search Commonwealth legislation.')
    renderResults([])
    return
  }

  renderStatus('Searching...')

  const sanitizedQuery = rawQuery.replace(/[%_]/g, '')

  const { data, error } = await supabase
    .from('legislation')
    .select('id, title, year, type, url')
    .eq('jurisdiction', 'commonwealth')
    .ilike('title', `%${sanitizedQuery}%`)
    .order('title', { ascending: true })
    .limit(RESULT_LIMIT)

  if (error) {
    renderStatus('Search is unavailable right now.')
    renderResults([])
    console.error(error)
    return
  }

  if (!data.length) {
    renderStatus('No legislation found.')
    renderResults([])
    return
  }

  renderStatus(`${data.length} result${data.length === 1 ? '' : 's'}.`)
  renderResults(data)
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
