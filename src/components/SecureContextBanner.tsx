import { ShieldAlert, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { isAppSecureContext } from '../lib/ensureWebCrypto'
import { Button } from './ui/Button'

/**
 * Blocks the app on http://LAN-IP — browsers do not treat that as a secure
 * context. Users must open the Vite HTTPS URL and accept the certificate.
 */
export function SecureContextBanner({ children }: { children: ReactNode }) {
  if (isAppSecureContext()) return children

  const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}`

  return (
    <div className="h-full flex items-center justify-center px-6 bg-surface-0">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Precisa de HTTPS</h1>
            <p className="text-xs text-text-muted">O sync do PlayRoomy só roda em contexto seguro</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          Você abriu <code className="text-text-primary">http://{window.location.host}</code>.
          Use o link <strong className="text-text-primary">https://</strong> que o terminal do Vite mostra (Network).
        </p>

        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>
            Abra <code className="text-accent break-all">{httpsUrl}</code>
          </li>
          <li>Aceite o aviso do certificado (Avançado → Continuar)</li>
          <li>Compartilhe esse mesmo link <strong className="text-text-primary">https://</strong> com amigos</li>
        </ol>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = httpsUrl
            }}
          >
            Abrir versão HTTPS
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Já aceitei o certificado. Recarregar
          </Button>
        </div>
      </div>
    </div>
  )
}
