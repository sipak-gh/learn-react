// Between awaits, other code runs. Two overlapping loads can finish in either order.
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let shown = ''

async function showPlayer(name: string, ms: number) {
  await delay(ms) // pretend to fetch the player; other tasks run meanwhile
  shown = name // whoever finishes LAST wins, not whoever was asked for last
  console.log('showing', shown)
}

showPlayer('Ada', 100) // the user picks Ada…
showPlayer('Grace', 10) // …then Grace, whose answer comes back faster
