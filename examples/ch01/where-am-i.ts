// Run with Node: `node ch01/where-am-i.ts`. Node is a JavaScript runtime with no browser around it.
const runtime = typeof document === 'undefined' ? 'Node (no browser)' : 'a browser'

console.log('Running in:', runtime)
console.log('typeof document:', typeof document)
console.log('typeof window:', typeof window)
console.log('typeof setTimeout:', typeof setTimeout)
console.log('typeof fetch:', typeof fetch)
console.log('Node version:', process.version)
