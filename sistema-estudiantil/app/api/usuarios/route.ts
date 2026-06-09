import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageUsers } from "@/lib/authz"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { z } from "zod"

export async function GET() {
  if (!(await canManageUsers())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: Request) {
  if (!(await canManageUsers())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(12),
    role: z.nativeEnum(Role),
  }).safeParse(await req.json())

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos. La contraseña debe tener al menos 12 caracteres." },
      { status: 400 }
    )
  }

  const { name, email, password, role } = parsed.data
  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)

  const usuario = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role,
      // Crear automáticamente el registro relacionado según el rol
      ...(role === "TEACHER" && {
        teacher: { create: {} }
      }),
      ...(role === "STUDENT" && {
        student: { create: { career: "", cycle: "" } }
      }),
      ...(role === "PARENT" && {
        parent: { create: {} }
      }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  return NextResponse.json(usuario, { status: 201 })
}
