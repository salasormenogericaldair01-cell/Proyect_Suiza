import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { score, period, comment } = await req.json()
    const nota = await prisma.grade.update({
      where: { id },
      data: { score, period, comment },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })
    return NextResponse.json(nota)
  } catch {
    return NextResponse.json({ error: "Error al actualizar nota" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.grade.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar nota" }, { status: 500 })
  }
}