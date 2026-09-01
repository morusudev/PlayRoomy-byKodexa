import { createWriteStream, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = join(root, 'backend')
const outZip = join(root, 'playroomy-discloud.zip')
const envDiscloud = join(backendDir, '.env.discloud')

function pack() {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outZip)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      const sizeMb = (archive.pointer() / 1024 / 1024).toFixed(2)
      console.log(`[pack] ${outZip}`)
      console.log(`[pack] ${sizeMb} MB — pronto para upload na Discloud`)
      resolve()
    })

    archive.on('error', reject)
    archive.pipe(output)

    archive.glob('**/*', {
      cwd: backendDir,
      dot: true,
      ignore: [
        'node_modules/**',
        '.env',
        '.env.local',
        '.env.*.local',
        '.env.discloud',
      ],
    })

    if (existsSync(envDiscloud)) {
      archive.append(readFileSync(envDiscloud, 'utf8'), { name: '.env' })
      console.log('[pack] .env de produção incluído (ALLOWED_ORIGINS)')
    } else {
      console.warn('[pack] aviso: backend/.env.discloud não encontrado')
    }

    archive.finalize()
  })
}

pack().catch((err) => {
  console.error('[pack] falhou:', err)
  process.exit(1)
})
