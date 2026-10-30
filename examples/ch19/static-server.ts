// A tiny static file server, to see what a host does with dist/.
// Usage: node ch19/static-server.ts <folder> [url-prefix]
// Example: node ch19/static-server.ts ../five-dice/dist /games/five-dice/
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'dist')
const prefix = process.argv[3] ?? '/'
const port = Number(process.env.PORT ?? 8080)

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.map': 'application/json',
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  let file = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname
  file = path.join(root, file.slice(prefix.length - 1))

  // Refuse anything outside the prefix, or anything that climbs out of root.
  if (!url.pathname.startsWith(prefix) || !file.startsWith(root + path.sep)) {
    response.writeHead(404).end('Not found')
    console.log(404, url.pathname)
    return
  }
  try {
    const body = await readFile(file)
    // Hashed names never change content, so browsers may keep them for a year.
    // index.html keeps its name, so browsers must check it every time.
    const cache = file.includes(`${path.sep}assets${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': cache,
    })
    response.end(body)
    console.log(200, url.pathname, cache)
  } catch {
    response.writeHead(404).end('Not found')
    console.log(404, url.pathname)
  }
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}${prefix}`)
})
