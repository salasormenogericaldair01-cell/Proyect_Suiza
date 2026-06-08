import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const materias = await prisma.subject.findMany({
    include: { teacher: { include: { user: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(materias)
}

export async function POST(req: Request) {
  const { name, code, career, teacherId } = await req.json()
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  const materia = await prisma.subject.create({
    data: {
      name,
      code: code || null,
      career: career || null,
      teacherId: teacherId || undefined,
    },
  })
  return NextResponse.json(materia)
}