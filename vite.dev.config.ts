import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import { roomyWsPlugin } from './plugins/roomy-ws.ts'
import { roomyTunnelPlugin } from './plugins/roomy-tunnel.ts'

const useTunnelHttp = process.env.ROOMY_TUNNEL_HTTP === '1'
const useTunnel = process.env.ROOMY_TUNNEL === '1' && useTunnelHttp

/** Config local: HTTPS + WebSocket + túnel. */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(useTunnel ? [] : [basicSsl()]),
    roomyWsPlugin(),
    roomyTunnelPlugin(),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
