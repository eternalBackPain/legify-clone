import './style.css'

const SEARCH_DEBOUNCE_MS = 150
const RESULTS_PER_PAGE = 10
const DATA_URL = `${import.meta.env.BASE_URL}legislation.json`

const form = document.querySelector('.form')
const input = document.querySelector('.form-input')
const app = document.querySelector('#app')
const typeFilters = [...document.querySelectorAll('input[name="type"]')]

app.innerHTML = `
  <p class="status" aria-live="polite"></p>
  <ul class="results" aria-label="Search results"></ul>
  <nav class="pagination" aria-label="Search result pages"></nav>
`

const status = app.querySelector('.status')
const results = app.querySelector('.results')
const pagination = app.querySelector('.pagination')

let legislation = []
let dataLoaded = false
let searchTimeoutId = null
let currentResults = []
let currentPage = 1

form.addEventListener('submit', (event) => {
  event.preventDefault()
})

input.addEventListener('input', () => {
  clearTimeout(searchTimeoutId)
  searchTimeoutId = window.setTimeout(() => {
    handleSearch(input.value.trim())
  }, SEARCH_DEBOUNCE_MS)
})

typeFilters.forEach((filter) => {
  filter.addEventListener('change', () => {
    handleSearch(input.value.trim())
  })
})

pagination.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]')

  if (!button) {
    return
  }

  currentPage = Number(button.dataset.page)
  renderCurrentPage()
})

input.focus()
void loadLegislation()

async function loadLegislation() {
  renderStatus('Loading legislation...')

  try {
    const response = await fetch(DATA_URL, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load legislation JSON: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      throw new Error('Legislation JSON must be an array.')
    }

    legislation = data
      .filter(isSearchableRecord)
      .map((item) => ({
        ...item,
        searchTitle: item.title.toLowerCase(),
      }))
    dataLoaded = true
    handleSearch(input.value.trim())
  } catch (error) {
    console.error(error)
    renderStatus('Search is unavailable right now.')
    clearSearchResults()
  }
}

function handleSearch(rawQuery) {
  if (!dataLoaded) {
    renderStatus('Loading legislation...')
    clearSearchResults()
    return
  }

  if (!rawQuery) {
    renderStatus('')
    clearSearchResults()
    return
  }

  const normalizedQuery = rawQuery.trim().toLowerCase()
  const selectedTypes = getSelectedTypes()
  currentResults = legislation
    .filter(
      (item) =>
        item.jurisdiction === 'commonwealth' &&
        selectedTypes.has(item.type) &&
        item.searchTitle.includes(normalizedQuery)
    )
    .sort((left, right) => {
      const scoreDifference =
        getRelevanceScore(left.searchTitle, normalizedQuery) -
        getRelevanceScore(right.searchTitle, normalizedQuery)

      if (scoreDifference !== 0) {
        return scoreDifference
      }

      return left.title.localeCompare(right.title)
    })
  currentPage = 1

  if (!currentResults.length) {
    renderStatus('No legislation found.')
    clearSearchResults()
    return
  }

  renderCurrentPage()
}

function renderStatus(message) {
  status.textContent = message
}

function renderCurrentPage() {
  const totalPages = Math.ceil(currentResults.length / RESULTS_PER_PAGE)
  const pageStart = (currentPage - 1) * RESULTS_PER_PAGE
  const pageItems = currentResults.slice(pageStart, pageStart + RESULTS_PER_PAGE)

  renderStatus(
    `${currentResults.length} result${currentResults.length === 1 ? '' : 's'}. Page ${currentPage} of ${totalPages}.`
  )
  renderResults(pageItems)
  renderPagination(totalPages)
}

function renderResults(items) {
  results.innerHTML = items
    .map(
      (item) => `
        <li class="results-item">
          <a class="results-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">
            <span class="results-title">${escapeHtml(item.title)}</span>
            <span class="results-meta">${formatMeta(item)}</span>
          </a>
        </li>
      `
    )
    .join('')
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = ''
    return
  }

  const pageItems = getPaginationItems(currentPage, totalPages)
  pagination.innerHTML = `
    <button class="pagination-button" type="button" data-page="${currentPage - 1}" ${
      currentPage === 1 ? 'disabled' : ''
    }>Prev</button>
    ${pageItems
      .map((page) =>
        page === '...'
          ? '<span class="pagination-gap" aria-hidden="true">...</span>'
          : `<button class="pagination-button" type="button" data-page="${page}" ${
              page === currentPage ? 'aria-current="page"' : ''
            }>${page}</button>`
      )
      .join('')}
    <button class="pagination-button" type="button" data-page="${currentPage + 1}" ${
      currentPage === totalPages ? 'disabled' : ''
    }>Next</button>
  `
}

function getPaginationItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages]
}

function clearSearchResults() {
  currentResults = []
  currentPage = 1
  renderResults([])
  renderPagination(0)
}

function getRelevanceScore(normalizedTitle, query) {
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
  return escapeHtml(formatType(item.type))
}

function formatType(type) {
  return type === 'Legislative-instrument' ? 'Legislative instrument' : type
}

function getSelectedTypes() {
  return new Set(typeFilters.filter((filter) => filter.checked).map((filter) => filter.value))
}

function isSearchableRecord(item) {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.source === 'string' &&
    typeof item.jurisdiction === 'string' &&
    typeof item.title === 'string' &&
    typeof item.url === 'string' &&
    typeof item.type === 'string'
  )
}

function escapeAttribute(value) {
  return escapeHtml(String(value))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
