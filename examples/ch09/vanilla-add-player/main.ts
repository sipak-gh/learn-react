const form = document.querySelector<HTMLFormElement>('#add-player')
const list = document.querySelector<HTMLUListElement>('#players')
if (!form || !list) throw new Error('page is missing an element')

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const name = String(new FormData(form).get('name')).trim()
  if (name !== '') {
    const item = document.createElement('li')
    item.textContent = name
    list.append(item)
  }
  form.reset()
})
