import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/mailer"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email } = body

    // Siempre devolvemos una respuesta genérica por seguridad
    const genericResponse = {
      message: "Si tu correo está registrado, recibirás instrucciones para restablecer tu contraseña."
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(genericResponse, { status: 200 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Buscar al usuario por correo electrónico
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (user && user.isActive) {
      // Generar código numérico de 6 dígitos
      const token = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Hashear el código antes de guardarlo en la base de datos
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
      
      // Expiración en 15 minutos
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      // Guardar el token en la base de datos
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      })

      // Enviar el correo electrónico
      try {
        await sendPasswordResetEmail(user.email, token)
      } catch (mailError) {
        console.error("Error al enviar el correo con nodemailer:", mailError)
        // No fallamos la petición para no dar pistas al usuario de que algo falló internamente
      }
    }

    return NextResponse.json(genericResponse, { status: 200 })
  } catch (error) {
    console.error("Error en forgot-password API:", error)
    return NextResponse.json(
      { message: "Si tu correo está registrado, recibirás instrucciones para restablecer tu contraseña." },
      { status: 200 }
    )
  }
}
