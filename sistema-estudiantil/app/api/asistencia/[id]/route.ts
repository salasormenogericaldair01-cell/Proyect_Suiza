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
    const { status, note } = await req.json()

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { subject: true, student: { include: { user: true } } }
    })

    if (!attendance) {
      return NextResponse.json({ error: "Registro de asistencia no encontrado" }, { status: 404 })
    }

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher || attendance.subject.teacherId !== teacher.id) {
        return NextResponse.json({ error: "No autorizado para modificar esta asistencia" }, { status: 403 })
      }
    }

    const asistencia = await prisma.attendance.update({
      where: { id },
      data: { status, note },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })

    await logActivity(user.id, `MODIFICACION_ASISTENCIA: estudiante ${asistencia.student.user.name}, materia ${asistencia.subject.name}, nuevo estado ${status}`, "attendance", id)

    return NextResponse.json(asistencia)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al actualizar asistencia" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { subject: true, student: { include: { user: true } } }
    })

    if (!attendance) {
      return NextResponse.json({ error: "Registro de asistencia no encontrado" }, { status: 404 })
    }

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher || attendance.subject.teacherId !== teacher.id) {
        return NextResponse.json({ error: "No autorizado para eliminar esta asistencia" }, { status: 403 })
      }
    }

    await prisma.attendance.delete({ where: { id } })

    await logActivity(user.id, `ELIMINACION_ASISTENCIA: estudiante ${attendance.student.user.name}, materia ${attendance.subject.name}`, "attendance", id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar asistencia" }, { status: 500 })
  }
}