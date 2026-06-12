import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/authz"
import { logActivity } from "@/lib/activity-log"

export async function GET(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "")
    const limit = parseInt(url.searchParams.get("limit") || "")
    let pagination = {}
    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      pagination = {
        skip: (page - 1) * limit,
        take: limit,
      }
    }

    let asistencias = []

    if (user.role === "ADMIN" || user.role === "SUPPORT") {
      asistencias = await prisma.attendance.findMany({
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { date: "desc" },
        ...pagination,
      })
    } else if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
      }
      asistencias = await prisma.attendance.findMany({
        where: {
          subject: { teacherId: teacher.id }
        },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { date: "desc" },
        ...pagination,
      })
    } else if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      })
      if (!student) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }
      asistencias = await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { date: "desc" },
        ...pagination,
      })
    } else if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id }
      })
      if (!parent) {
        return NextResponse.json({ error: "Apoderado no encontrado" }, { status: 404 })
      }
      asistencias = await prisma.attendance.findMany({
        where: {
          student: { parentId: parent.id }
        },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { date: "desc" },
        ...pagination,
      })
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(asistencias)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener asistencias" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { studentId, subjectId, date, status, note } = await req.json()
    if (!studentId || !subjectId || !date || !status) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
      }
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      })
      if (!subject || subject.teacherId !== teacher.id) {
        return NextResponse.json({ error: "No autorizado para registrar asistencia en esta materia" }, { status: 403 })
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        parent: { include: { user: true } },
      }
    })
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    })

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

    await logActivity(user.id, `CREACION_ASISTENCIA: estudiante ${student?.user.name}, materia ${subject?.name}, estado ${status}, fecha ${date}`, "attendance", asistencia.id)

    // Enviar notificaciones de asistencia por correo si no es PRESENT
    if (status !== "PRESENT" && student?.user.email) {
      const { sendAttendanceAlertEmail } = await import("@/lib/mailer")
      const formattedDate = new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
      sendAttendanceAlertEmail(student.user.email, student.user.name, subject?.name ?? "la materia", formattedDate, status)

      if (student.parent?.user.email) {
        sendAttendanceAlertEmail(student.parent.user.email, student.user.name, subject?.name ?? "la materia", formattedDate, status)
      }
    }

    return NextResponse.json(asistencia, { status: 201 })
  } catch (e) {
    console.error(e)
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro para ese estudiante, materia y fecha" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al registrar asistencia" }, { status: 500 })
  }
}