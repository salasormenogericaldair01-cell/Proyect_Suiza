import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST || "localhost"
const smtpPort = parseInt(process.env.SMTP_PORT || "1025", 10)
const smtpUser = process.env.SMTP_USER || ""
const smtpPass = process.env.SMTP_PASS || ""
const emailFrom = process.env.EMAIL_FROM || "no-reply@sistemaestudiantil.com"

// Configuración del transportador optimizada para Gmail
const transporterOptions: any = smtpHost === "smtp.gmail.com"
  ? {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    }
  : {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass,
      } : undefined,
    }

transporterOptions.connectionTimeout = 5000
transporterOptions.greetingTimeout = 5000
transporterOptions.socketTimeout = 5000

const useEthereal = process.env.USE_ETHEREAL === "true"

let _cachedTransporter: any = null

async function getTransporter() {
  if (_cachedTransporter) return _cachedTransporter

  if (useEthereal) {
    // Crear cuenta de prueba Ethereal en tiempo de ejecución
    const testAccount = await nodemailer.createTestAccount()
    const etherealOptions = {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    }
    _cachedTransporter = nodemailer.createTransport(etherealOptions)
    // expose test account info for logging if needed
    ;(_cachedTransporter as any).__etherealAccount = testAccount
    return _cachedTransporter
  }

  _cachedTransporter = nodemailer.createTransport(transporterOptions)
  return _cachedTransporter
}

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
    from: emailFrom,
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
    const transporter = await getTransporter()
    const effectiveHost = useEthereal ? 'ethereal' : smtpHost
    console.log(`[SMTP] Intentando enviar correo a ${email} via ${effectiveHost}:${smtpPort}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`[SMTP] Correo enviado exitosamente: MessageID = ${info.messageId}`)

    // Si usamos Ethereal, imprimir la URL de vista previa
    try {
      const preview = nodemailer.getTestMessageUrl(info)
      if (preview) console.log(`[SMTP][ETHEREAL] Vista previa: ${preview}`)
    } catch (e) {
      // ignore
    }

    return info
  } catch (error) {
    console.error(`[SMTP ERROR] Falló el envío del correo a ${email}:`, error)
    throw error
  }
}

export async function sendNewGradeEmail(email: string, studentName: string, subjectName: string, score: number, comment?: string) {
  const mailOptions = {
    from: emailFrom,
    to: email,
    subject: `Nueva Calificación Registrada: ${subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; text-align: center;">Nueva Calificación</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>Se ha registrado una nueva calificación en el sistema:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Materia</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px;">${subjectName}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Nota</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; color: ${score >= 13 ? '#16a34a' : '#dc2626'}">${score}</td>
          </tr>
          ${comment ? `
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Comentario</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px; font-style: italic;">${comment}</td>
          </tr>
          ` : ''}
        </table>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
    text: `Hola ${studentName},\n\nSe ha registrado una nueva calificación en la materia ${subjectName}: ${score}.\n\nSaludos.`,
  }

  try {
    const transporter = await getTransporter()
    await transporter.sendMail(mailOptions)
    console.log(`[SMTP] Correo de nueva nota enviado a ${email}`)
  } catch (error) {
    console.error(`[SMTP ERROR] Falló el envío del correo de nueva nota a ${email}:`, error)
  }
}

export async function sendLowGradeAlertEmail(email: string, studentName: string, subjectName: string, score: number) {
  const mailOptions = {
    from: emailFrom,
    to: email,
    subject: `⚠️ Alerta de Calificación Baja en ${subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; border-radius: 8px; background-color: #fff5f5;">
        <h2 style="color: #dc2626; text-align: center;">⚠️ Alerta de Calificación</h2>
        <p>Estimado apoderado / estudiante,</p>
        <p>Se ha registrado una calificación baja para <strong>${studentName}</strong> en la materia <strong>${subjectName}</strong>:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: bold; color: #dc2626; border: 2px solid #dc2626; padding: 10px 20px; border-radius: 8px; background-color: #fff;">
            ${score}
          </span>
        </div>
        <p>Recuerde que la nota mínima aprobatoria es <strong>13</strong>. Recomendamos revisar el tema con el docente y repasar las tareas correspondientes.</p>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
          Este es un correo automático de alerta.
        </p>
      </div>
    `,
    text: `Alerta: ${studentName} obtuvo una nota baja de ${score} en la materia ${subjectName}.`,
  }

  try {
    const transporter = await getTransporter()
    await transporter.sendMail(mailOptions)
    console.log(`[SMTP] Alerta de nota baja enviada a ${email}`)
  } catch (error) {
    console.error(`[SMTP ERROR] Falló el envío del correo de alerta de nota baja a ${email}:`, error)
  }
}

export async function sendAttendanceAlertEmail(email: string, studentName: string, subjectName: string, date: string, status: string) {
  const statusLabel = status === "ABSENT" ? "Ausente" : status === "LATE" ? "Tardanza" : status === "EXCUSED" ? "Justificado" : status
  const mailOptions = {
    from: emailFrom,
    to: email,
    subject: `🔔 Reporte de Inasistencia/Tardanza: ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center;">🔔 Reporte de Asistencia</h2>
        <p>Estimado apoderado / estudiante,</p>
        <p>Se ha registrado una incidencia de asistencia para <strong>${studentName}</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Materia</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px;">${subjectName}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Fecha</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px;">${date}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Estado</th>
            <td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; color: #dc2626;">${statusLabel}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
          Este es un correo automático de asistencia.
        </p>
      </div>
    `,
    text: `Reporte de Asistencia: ${studentName} registrado como ${statusLabel} en la materia ${subjectName} el día ${date}.`,
  }

  try {
    const transporter = await getTransporter()
    await transporter.sendMail(mailOptions)
    console.log(`[SMTP] Correo de alerta de asistencia enviado a ${email}`)
  } catch (error) {
    console.error(`[SMTP ERROR] Falló el envío del correo de alerta de asistencia a ${email}:`, error)
  }
}
