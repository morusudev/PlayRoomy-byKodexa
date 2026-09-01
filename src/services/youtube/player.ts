export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export type YtPlayerState = (typeof YT_PLAYER_STATE)[keyof typeof YT_PLAYER_STATE]

export interface YtPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead?: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): YtPlayerState
  loadVideoById(
    videoId: string,
    startSeconds?: number,
  ): void
  loadVideoById(options: {
    videoId: string
    startSeconds?: number
    suggestedQuality?: string
  }): void
  cueVideoById(videoId: string, startSeconds?: number): void
  getVideoData(): { video_id: string; title?: string }
  setVolume(volume: number): void
  getVolume(): number
  mute(): void
  unMute(): void
  setSize(width: number, height: number): void
  getAvailableQualityLevels(): string[]
  getPlaybackQuality(): string
  setPlaybackQuality(quality: string): void
  stopVideo(): void
  destroy(): void
  getIframe(): HTMLIFrameElement
}

export interface YtPlayerEvent {
  target: YtPlayer
}

export interface YtOnStateChangeEvent extends YtPlayerEvent {
  data: YtPlayerState
}

export interface YtOnErrorEvent extends YtPlayerEvent {
  data: number
}

export interface YtPlayerOptions {
  videoId?: string
  width?: string | number
  height?: string | number
  host?: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: YtPlayerEvent) => void
    onStateChange?: (event: YtOnStateChangeEvent) => void
    onError?: (event: YtOnErrorEvent) => void
    onPlaybackQualityChange?: (event: YtPlayerEvent) => void
  }
}

interface YtApi {
  Player: new (elementId: string | HTMLElement, options: YtPlayerOptions) => YtPlayer
  PlayerState: typeof YT_PLAYER_STATE
}

declare global {
  interface Window {
    YT: YtApi
    onYouTubeIframeAPIReady: () => void
  }
}

let apiPromise: Promise<void> | null = null

export function loadYouTubeAPI(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve()
  }

  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })

  return apiPromise
}

export function createYouTubePlayer(
  element: string | HTMLElement,
  options: YtPlayerOptions,
): Promise<YtPlayer> {
  return loadYouTubeAPI().then(
    () =>
      new Promise((resolve) => {
        new window.YT.Player(element, {
          ...options,
          events: {
            ...options.events,
            onReady: (event) => {
              options.events?.onReady?.(event)
              resolve(event.target)
            },
          },
        })
      }),
  )
}

export const YT_ERROR_MESSAGES: Record<number, string> = {
  2: 'URL de vídeo inválida.',
  5: 'Erro de reprodução no HTML5 player.',
  100: 'Vídeo não encontrado ou removido.',
  101: 'O proprietário não permite reprodução incorporada.',
  150: 'O proprietário não permite reprodução incorporada.',
}

export const YT = {
  PlayerState: YT_PLAYER_STATE,
}
