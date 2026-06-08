import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, code, career, teacherId } = await req.json()
  const materia = await prisma.subject.update({
    where: { id },
    data: {
      name,
      code: code || null,
      career: career || null,
      teacherId: teacherId || undefined,
    },
  })
  return NextResponse.json(materia)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.subject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}