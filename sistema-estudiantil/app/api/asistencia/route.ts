import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const asistencias = await prisma.attendance.findMany({
      include: {
        student: { include: { user: true } },
        subject: true,
      },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(asistencias)
  } catch {
    return NextResponse.json({ error: "Error al obtener asistencias" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { studentId, subjectId, date, status, note } = await req.json()
    if (!studentId || !subjectId || !date || !status) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }
    const asistencia = await prisma.attendance.create({
      data: {
        studentId,
        subjectId,
        date: new Date(date),
        status,
        note,
      },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })
    return NextResponse.json(asistencia, { status: 201 })
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro para ese estudiante, materia y fecha" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al registrar asistencia" }, { status: 500 })
  }
}