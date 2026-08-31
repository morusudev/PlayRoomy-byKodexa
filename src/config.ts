export const appConfig = {
  name: 'PlayRoomy',
  brandBy: import.meta.env.VITE_BRAND_BY?.trim() || 'Kodexa',
  brandUrl: import.meta.env.VITE_KODEXA_URL?.trim() || 'https://kodexalabs.com.br',

  /** Unique app namespace for peer discovery. Must match for everyone. */
  appId: import.meta.env.VITE_APP_ID?.trim() || 'playroomy-watch-party-v1',

  /** Public site URL for invite links (Vercel URL in production). */
  publicUrl: import.meta.env.VITE_PUBLIC_URL?.trim() || '',

  /**
   * WebSocket URL when frontend is hosted separately from the API.
   * Example: wss://seu-backend.discloud.app
   */
  wsUrl: import.meta.env.VITE_WS_URL?.trim() || '',

  /** Link to open-source repo (shown on landing footer). */
  githubUrl: import.meta.env.VITE_GITHUB_URL?.trim() || '',

  maxParticipants: Number(import.meta.env.VITE_MAX_PARTICIPANTS) || 20,
} as const

export function getWebSocketUrl(): string {
  const custom = appConfig.wsUrl
  if (custom) {
    const trimmed = custom.replace(/\/$/, '')
    return trimmed.endsWith('/roomy-ws') ? trimmed : `${trimmed}/roomy-ws`
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/roomy-ws`
}

export function getInviteBaseUrl(): string {
  if (appConfig.publicUrl) return appConfig.publicUrl.replace(/\/$/, '')
  return window.location.origin
}
