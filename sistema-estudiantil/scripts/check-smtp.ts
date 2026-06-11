import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

// Cargar .env manualmente si existe
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/)
      if (m) {
        const key = m[1]
        const val = m[2] ?? m[3] ?? m[4] ?? ''
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch (e) {
  // no bloquear si falla la lectura del .env
}

async function main() {
  const smtpHost = process.env.SMTP_HOST || 'localhost'
  const smtpPort = parseInt(process.env.SMTP_PORT || '1025', 10)
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = process.env.SMTP_PASS || ''

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  })

  try {
    await transporter.verify()
    console.log('SMTP reachable:', smtpHost + ':' + smtpPort)
  } catch (err) {
    console.error('SMTP verify failed:', (err && (err as Error).message) || err)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
