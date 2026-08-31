import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { isValidRoomId } from '../utils/roomId'

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
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Sala inválida</h1>
          <p className="text-text-secondary mb-4">O ID da sala não é válido.</p>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    )
  }

  const handleJoin = () => {
    const name = nickname.trim()
    if (!name) return
    setLoading(true)
    navigate(`/room/${roomId}`, { state: { nickname: name } })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold mb-1">Entrar na sala</h1>
          <p className="text-text-secondary text-sm">
            Sala <span className="font-mono text-text-primary">{roomId}</span>
          </p>
        </div>

        <Input
          label="Seu nome"
          placeholder="Como quer ser chamado?"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={24}
          autoFocus
        />

        <Button className="w-full" onClick={handleJoin} loading={loading} disabled={!nickname.trim()}>
          Entrar
        </Button>

        <button
          onClick={() => navigate('/')}
          className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}
