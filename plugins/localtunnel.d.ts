declare module 'localtunnel' {
  interface TunnelOptions {
    port: number
    subdomain?: string
    host?: string
    local_host?: string
    local_https?: boolean
    allow_invalid_cert?: boolean
  }

  interface Tunnel {
    url: string
    on(event: 'close', listener: () => void): void
    on(event: 'error', listener: (err: Error) => void): void
    close(): void
  }

  function localtunnel(options: TunnelOptions): Promise<Tunnel>

  export default localtunnel
}
