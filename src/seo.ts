import { appConfig } from './config'

export const HOME_TITLE = 'PlayRoomy - Crie, compartilhe e assista com quem quiser.'

export function getRoomTitle(roomId: string): string {
  return `▶ ${roomId} | PlayRoomy`
}

export const seoDefaults = {
  siteName: 'PlayRoomy',
  siteUrl: appConfig.publicUrl || 'https://playroomy.vercel.app',
  locale: 'pt_BR',
  twitterHandle: '@kodexalabs',
  ogImage: '/og-image.svg',
  keywords: [
    'watch party',
    'youtube junto',
    'assistir youtube com amigos',
    'sincronizar video',
    'sala de video',
    'playroomy',
    'kodexa',
    'youtube sync',
    'ver video sincronizado',
  ].join(', '),
  description:
    'Assista YouTube com amigos no mesmo segundo. Crie uma sala, compartilhe o link e sincronize play, pause e playlist. Sem app e sem cadastro.',
} as const

export type SeoRoute = {
  title: string
  description: string
  noindex?: boolean
}

export function getSeoForPath(pathname: string): SeoRoute {
  const roomMatch = pathname.match(/^\/room\/([^/]+)/)
  if (roomMatch?.[1]) {
    const roomId = roomMatch[1]
    return {
      title: getRoomTitle(roomId),
      description:
        'Assista YouTube em sincronia com seus amigos. Chat, playlist e controles compartilhados em tempo real.',
      noindex: true,
    }
  }

  const joinMatch = pathname.match(/^\/join\/([^/]+)/)
  if (joinMatch?.[1]) {
    const roomId = joinMatch[1]
    return {
      title: getRoomTitle(roomId),
      description: 'Entre na sala PlayRoomy e assista YouTube junto com quem convidou você.',
      noindex: true,
    }
  }

  return {
    title: HOME_TITLE,
    description: seoDefaults.description,
  }
}

export function buildCanonicalUrl(pathname: string): string {
  const base = seoDefaults.siteUrl.replace(/\/$/, '')
  if (pathname === '/' || !pathname) return base
  return `${base}${pathname}`
}
