import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageUsers, canManageTeachers } from "@/lib/authz"

export async function GET() {
  try {
    if (!(await canManageUsers())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const profesores = await prisma.teacher.findMany({
      include: {
        user: true,
        subjects: true,
      },
      orderBy: { user: { name: "asc" } },
    })
    return NextResponse.json(profesores)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener profesores" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await canManageTeachers())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { userId } = await req.json()
    const existe = await prisma.teacher.findUnique({ where: { userId } })
    if (existe) return NextResponse.json({ error: "Este usuario ya tiene un perfil de profesor" }, { status: 400 })

    const profesor = await prisma.teacher.create({ data: { userId } })
    return NextResponse.json(profesor)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al registrar profesor" }, { status: 500 })
  }
}