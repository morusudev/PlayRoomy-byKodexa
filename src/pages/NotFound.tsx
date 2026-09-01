import { useNavigate } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { ErrorScreen } from '../components/errors/ErrorScreen'

interface NotFoundPageProps {
  title?: string
  message?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  message = 'O link que você abriu não existe ou foi movido. Volte ao início e tente de novo.',
}: NotFoundPageProps = {}) {
  const navigate = useNavigate()

  return (
    <ErrorScreen
      code="404"
      title={title}
      message={message}
      icon={
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/25 text-accent">
          <MapPinOff className="w-7 h-7" strokeWidth={2} />
        </span>
      }
      primaryLabel="Ir para o início"
      onPrimary={() => navigate('/')}
      secondaryLabel="Criar uma sala"
      onSecondary={() => navigate('/')}
    />
  )
}
