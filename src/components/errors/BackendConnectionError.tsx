import { WifiOff } from 'lucide-react'
import { ErrorScreen } from './ErrorScreen'
import { getBackendConnectionHint } from '../../config'

interface BackendConnectionErrorProps {
  message?: string | null
  onRetry: () => void
  onHome: () => void
}

export function BackendConnectionError({
  message,
  onRetry,
  onHome,
}: BackendConnectionErrorProps) {
  return (
    <ErrorScreen
      title="Servidor indisponível"
      message={
        message ??
        'Não foi possível conectar ao backend do PlayRoomy. A sala precisa do servidor online para sincronizar vídeo e chat.'
      }
      hint={getBackendConnectionHint()}
      icon={
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 border border-danger/25 text-danger">
          <WifiOff className="w-7 h-7" strokeWidth={2} />
        </span>
      }
      primaryLabel="Tentar de novo"
      onPrimary={onRetry}
      secondaryLabel="Voltar ao início"
      onSecondary={onHome}
    />
  )
}
