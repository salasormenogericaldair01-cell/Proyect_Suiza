import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/authz"
import { logActivity } from "@/lib/activity-log"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const { score, period, comment } = await req.json()

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: { subject: true, student: { include: { user: true } } }
    })

    if (!grade) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
    }

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher || grade.subject.teacherId !== teacher.id) {
        return NextResponse.json({ error: "No autorizado para modificar esta nota" }, { status: 403 })
      }
    }

    const nota = await prisma.grade.update({
      where: { id },
      data: { score, period, comment },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })

    await logActivity(user.id, `MODIFICACION_NOTA: estudiante ${nota.student.user.name}, materia ${nota.subject.name}, nueva nota ${score}`, "grades", id)

    return NextResponse.json(nota)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al actualizar nota" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: { subject: true, student: { include: { user: true } } }
    })

    if (!grade) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
    }

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher || grade.subject.teacherId !== teacher.id) {
        return NextResponse.json({ error: "No autorizado para eliminar esta nota" }, { status: 403 })
      }
    }

    await prisma.grade.delete({ where: { id } })

    await logActivity(user.id, `ELIMINACION_NOTA: estudiante ${grade.student.user.name}, materia ${grade.subject.name}`, "grades", id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar nota" }, { status: 500 })
  }
}