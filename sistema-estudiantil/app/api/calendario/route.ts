import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, canManageEvents } from "@/lib/authz"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const eventos = await prisma.academicEvent.findMany({
      include: {
        subject: { select: { name: true } }
      },
      orderBy: { date: "asc" }
    })
    return NextResponse.json(eventos)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await canManageEvents())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, type, date, dueDate, subjectId } = body

    if (!title || !type || !date) {
      return NextResponse.json({ error: "Título, tipo y fecha son obligatorios" }, { status: 400 })
    }

    const eventData: any = {
      title,
      description: description || null,
      type,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
    }

    if (subjectId) {
      eventData.subjectId = subjectId
    }

    const evento = await prisma.academicEvent.create({
      data: eventData,
      include: {
        subject: { select: { name: true } }
      }
    })

    return NextResponse.json(evento, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 })
  }
}