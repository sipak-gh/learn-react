const dialog = document.querySelector<HTMLDialogElement>('#confirm')!
const logElement = document.querySelector('#log')!

function log(text: string) {
  logElement.textContent += text + '\n'
}

document.querySelector('#open-modal')!.addEventListener('click', () => {
  dialog.showModal()
  log(`showModal(): open = ${dialog.open}, focus on "${document.activeElement?.textContent}"`)
})
document.querySelector('#open')!.addEventListener('click', () => {
  dialog.show()
  log(`show(): open = ${dialog.open}, focus on "${document.activeElement?.textContent}"`)
})

// Escape fires "cancel" first. Call event.preventDefault() here to keep the dialog open.
dialog.addEventListener('cancel', () => log('cancel event'))
// Every way of closing fires "close".
dialog.addEventListener('close', () => log(`close event: returnValue = "${dialog.returnValue}"`))
