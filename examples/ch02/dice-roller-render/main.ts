// The same dice roller, written as UI = f(state): change the state, then call render().
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const MAX_ROLLS = 3

const values = [1, 1, 1, 1, 1]
const held = [false, false, false, false, false]
let rollsLeft = MAX_ROLLS

const diceBox = document.querySelector<HTMLDivElement>('#dice')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const rollButton = document.querySelector<HTMLButtonElement>('#roll')!
const newTurnButton = document.querySelector<HTMLButtonElement>('#new-turn')!

// Event handlers only change the state. Then they ask for a render.
rollButton.addEventListener('click', () => {
  for (let i = 0; i < values.length; i++) {
    if (!held[i]) values[i] = Math.floor(Math.random() * 6) + 1
  }
  rollsLeft -= 1
  render()
})

newTurnButton.addEventListener('click', () => {
  held.fill(false)
  rollsLeft = MAX_ROLLS
  render()
})

// One function decides what the whole UI looks like. It rebuilds the dice from scratch.
function render() {
  const hasRolled = rollsLeft < MAX_ROLLS
  const buttons = values.map((value, i) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = held[i] ? 'die held' : 'die'
    button.disabled = !hasRolled
    button.textContent = FACES[value - 1]
    button.setAttribute('aria-label', `Die showing ${value}`)
    button.setAttribute('aria-pressed', String(held[i]))
    button.addEventListener('click', () => {
      held[i] = !held[i]
      render()
    })
    return button
  })
  diceBox.replaceChildren(...buttons)

  if (!hasRolled) status.textContent = 'Roll to start.'
  else if (rollsLeft === 0) status.textContent = 'No rolls left.'
  else status.textContent = `Rolls left: ${rollsLeft}`
  rollButton.disabled = rollsLeft === 0
}

render()
