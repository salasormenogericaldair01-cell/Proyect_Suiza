import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, type, date, dueDate, subjectId } = body

    const evento = await prisma.academicEvent.update({
      where: { id },
      data: {
        title,
        description: description || null,
        type,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subjectId: subjectId || null
      },
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    await prisma.academicEvent.delete({ where: { id } })

    return NextResponse.json({ message: "Evento eliminado" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 })
  }
}