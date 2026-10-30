// A dice roller written directly against the DOM, the way you would without React.
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const MAX_ROLLS = 3

// ----- The state: plain variables -----
const values = [1, 1, 1, 1, 1]
const held = [false, false, false, false, false]
let rollsLeft = MAX_ROLLS

// ----- The DOM nodes that show the state -----
const diceBox = document.querySelector<HTMLDivElement>('#dice')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const rollButton = document.querySelector<HTMLButtonElement>('#roll')!
const newTurnButton = document.querySelector<HTMLButtonElement>('#new-turn')!

const dieButtons = values.map((_, i) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'die'
  button.disabled = true // nothing to hold before the first roll
  button.setAttribute('aria-pressed', 'false')
  button.addEventListener('click', () => toggleHold(i))
  diceBox.append(button)
  return button
})
dieButtons.forEach((_, i) => showFace(i))

rollButton.addEventListener('click', roll)
newTurnButton.addEventListener('click', newTurn)

// ----- Every change to the state must be copied to the DOM by hand -----
function showFace(i: number) {
  dieButtons[i].textContent = FACES[values[i] - 1]
  dieButtons[i].setAttribute('aria-label', `Die showing ${values[i]}`)
}

function showRollsLeft() {
  status.textContent = rollsLeft === 0 ? 'No rolls left.' : `Rolls left: ${rollsLeft}`
  rollButton.disabled = rollsLeft === 0
}

function roll() {
  for (let i = 0; i < values.length; i++) {
    if (held[i]) continue
    values[i] = Math.floor(Math.random() * 6) + 1
    showFace(i)
  }
  rollsLeft -= 1
  showRollsLeft()
  for (const button of dieButtons) button.disabled = false // dice can be held now
}

function toggleHold(i: number) {
  held[i] = !held[i]
  dieButtons[i].classList.toggle('held', held[i])
  dieButtons[i].setAttribute('aria-pressed', String(held[i]))
}

function newTurn() {
  held.fill(false)
  rollsLeft = MAX_ROLLS
  status.textContent = 'Roll to start.' // the same text as in index.html: keep both in sync
  rollButton.disabled = false
  for (const button of dieButtons) {
    button.disabled = true
    button.classList.remove('held')
    button.setAttribute('aria-pressed', 'false')
  }
}
