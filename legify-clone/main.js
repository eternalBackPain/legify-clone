import './style.css'

const app = document.querySelector('#app')

app.innerHTML = ``

const searchForm = app.querySelector('.search-form')
const searchInput = app.querySelector('.search-input')

searchForm.addEventListener('submit', (event) => {
  event.preventDefault()
})

searchInput.focus()
