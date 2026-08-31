import { appConfig } from '../../config'

type BrandByProps = {
  className?: string
}

export function BrandBy({ className = '' }: BrandByProps) {
  const label = `by ${appConfig.brandBy}`

  if (appConfig.brandUrl) {
    return (
      <a
        href={appConfig.brandUrl}
        target="_blank"
        rel="noreferrer"
        className={`hover:text-accent transition-colors ${className}`}
      >
        {label}
      </a>
    )
  }

  return <span className={className}>{label}</span>
}
