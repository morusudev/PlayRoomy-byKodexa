import { useCallback, useEffect, useMemo, useState } from 'react'
import { appConfig } from '../config'

type TunnelStatus = 'off' | 'starting' | 'ready' | 'error'

interface PublicUrlResponse {
  enabled: boolean
  status: TunnelStatus
  url: string | null
  error: string | null
}

function isPrivateNetworkHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map(Number)
    if (a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  return false
}

export function useInviteUrl(roomId: string | undefined) {
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>('off')
  const [tunnelError, setTunnelError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/roomy-api/public-url', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as PublicUrlResponse
      setTunnelStatus(data.status)
      setTunnelError(data.error)
      if (data.url) setTunnelUrl(data.url.replace(/\/$/, ''))
    } catch {
      // dev server offline or static deploy
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(refresh, 4000)
    return () => window.clearInterval(id)
  }, [refresh])

  const baseUrl = useMemo(() => {
    if (appConfig.publicUrl) return appConfig.publicUrl.replace(/\/$/, '')
    if (tunnelUrl) return tunnelUrl
    return window.location.origin
  }, [tunnelUrl])

  const inviteUrl = roomId ? `${baseUrl}/room/${roomId}` : baseUrl

  const isInternetInvite =
    !!appConfig.publicUrl ||
    !!tunnelUrl ||
    (!isPrivateNetworkHost(window.location.hostname) &&
      window.location.protocol === 'https:')

  const needsShareMode =
    isPrivateNetworkHost(window.location.hostname) &&
    !appConfig.publicUrl &&
    !tunnelUrl &&
    tunnelStatus !== 'starting'

  return {
    inviteUrl,
    baseUrl,
    tunnelUrl,
    tunnelStatus,
    tunnelError,
    isInternetInvite,
    needsShareMode,
    refresh,
  }
}
