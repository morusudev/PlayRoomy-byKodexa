import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachRoomyWss } from '../backend/src/room-ws.ts'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

async function serveStatic(pathname: string) {
  const safe = pathname === '/' ? '/index.html' : pathname
  const filePath = join(root, safe)

  if (!filePath.startsWith(root)) {
    return null
  }

  try {
    const body = await readFile(filePath)
    const type = MIME[extname(filePath)] ?? 'application/octet-stream'
    return { body, type }
  } catch {
    try {
      const body = await readFile(join(root, 'index.html'))
      return { body, type: 'text/html; charset=utf-8' }
    } catch {
      return null
    }
  }
}

const server = createServer(async (req, res) => {
  const pathname = (req.url ?? '/').split('?')[0]

  if (pathname === '/roomy-api/public-url') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ enabled: false, status: 'off', url: null, error: null }))
    return
  }

  const file = await serveStatic(pathname)
  if (!file) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  res.writeHead(200, { 'Content-Type': file.type })
  res.end(file.body)
})

attachRoomyWss(server)

const port = Number(process.env.PORT) || 3000
server.listen(port, () => {
  console.log(`[playroomy] production server http://0.0.0.0:${port}`)
  console.log('[playroomy] WebSocket rooms at /roomy-ws')
})
