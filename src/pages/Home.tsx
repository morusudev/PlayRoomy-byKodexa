import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { BrandBy } from '../components/landing/BrandBy'
import { CrtWarpBackground } from '../components/landing/CrtWarpBackground'
import { JoinHeaderButton } from '../components/landing/JoinHeaderButton'
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
    <div className="home-page min-h-full flex flex-col relative overflow-x-hidden">
      <CrtWarpBackground />

      <div className="home-shell relative z-10 flex flex-col min-h-full">
        <header className="pt-5 sm:pt-6 pb-2 animate-fade-up">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            <div className="flex flex-col gap-1.5 min-w-0">
              <PlayRoomyLogo size="hero" className="home-logo-glow" />
              <BrandBy className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold" />
            </div>
            <div className="flex justify-start lg:justify-end">
              <JoinHeaderButton onClick={() => setShowJoin(true)} />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-12 sm:pb-16" id="conteudo-principal">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-12rem)]">
            <div className="py-4 sm:py-6 lg:py-8">
              <span className="home-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-5 sm:mb-6 animate-fade-up animate-delay-1">
                <Sparkles className="w-3.5 h-3.5 text-accent-bright" />
                Watch party
              </span>

              <h1 className="home-title text-[2.15rem] min-[400px]:text-[2.5rem] sm:text-[3.1rem] lg:text-[3.4rem] leading-[1.04] mb-5 sm:mb-6 max-w-xl animate-fade-up animate-delay-2">
                YouTube com amigos.
                <br />
                <span className="text-accent-bright home-title-accent">No mesmo segundo.</span>
              </h1>

              <p className="text-text-secondary text-[15px] sm:text-lg leading-relaxed max-w-md mb-8 sm:mb-10 animate-fade-up animate-delay-3">
                Crie uma sala, compartilhe o link e assista com quem quiser. Play, pause e playlist
                sincronizados. Sem app, sem cadastro.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12 animate-fade-up animate-delay-4">
                <Button
                  size="lg"
                  onClick={() => setShowCreate(true)}
                  className="w-full sm:w-auto sm:min-w-[190px] font-bold home-cta-primary"
                >
                  Criar sala
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowJoin(true)}
                  className="w-full sm:w-auto sm:min-w-[190px] font-bold home-cta-outline"
                >
                  Tenho convite
                </Button>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4 max-w-lg animate-fade-up animate-delay-5">
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    className="home-step-card interactive-card rounded-xl border px-4 py-4"
                    style={{ animationDelay: `${0.55 + i * 0.08}s` }}
                  >
                    <span className="font-display text-xs text-accent-bright font-extrabold tabular-nums">
                      0{i + 1}
                    </span>
                    <p className="text-sm font-bold text-text-primary mt-2">{step.title}</p>
                    <p className="text-xs text-text-muted mt-1 leading-snug">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end py-4 sm:py-6 lg:py-8">
              <TeaserFrame />
            </div>
          </div>
        </main>

        <footer className="py-6 border-t border-white/8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-muted">
            <span className="flex items-center gap-2">
              <PlayRoomyLogo size="sm" className="shrink-0" />
              <BrandBy className="font-semibold uppercase tracking-[0.16em]" />
            </span>
            {appConfig.githubUrl ? (
              <a
                href={appConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent-bright transition-colors"
              >
                Código aberto no GitHub
              </a>
            ) : null}
          </div>
        </footer>
      </div>

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
