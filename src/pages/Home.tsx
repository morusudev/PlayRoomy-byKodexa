import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { BrandBy } from '../components/landing/BrandBy'
import { PlayRoomyLogo } from '../components/brand/PlayRoomyLogo'
import { TeaserFrame } from '../components/landing/TeaserFrame'
import { RoomManager } from '../services/room/roomManager'
import { appConfig } from '../config'
import { isValidRoomId } from '../utils/roomId'

const STEPS = [
  { title: 'Cria', desc: 'Escolhe o nome e abre a sala' },
  { title: 'Convida', desc: 'Manda o link no grupo' },
  { title: 'Assiste', desc: 'Todo mundo no mesmo tempo' },
]

export function HomePage() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [nickname, setNickname] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!nickname.trim()) return
    setLoading(true)
    try {
      const roomId = await RoomManager.prepareRoom({
        isPrivate,
        password: isPrivate && password.trim().length >= 4 ? password.trim() : undefined,
        nickname: nickname.trim(),
      })
      navigate(`/room/${roomId}`, {
        state: {
          nickname: nickname.trim(),
          password: isPrivate && password.trim().length >= 4 ? password.trim() : undefined,
        },
      })
    } catch (err) {
      console.error(err)
      setLoading(false)
      return
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    const id = joinRoomId.trim()
    if (!nickname.trim() || !isValidRoomId(id)) return
    setLoading(true)
    try {
      navigate(`/join/${id}`, { state: { nickname: nickname.trim() } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page min-h-full flex flex-col">
      <header className="relative z-10 py-5 sm:py-6 animate-fade-up">
        <div className="max-w-6xl mx-auto w-full px-5 sm:px-10 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <PlayRoomyLogo size="hero" />
            <BrandBy className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold" />
          </div>
          <button
            type="button"
            onClick={() => setShowJoin(true)}
            className="interactive-card text-sm font-bold text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-xl border border-border-subtle hover:border-border bg-surface-1/40 hover:bg-surface-2/80 shrink-0"
          >
            Entrar
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 sm:px-10 pb-12 sm:pb-16" id="conteudo-principal">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-11rem)]">
          <div className="py-4 sm:py-6 lg:py-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] bg-accent/10 text-accent border border-accent/25 mb-5 sm:mb-6 animate-fade-up animate-delay-1">
              Watch party
            </span>

            <h1 className="home-title text-[2.15rem] min-[400px]:text-[2.5rem] sm:text-[3.1rem] lg:text-[3.4rem] leading-[1.04] mb-5 sm:mb-6 max-w-xl animate-fade-up animate-delay-2">
              YouTube com amigos.
              <br />
              <span className="text-accent">No mesmo segundo.</span>
            </h1>

            <p className="text-text-secondary text-[15px] sm:text-lg leading-relaxed max-w-md mb-8 sm:mb-10 animate-fade-up animate-delay-3">
              Crie uma sala, compartilhe o link e assista com quem quiser. Play, pause e playlist
              sincronizados. Sem app, sem cadastro.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12 animate-fade-up animate-delay-4">
              <Button
                size="lg"
                onClick={() => setShowCreate(true)}
                className="w-full sm:w-auto sm:min-w-[180px] font-bold"
              >
                Criar sala
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowJoin(true)}
                className="w-full sm:w-auto sm:min-w-[180px] font-bold"
              >
                Tenho convite
              </Button>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4 max-w-lg animate-fade-up animate-delay-5">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="interactive-card rounded-xl border border-white/8 bg-surface-1/50 backdrop-blur-sm px-4 py-4"
                  style={{ animationDelay: `${0.55 + i * 0.08}s` }}
                >
                  <span className="font-display text-xs text-accent font-extrabold tabular-nums">
                    0{i + 1}
                  </span>
                  <p className="text-sm font-bold text-text-primary mt-2">{step.title}</p>
                  <p className="text-xs text-text-muted mt-1 leading-snug">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end py-4 sm:py-6 lg:py-10">
            <TeaserFrame />
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 sm:px-10 py-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-2">
            <PlayRoomyLogo size="sm" className="shrink-0" />
            <BrandBy className="font-semibold uppercase tracking-[0.16em]" />
          </span>
          {appConfig.githubUrl ? (
            <a
              href={appConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              Código aberto no GitHub
            </a>
          ) : null}
        </div>
      </footer>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Criar sala">
        <div className="space-y-4">
          <Input
            label="Seu nome"
            placeholder="Como quer ser chamado?"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            autoFocus
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isPrivate ? 'bg-accent' : 'bg-surface-4'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPrivate ? 'translate-x-4' : ''
                }`}
              />
            </button>
            <span className="text-sm text-text-secondary">Sala privada</span>
          </div>
          {isPrivate && (
            <Input
              label="Senha da sala"
              type="password"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
            />
          )}
          <Button
            className="w-full"
            onClick={handleCreate}
            loading={loading}
            disabled={!nickname.trim() || (isPrivate && password.length < 4)}
          >
            Criar e entrar
          </Button>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Entrar em uma sala">
        <div className="space-y-4">
          <Input
            label="Seu nome"
            placeholder="Como quer ser chamado?"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            autoFocus
          />
          <Input
            label="ID da sala"
            placeholder="Ex: X7k29Lm"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            maxLength={8}
          />
          <Button
            className="w-full"
            onClick={handleJoin}
            loading={loading}
            disabled={!nickname.trim() || !isValidRoomId(joinRoomId.trim())}
          >
            Continuar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
