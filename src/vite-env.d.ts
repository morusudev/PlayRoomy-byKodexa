/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ID?: string
  readonly VITE_PUBLIC_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_GITHUB_URL?: string
  readonly VITE_BRAND_BY?: string
  readonly VITE_KODEXA_URL?: string
  readonly VITE_MAX_PARTICIPANTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
