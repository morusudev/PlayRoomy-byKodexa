import { spawn } from 'node:child_process'

process.env.ROOMY_TUNNEL = '1'
process.env.ROOMY_TUNNEL_HTTP = '1'

console.log('')
console.log('  [roomy] Modo compartilhar: abrindo tunel publico...')
console.log('  Mantenha este terminal aberto enquanto a sala estiver ativa.')
console.log('')

const child = spawn(process.platform === 'win32' ? 'npx' : 'npx', ['vite', '--host', '--config', 'vite.dev.config.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
