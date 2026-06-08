import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const profesores = await prisma.teacher.findMany({
    include: {
      user: true,
      subjects: true,
    },
    orderBy: { user: { name: "asc" } },
  })
  return NextResponse.json(profesores)
}

export async function POST(req: Request) {
  const { userId } = await req.json()
  const existe = await prisma.teacher.findUnique({ where: { userId } })
  if (existe) return NextResponse.json({ error: "Este usuario ya tiene un perfil de profesor" }, { status: 400 })

  const profesor = await prisma.teacher.create({ data: { userId } })
  return NextResponse.json(profesor)
}