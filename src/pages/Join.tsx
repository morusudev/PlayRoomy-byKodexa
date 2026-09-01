import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PlayRoomyLogo } from '../components/brand/PlayRoomyLogo'
import { isValidRoomId } from '../utils/roomId'
import { NotFoundPage } from './NotFound'

/**
 * Join entry from Home. Password (if any) is asked inside the room
 * only when the host server says the room is private.
 */
export function JoinPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateNickname = (location.state as { nickname?: string })?.nickname ?? ''

  const [nickname, setNickname] = useState(stateNickname)
  const [loading, setLoading] = useState(false)

  if (!roomId || !isValidRoomId(roomId)) {
    return (
      <NotFoundPage
        title="Sala inválida"
        message="O código da sala não existe ou está incorreto. Confira o link que você recebeu."
      />
    )
  }

  const handleJoin = () => {
    const name = nickname.trim()
    if (!name) return
    setLoading(true)
    navigate(`/room/${roomId}`, { state: { nickname: name } })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-surface-0">
      <div className="w-full max-w-sm space-y-5 animate-fade-up">
        <div className="text-center mb-2 animate-fade-up animate-delay-1">
          <div className="flex justify-center mb-4">
            <PlayRoomyLogo size="lg" />
          </div>
          <h1 className="text-2xl font-display font-extrabold mb-2">Entrar na sala</h1>
          <p className="text-text-secondary text-sm">
            Sala <span className="font-mono text-text-primary">{roomId}</span>
          </p>
        </div>

        <div className="animate-fade-up animate-delay-2">
          <Input
            label="Seu nome"
            placeholder="Como quer ser chamado?"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>

        <Button
          className="w-full animate-fade-up animate-delay-3"
          onClick={handleJoin}
          loading={loading}
          disabled={!nickname.trim()}
        >
          Entrar
        </Button>

        <button
          onClick={() => navigate('/')}
          className="w-full inline-flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-all duration-200 hover:-translate-y-0.5 animate-fade-up animate-delay-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>
      </div>
    </div>
  )
}
