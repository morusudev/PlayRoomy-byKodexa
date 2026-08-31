const QUALITY_ORDER = [
  'highres',
  'hd2160',
  'hd1440',
  'hd1080',
  'hd720',
  'large',
  'medium',
  'small',
  'tiny',
  'auto',
] as const

const QUALITY_LABELS: Record<string, string> = {
  auto: 'Automática',
  tiny: '144p',
  small: '240p',
  medium: '360p',
  large: '480p',
  hd720: '720p',
  hd1080: '1080p',
  hd1440: '1440p',
  hd2160: '4K',
  highres: 'Máxima',
}

export function qualityLabel(level: string): string {
  return QUALITY_LABELS[level] ?? level.toUpperCase()
}

export function sortQualityLevels(levels: string[]): string[] {
  const unique = [...new Set(levels)]
  return unique.sort((a, b) => {
    const ia = QUALITY_ORDER.indexOf(a as (typeof QUALITY_ORDER)[number])
    const ib = QUALITY_ORDER.indexOf(b as (typeof QUALITY_ORDER)[number])
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

export const PREFERRED_QUALITY_KEY = 'roomy-youtube-quality'
