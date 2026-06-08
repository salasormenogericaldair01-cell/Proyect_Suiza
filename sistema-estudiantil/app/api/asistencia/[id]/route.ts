import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status, note } = await req.json()
    const asistencia = await prisma.attendance.update({
      where: { id },
      data: { status, note },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })
    return NextResponse.json(asistencia)
  } catch {
    return NextResponse.json({ error: "Error al actualizar asistencia" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.attendance.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar asistencia" }, { status: 500 })
  }
}