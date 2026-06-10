import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST || "localhost"
const smtpPort = parseInt(process.env.SMTP_PORT || "1025", 10)
const smtpUser = process.env.SMTP_USER || ""
const smtpPass = process.env.SMTP_PASS || ""
const emailFrom = process.env.EMAIL_FROM || "no-reply@sistemaestudiantil.com"

// Crear el transportador de nodemailer
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true para puerto 465, false para otros puertos
  auth: smtpUser && smtpPass ? {
    user: smtpUser,
    pass: smtpPass,
  } : undefined,
  // Establecer tiempos de espera cortos en desarrollo para evitar colgar la petición
  connectionTimeout: 5000, 
  greetingTimeout: 5000,
  socketTimeout: 5000,
})

/**
 * Envía un correo con el código temporal y un enlace para restablecer la contraseña.
 * Si falla el envío por SMTP, registra los detalles en la consola para desarrollo.
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
  
  // Imprimir siempre el token en consola para desarrollo rápido y depuración
  console.log("\n========================================================")
  console.log("🔑 [DEV] SOLICITUD DE RESTABLECIMIENTO DE CONTRASEÑA")
  console.log(`Email de destino: ${email}`)
  console.log(`Código temporal:  ${token}`)
  console.log(`Enlace directo:   ${resetUrl}`)
  console.log("========================================================\n")

  const mailOptions = {
    from: `"Sistema Estudiantil" <${emailFrom}>`,
    to: email,
    subject: "Restablecer tu contraseña - Sistema de Gestión Estudiantil",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 700;">Sistema de Gestión Estudiantil</h2>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; color: #334155; line-height: 1.6;">
          <p style="margin-top: 0;">Hola,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Tu código de recuperación temporal es el siguiente:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f8fafc; padding: 12px 28px; border-radius: 8px; border: 1px dashed #cbd5e1; color: #1e40af; display: inline-block;">
              ${token}
            </span>
          </div>
          <p>Este código es válido por <strong>15 minutos</strong>. Si deseas restablecer tu contraseña directamente en el navegador, haz clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);">
              Restablecer Contraseña
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br />
            <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
          </p>
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">Si no solicitaste este restablecimiento, puedes ignorar este correo de forma segura.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Sistema de Gestión Estudiantil. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
    text: `Hola,\n\nHemos recibido una solicitud para restablecer la contraseña de tu cuenta.\n\nTu código de recuperación temporal es: ${token}\n\nSi deseas restablecer tu contraseña directamente, ingresa al siguiente enlace:\n${resetUrl}\n\nEste código es válido por 15 minutos.\n\nSi no realizaste esta solicitud, puedes ignorar este correo de forma segura.`,
  }

  try {
    console.log(`[SMTP] Intentando enviar correo a ${email} via ${smtpHost}:${smtpPort}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`[SMTP] Correo enviado exitosamente: MessageID = ${info.messageId}`)
    return info
  } catch (error) {
    console.error(`[SMTP ERROR] Falló el envío del correo a ${email}:`, error)
    // Lanzamos el error para que la ruta API lo capture, aunque el flujo no se detenga si es controlado
    throw error
  }
}
