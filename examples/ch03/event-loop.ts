// What runs when? First all synchronous code, then every microtask, then the next task.
console.log('1 script start')

setTimeout(() => console.log('7 timeout callback (a task)'), 0)

Promise.resolve().then(() => console.log('4 promise callback (a microtask)'))
queueMicrotask(() => console.log('5 queueMicrotask callback (a microtask)'))

async function work() {
  console.log('2 async function: runs synchronously up to its first await')
  await null
  console.log('6 async function: the rest runs as a microtask')
}
work()

console.log('3 script end')
