import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageEvents } from "@/lib/authz"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await canManageEvents())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, type, date, dueDate, subjectId } = body

    const eventData: any = {
      title,
      description: description || null,
      type,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
    }

    if (subjectId !== undefined) {
      eventData.subjectId = subjectId || null
    }

    const evento = await prisma.academicEvent.update({
      where: { id },
      data: eventData,
      include: {
        subject: { select: { name: true } }
      }
    })

    return NextResponse.json(evento)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await canManageEvents())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    await prisma.academicEvent.delete({ where: { id } })

    return NextResponse.json({ message: "Evento eliminado" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 })
  }
}