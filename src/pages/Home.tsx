import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { BrandBy } from '../components/landing/BrandBy'
import { AtmosBackground } from '../components/landing/AtmosBackground'
import { JoinHeaderButton } from '../components/landing/JoinHeaderButton'
import { PlayRoomyLogo } from '../components/brand/PlayRoomyLogo'
import { TeaserFrame } from '../components/landing/TeaserFrame'
import { RoomManager } from '../services/room/roomManager'
import { appConfig } from '../config'
import { isValidRoomId } from '../utils/roomId'

const BEATS = [
  {
    kicker: '01',
    title: 'Abre a sala',
    copy: 'Um nome, um link. Sem conta, sem instalação.',
  },
  {
    kicker: '02',
    title: 'Chama o grupo',
    copy: 'Manda o convite. Quem entra já cai no mesmo frame.',
  },
  {
    kicker: '03',
    title: 'Assiste junto',
    copy: 'Play, pause, seek e fila, travados no mesmo segundo.',
  },
] as const

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
    <div className="landing-page min-h-full flex flex-col relative overflow-x-hidden">
      <AtmosBackground />

      <div className="landing-shell relative z-10 flex flex-col min-h-full">
        <header className="landing-nav flex items-center justify-between gap-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
          <div className="min-w-0 landing-reveal" style={{ animationDelay: '0.04s' }}>
            <PlayRoomyLogo size="hero" className="landing-brand" />
            <BrandBy className="mt-1.5 block text-[10px] uppercase tracking-[0.24em] text-white/35 font-semibold" />
          </div>
          <div className="landing-reveal" style={{ animationDelay: '0.1s' }}>
            <JoinHeaderButton onClick={() => setShowJoin(true)} />
          </div>
        </header>

        <main className="flex-1" id="conteudo-principal">
          {/* Hero — one composition */}
          <section className="landing-hero grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 lg:gap-14 xl:gap-16 items-center pt-8 sm:pt-10 lg:pt-6 pb-16 sm:pb-20 lg:min-h-[calc(100dvh-6.5rem)]">
            <div className="landing-hero-copy max-w-xl">
              <h1 className="landing-headline landing-reveal" style={{ animationDelay: '0.14s' }}>
                YouTube
                <br />
                com amigos.
                <span className="landing-headline-accent block mt-1 sm:mt-2">
                  No mesmo segundo.
                </span>
              </h1>

              <p
                className="landing-lede mt-5 sm:mt-6 text-[15px] sm:text-base lg:text-[17px] text-white/55 leading-relaxed max-w-md landing-reveal"
                style={{ animationDelay: '0.22s' }}
              >
                Crie a sala, mande o link e assista sincronizado: play, pause e playlist no tempo
                certo. Sem app. Sem cadastro.
              </p>

              <div
                className="mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3 landing-reveal"
                style={{ animationDelay: '0.3s' }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="landing-cta-primary group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-[15px] font-semibold text-black"
                >
                  Criar sala
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoin(true)}
                  className="landing-cta-ghost inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold text-white/85"
                >
                  Tenho convite
                </button>
              </div>
            </div>

            <div className="landing-reveal lg:justify-self-end w-full max-w-xl lg:max-w-none" style={{ animationDelay: '0.26s' }}>
              <TeaserFrame />
            </div>
          </section>

          {/* Editorial beats — below the fold */}
          <section className="landing-beats border-t border-white/[0.06] py-14 sm:py-16 lg:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 max-w-sm leading-tight">
                Três gestos.
                <span className="text-white/35"> Uma sessão.</span>
              </h2>
              <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                Do convite ao play: a sessão sobe rápido e fica travada no mesmo tempo.
              </p>
            </div>

            <ol className="grid gap-0 sm:grid-cols-3">
              {BEATS.map((beat, index) => (
                <li
                  key={beat.kicker}
                  className="landing-beat group relative px-0 sm:px-5 lg:px-6 py-6 sm:py-0 sm:first:pl-0"
                >
                  {index > 0 && (
                    <span
                      className="hidden sm:block absolute left-0 top-1 bottom-1 w-px bg-white/[0.08]"
                      aria-hidden
                    />
                  )}
                  {index > 0 && (
                    <span className="sm:hidden absolute left-0 right-0 top-0 h-px bg-white/[0.06]" aria-hidden />
                  )}
                  <span className="font-display text-xs font-semibold tracking-[0.2em] text-accent-bright/80">
                    {beat.kicker}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-white/90 group-hover:text-accent-bright transition-colors duration-300">
                    {beat.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/45 leading-relaxed max-w-[16rem]">
                    {beat.copy}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Closing strip */}
          <section className="landing-close border-t border-white/[0.06] py-14 sm:py-16 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-lg">
                <p className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-white/90 leading-snug">
                  A sala já está pronta.
                  <span className="text-accent-bright"> Falta só o link.</span>
                </p>
                <p className="mt-3 text-sm text-white/40 leading-relaxed">
                  Abra em qualquer navegador. Desktop ou mobile, o sync segue com você.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="landing-cta-primary self-start lg:self-auto group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-[15px] font-semibold text-black"
              >
                Começar agora
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>
        </main>

        <footer className="py-6 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/35">
            <span className="flex items-center gap-2.5">
              <PlayRoomyLogo size="sm" className="shrink-0 opacity-90" />
              <BrandBy className="font-semibold uppercase tracking-[0.16em]" />
            </span>
            {appConfig.githubUrl ? (
              <a
                href={appConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex items-center justify-center text-white/40 hover:text-accent-bright transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                </svg>
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
              aria-pressed={isPrivate}
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
