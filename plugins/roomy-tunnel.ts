import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'

type TunnelStatus = 'off' | 'starting' | 'ready' | 'error'

let publicTunnelUrl: string | null = null
let tunnelStatus: TunnelStatus = 'off'
let tunnelError: string | null = null

function tunnelEnabled(): boolean {
  const v = process.env.ROOMY_TUNNEL?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

function sendJson(res: ServerResponse, body: unknown) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function attachPublicUrlRoute(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const path = req.url?.split('?')[0]
  if (path !== '/roomy-api/public-url') {
    next()
    return
  }
  sendJson(res, {
    enabled: tunnelEnabled(),
    status: tunnelStatus,
    url: publicTunnelUrl,
    error: tunnelError,
  })
}

async function startTunnel(server: ViteDevServer | PreviewServer) {
  if (!tunnelEnabled()) return

  tunnelStatus = 'starting'
  tunnelError = null
  publicTunnelUrl = null

  const port = server.config.server?.port ?? server.config.preview?.port ?? 5173

  const useLocalHttps = !process.env.ROOMY_TUNNEL_HTTP

  try {
    const { default: localtunnel } = await import('localtunnel')
    const tunnel = await localtunnel({
      port,
      ...(useLocalHttps
        ? { local_https: true, allow_invalid_cert: true }
        : {}),
    })

    publicTunnelUrl = tunnel.url.replace(/\/$/, '')
    tunnelStatus = 'ready'
    tunnelError = null

    console.log('')
    console.log('  [roomy] Link publico (internet):')
    console.log(`  ${publicTunnelUrl}`)
    console.log('  Compartilhe esse link com amigos de qualquer lugar.')
    console.log('')

    tunnel.on('close', () => {
      publicTunnelUrl = null
      tunnelStatus = 'error'
      tunnelError = 'Tunel encerrado. Reinicie npm run share.'
      console.warn('[roomy] Tunel publico fechado.')
    })

    tunnel.on('error', (err: Error) => {
      tunnelStatus = 'error'
      tunnelError = err.message
      console.error('[roomy] Erro no tunel:', err.message)
    })
  } catch (err) {
    tunnelStatus = 'error'
    tunnelError = err instanceof Error ? err.message : 'Falha ao abrir tunel'
    console.error('[roomy] Nao foi possivel abrir o tunel publico:', tunnelError)
  }
}

function wireTunnel(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(attachPublicUrlRoute)

  if (!tunnelEnabled()) return

  const httpServer = server.httpServer
  if (!httpServer) return

  if (httpServer.listening) {
    void startTunnel(server)
    return
  }

  httpServer.once('listening', () => {
    void startTunnel(server)
  })
}

export function roomyTunnelPlugin(): Plugin {
  return {
    name: 'roomy-tunnel',
    configureServer(server) {
      wireTunnel(server)
    },
    configurePreviewServer(server) {
      wireTunnel(server)
    },
  }
}
