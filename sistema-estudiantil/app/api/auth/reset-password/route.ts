import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { token, newPassword, confirmPassword } = body

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Las contraseñas no coinciden" },
        { status: 400 }
      )
    }

    // Validar contraseña con mínimo de seguridad (mínimo 6 caracteres)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex")

    // Buscar el token en la base de datos
    const dbToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!dbToken) {
      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 400 }
      )
    }

    // Verificar si ya expiró o ya fue usado
    const now = new Date()
    if (dbToken.used || dbToken.expiresAt < now) {
      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 400 }
      )
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Actualizar usuario y eliminar/marcar el token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: dbToken.userId },
        data: { password: hashedPassword },
      }),
      // Marcamos como usado por consistencia si queremos auditar, o simplemente lo eliminamos. 
      // La solicitud dice: "marca token como usado o elimínalo". Lo eliminamos para evitar cualquier reutilización.
      prisma.passwordResetToken.delete({
        where: { id: dbToken.id },
      })
    ])

    return NextResponse.json(
      { message: "Contraseña restablecida correctamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error en reset-password API:", error)
    return NextResponse.json(
      { message: "Ocurrió un error al restablecer la contraseña" },
      { status: 500 }
    )
  }
}
