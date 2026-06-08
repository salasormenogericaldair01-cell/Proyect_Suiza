import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const estudiantes = await prisma.student.findMany({
    include: {
      user: true,
      parent: { include: { user: true } },
    },
    orderBy: { user: { name: "asc" } },
  })
  return NextResponse.json(estudiantes)
}

export async function POST(req: Request) {
  const { userId, parentId, career, cycle, studentCode } = await req.json()
  const existe = await prisma.student.findUnique({ where: { userId } })
  if (existe) return NextResponse.json({ error: "Este usuario ya tiene un perfil de estudiante" }, { status: 400 })

  let parentDbId: string | null = null
  if (parentId) {
    const padre = await prisma.parent.findUnique({ where: { userId: parentId } })
    if (padre) parentDbId = padre.id
  }

  const estudiante = await prisma.student.create({
    data: {
      userId,
      career,
      cycle,
      studentCode: studentCode || null,
      parentId: parentDbId,
    },
  })
  return NextResponse.json(estudiante)
}