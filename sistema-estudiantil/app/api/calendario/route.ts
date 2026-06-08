import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, type, date, dueDate, subjectId } = body

    if (!title || !type || !date) {
      return NextResponse.json({ error: "Título, tipo y fecha son obligatorios" }, { status: 400 })
    }

    const evento = await prisma.academicEvent.create({
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

    return NextResponse.json(evento, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 })
  }
}