import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json()

  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })

  const hash = await bcrypt.hash(password, 10)

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
  })

  return NextResponse.json(usuario)
}