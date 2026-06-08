import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { parentId, career, cycle, studentCode } = await req.json()

  let parentDbId: string | null = null
  if (parentId) {
    const padre = await prisma.parent.findUnique({ where: { userId: parentId } })
    if (padre) parentDbId = padre.id
  }

  const estudiante = await prisma.student.update({
    where: { id },
    data: {
      career,
      cycle,
      studentCode: studentCode || null,
      parentId: parentDbId,
    },
  })
  return NextResponse.json(estudiante)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}