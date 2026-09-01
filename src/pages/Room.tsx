import { useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Check, Users, ArrowLeft, Link2, Globe, Wifi } from 'lucide-react'
import { NotFoundPage } from './NotFound'
import { BackendConnectionError } from '../components/errors/BackendConnectionError'
import { useRoom } from '../hooks/useRoom'
import { useInviteUrl } from '../hooks/useInviteUrl'
import { WatchTheater } from '../components/room/WatchTheater'
import { ParticipantList } from '../components/room/ParticipantList'
import { ConnectionBadge } from '../components/room/ConnectionBadge'
import { PlayRoomyLogo } from '../components/brand/PlayRoomyLogo'
import { Button } from '../components/ui/Button'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { useToastStore } from '../store/toastStore'
import { isValidRoomId } from '../utils/roomId'
import {
  canChangeVideo,
  canManageQueue,
  canManageUsers,
} from '../utils/permissions'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  const navState = location.state as { nickname?: string; password?: string } | null
  const [nickname, setNickname] = useState(navState?.nickname ?? '')
  const [showNicknameModal, setShowNicknameModal] = useState(!navState?.nickname)
  const [nicknameInput, setNicknameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const password = navState?.password

  const [showPeopleDrawer, setShowPeopleDrawer] = useState(false)
  const [copied, setCopied] = useState(false)

  const room = useRoom(showNicknameModal ? '' : (roomId ?? ''), nickname, password)
  const {
    inviteUrl,
    tunnelUrl,
    tunnelStatus,
    isInternetInvite,
    needsShareMode,
  } = useInviteUrl(roomId)

  const handleCopyInvite = useCallback(async () => {
    if (!roomId) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    if (isInternetInvite) {
      addToast('Link publico copiado!', 'success')
    } else {
      addToast(
        'Link copiado. Só funciona na mesma rede. Rode npm run share para amigos de longe.',
        'warning',
      )
    }
    setTimeout(() => setCopied(false), 2000)
  }, [roomId, inviteUrl, isInternetInvite, addToast])

  if (!roomId || !isValidRoomId(roomId)) {
    return (
      <NotFoundPage
        title="Sala inválida"
        message="O código da sala não existe ou está incorreto. Confira o link que você recebeu."
      />
    )
  }

  const backendUnreachable =
    !showNicknameModal &&
    !room.needsPassword &&
    (room.connectionStatus === 'error' ||
      (room.connectionStatus === 'disconnected' && !!room.error))

  if (backendUnreachable) {
    return (
      <BackendConnectionError
        message={room.error}
        onRetry={() => window.location.reload()}
        onHome={() => navigate('/')}
      />
    )
  }

  if (room.isKicked) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Você foi expulso</h1>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    )
  }

  const local = room.localParticipant
  const roomState = room.roomState
  const ownerId = roomState?.ownerId ?? ''
  const isOwner = local?.id === ownerId || local?.role === 'owner'
  const participantCount = roomState?.participants.length ?? 0
  const canVideo = local ? canChangeVideo(local, ownerId) : false
  const canQueue = local ? canManageQueue(local, ownerId) : false
  const canManage = local ? canManageUsers(local, ownerId) : false

  const handleAddVideo = (videoId: string, title: string, toQueue?: boolean) => {
    if (toQueue) {
      room.addToQueue(videoId, title)
      addToast('Adicionado à playlist', 'success')
    } else {
      room.changeVideo(videoId, title)
    }
  }

  const statusBanner = room.error
    ? { text: room.error, tone: 'danger' as const }
    : room.connectionStatus === 'connecting'
      ? { text: 'Conectando ao host...', tone: 'warning' as const }
      : room.waitingForHost && !room.roomState
        ? { text: 'Aguardando o host abrir a sala', tone: 'accent' as const }
        : room.peerCount > 0
          ? {
              text: `Sincronizado com ${room.peerCount} ${room.peerCount === 1 ? 'pessoa' : 'pessoas'}`,
              tone: 'success' as const,
            }
          : room.roomState
            ? { text: 'Compartilhe o convite para assistir junto', tone: 'muted' as const }
            : null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-0">
      <Modal open={showNicknameModal} onClose={() => navigate('/')} title="Entrar na sala">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Sala <span className="font-mono text-text-primary">{roomId}</span>
          </p>
          <Input
            label="Seu nome"
            placeholder="Como quer ser chamado?"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={24}
            autoFocus
          />
          <Button
            className="w-full"
            disabled={!nicknameInput.trim()}
            onClick={() => {
              setNickname(nicknameInput.trim())
              setShowNicknameModal(false)
            }}
          >
            Entrar
          </Button>
        </div>
      </Modal>

      <Modal
        open={!showNicknameModal && room.needsPassword}
        onClose={() => navigate('/')}
        title="Sala privada"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Esta sala tem senha. Digite a mesma senha que o host definiu ao criar.
          </p>
          {room.error && <p className="text-sm text-danger">{room.error}</p>}
          <Input
            label="Senha"
            type="password"
            placeholder="Senha da sala"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          <Button
            className="w-full"
            disabled={passwordInput.trim().length < 4}
            loading={room.connectionStatus === 'connecting'}
            onClick={() => room.submitPassword(passwordInput)}
          >
            Entrar com senha
          </Button>
        </div>
      </Modal>

      <header className="shrink-0 border-b border-border-subtle bg-surface-1 max-lg:bg-surface-1/95 max-lg:backdrop-blur-sm animate-fade-up">
        <div className="flex items-center justify-between gap-2 sm:gap-3 h-11 sm:h-14 px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
              title="Sair"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <PlayRoomyLogo size="sm" className="shrink-0" />
            <span className="sm:hidden font-mono text-[10px] text-text-muted tracking-wide truncate max-w-[4.5rem]">
              {roomId}
            </span>
            <span className="hidden sm:block w-px h-5 bg-border-subtle shrink-0" aria-hidden />
            <span className="hidden sm:inline font-mono text-[11px] text-text-muted tracking-wider truncate">
              {roomId}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {statusBanner && (
              <span
                className={`hidden md:inline text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors animate-fade-in ${
                  statusBanner.tone === 'success'
                    ? 'text-success bg-success/10'
                    : statusBanner.tone === 'danger'
                      ? 'text-danger bg-danger/10'
                      : statusBanner.tone === 'warning'
                        ? 'text-warning bg-warning/10'
                        : statusBanner.tone === 'accent'
                          ? 'text-accent bg-accent/10'
                          : 'text-text-muted bg-surface-2'
                }`}
              >
                {statusBanner.text}
              </span>
            )}
            <ConnectionBadge status={room.connectionStatus} />
            <Button variant="outline" size="sm" onClick={handleCopyInvite} className="gap-1 h-8">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-xs">{copied ? 'Copiado' : 'Convidar'}</span>
            </Button>
            <button
              onClick={() => setShowPeopleDrawer(true)}
              className="relative p-2 rounded-xl text-text-secondary hover:bg-surface-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              title="Participantes"
            >
              <Users className="w-4 h-4" />
              {participantCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-accent text-[9px] font-bold text-black flex items-center justify-center animate-scale-in">
                  {participantCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {tunnelStatus === 'starting' && (
        <div className="shrink-0 px-3 py-2 bg-accent/10 border-b border-accent/20 text-xs text-center text-text-secondary">
          Gerando link publico... aguarde alguns segundos.
        </div>
      )}

      {needsShareMode && isOwner && (
        <div className="shrink-0 px-3 py-2 bg-warning/10 border-b border-warning/20 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 text-center sm:text-left">
          <span className="text-text-secondary flex items-center justify-center sm:justify-start gap-1.5">
            <Wifi className="w-3.5 h-3.5 shrink-0 text-warning" />
            Este link so funciona na mesma rede.
          </span>
          <span className="text-text-muted">
            Para amigos de longe: pare o servidor e rode{' '}
            <code className="text-accent font-mono">npm run share</code>
          </span>
        </div>
      )}

      {tunnelUrl && isOwner && (
        <div className="shrink-0 px-3 py-2 bg-success/10 border-b border-success/20 text-xs flex items-center justify-center gap-1.5 text-success">
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[min(100%,42rem)] font-mono">{tunnelUrl}</span>
        </div>
      )}

      {room.waitingForHost && !room.roomState && room.connectionStatus === 'connected' && (
        <div className="shrink-0 px-4 py-2 bg-accent/10 border-b border-accent/20 text-xs text-center flex items-center justify-center gap-2">
          <span className="text-text-secondary">Sala ainda não existe no host.</span>
          <Button size="sm" variant="secondary" onClick={room.claimHost}>
            Sou o host
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 w-full flex flex-col">
        <WatchTheater
          playerState={roomState?.player ?? null}
          isAuthority={room.canControl}
          chatMessages={room.chatMessages}
          liveReactions={room.liveReactions}
          localUserId={local?.id}
          participants={roomState?.participants ?? []}
          ownerId={ownerId}
          controllerId={roomState?.controllerId ?? null}
          canManageUsers={canManage}
          queue={roomState?.queue ?? []}
          hasPreviousVideo={roomState?.hasPreviousVideo ?? false}
          canChangeVideo={canVideo}
          canManageQueue={canQueue}
          isOwner={isOwner}
          connected={room.connectionStatus === 'connected'}
          peerCount={room.peerCount}
          onPlay={room.sendPlay}
          onPause={room.sendPause}
          onSeek={room.sendSeek}
          onVideoEnded={room.sendVideoEnded}
          onStopVideo={room.stopVideo}
          onError={(msg) => addToast(msg, 'error')}
          onSendChat={room.sendChat}
          onSendReaction={room.sendReaction}
          onPlayNow={(id, title) => handleAddVideo(id, title, false)}
          onAddToQueue={(id, title) => handleAddVideo(id, title, true)}
          onRemoveFromQueue={room.removeFromQueue}
          onSkipQueue={room.skipQueue}
          onPrevQueue={room.prevQueue}
          onClearQueue={room.clearQueue}
          onSetRole={room.setRole}
          onKick={room.kickUser}
          onTransferControl={room.transferControl}
          onReclaimControl={room.reclaimControl}
        />
      </div>

      <Drawer
        open={showPeopleDrawer}
        onClose={() => setShowPeopleDrawer(false)}
        title={`Pessoas (${participantCount})`}
      >
        {roomState ? (
          <ParticipantList
            participants={roomState.participants}
            localUserId={local?.id}
            ownerId={ownerId}
            controllerId={roomState.controllerId}
            canManage={canManage}
            onSetRole={room.setRole}
            onKick={room.kickUser}
            onTransferControl={room.transferControl}
            onReclaimControl={room.reclaimControl}
          />
        ) : (
          <p className="text-sm text-text-muted text-center py-8">Conectando...</p>
        )}
      </Drawer>
    </div>
  )
}
