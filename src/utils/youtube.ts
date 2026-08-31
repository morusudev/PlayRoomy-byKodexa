const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
]

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (VIDEO_ID_RE.test(trimmed)) {
    return trimmed
  }

  try {
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const parsed = new URL(normalized)

    if (parsed.hostname === 'youtu.be' || parsed.hostname === 'www.youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split(/[/?#]/)[0]
      if (id && VIDEO_ID_RE.test(id)) return id
    }

    if (parsed.hostname.includes('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v')
      if (fromQuery && VIDEO_ID_RE.test(fromQuery)) return fromQuery

      const pathMatch = parsed.pathname.match(
        /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/,
      )
      if (pathMatch?.[1]) return pathMatch[1]
    }
  } catch {
    // fall through to regex patterns
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
