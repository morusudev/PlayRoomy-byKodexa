import { createServer, type ServerResponse } from 'node:http'
import { attachRoomyWss, serverLimits } from './room-ws.ts'

const PORT = Number(process.env.PORT) || 8080
const HOST = '0.0.0.0'

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim()
  if (!raw || raw === '*') return ['*']
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

const allowedOrigins = parseAllowedOrigins()

function isOriginAllowed(origin: string | undefined): boolean {
  if (allowedOrigins.includes('*')) return true
  if (!origin) return true
  return allowedOrigins.includes(origin)
}

function corsOrigin(requestOrigin: string | undefined): string {
  if (allowedOrigins.includes('*')) return requestOrigin ?? '*'
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin
  return allowedOrigins[0] ?? ''
}

function writeCors(res: ServerResponse, origin: string | undefined) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin(origin))
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(res: ServerResponse, status: number, body: unknown, origin?: string) {
  writeCors(res, origin)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  const origin = req.headers.origin
  const pathname = (req.url ?? '/').split('?')[0]

  if (req.method === 'OPTIONS') {
    writeCors(res, origin)
    res.writeHead(204)
    res.end()
    return
  }

  if (pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'playroomy-api' }, origin)
    return
  }

  if (pathname === '/api/stats') {
    sendJson(res, 200, stats(), origin)
    return
  }

  if (pathname === '/') {
    sendJson(
      res,
      200,
      {
        name: 'PlayRoomy API',
        ws: '/roomy-ws',
        health: '/health',
      },
      origin,
    )
    return
  }

  sendJson(res, 404, { error: 'not_found' }, origin)
})

let stats = () => ({
  rooms: 0,
  connections: 0,
  limits: serverLimits,
})

const attached = attachRoomyWss(server, {
  onBeforeUpgrade: (req) => isOriginAllowed(req.headers.origin),
})
stats = attached.getStats

server.listen(PORT, HOST, () => {
  console.log(`[playroomy] API listening on http://${HOST}:${PORT}`)
  console.log(`[playroomy] WebSocket at /roomy-ws`)
  console.log(
    `[playroomy] limits rooms=${serverLimits.maxRooms} connections=${serverLimits.maxConnections}`,
  )
  if (!allowedOrigins.includes('*')) {
    console.log(`[playroomy] CORS origins: ${allowedOrigins.join(', ')}`)
  }
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
