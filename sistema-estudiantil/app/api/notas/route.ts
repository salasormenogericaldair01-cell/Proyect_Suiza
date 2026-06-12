import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/authz"
import { logActivity } from "@/lib/activity-log"

async function generarMensajeIA(score: number, materia: string, estudiante: string): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: `Eres un asistente educativo. El estudiante ${estudiante} obtuvo ${score} puntos de 20 en la materia ${materia}. ${score >= 13 ? "Felicítalo porque aprobó." : "Motívalo porque desaprobó, la nota mínima es 13."} Escribe exactamente 1 oración corta en español.`
          }
        ]
      })
    })
    const data = await res.json()
    console.log("Groq response:", JSON.stringify(data))
    return data.choices?.[0]?.message?.content ?? ""
  } catch (e) {
    console.error("Error IA:", e)
    return ""
  }
}

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

    let notas = []

    if (user.role === "ADMIN" || user.role === "SUPPORT") {
      notas = await prisma.grade.findMany({
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { createdAt: "desc" },
        ...pagination,
      })
    } else if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
      }
      notas = await prisma.grade.findMany({
        where: {
          subject: { teacherId: teacher.id }
        },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { createdAt: "desc" },
        ...pagination,
      })
    } else if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      })
      if (!student) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }
      notas = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { createdAt: "desc" },
        ...pagination,
      })
    } else if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id }
      })
      if (!parent) {
        return NextResponse.json({ error: "Apoderado no encontrado" }, { status: 404 })
      }
      notas = await prisma.grade.findMany({
        where: {
          student: { parentId: parent.id }
        },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
        orderBy: { createdAt: "desc" },
        ...pagination,
      })
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(notas)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener notas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { studentId, subjectId, score, period, comment } = await req.json()
    if (!studentId || !subjectId || score === undefined || !period) {
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
        return NextResponse.json({ error: "No autorizado para registrar notas en esta materia" }, { status: 403 })
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        parent: { include: { user: true } },
      },
    })
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })

    const aiMessage = await generarMensajeIA(score, subject?.name ?? "la materia", student?.user.name ?? "el estudiante")

    const nota = await prisma.grade.create({
      data: { studentId, subjectId, score, period, comment, aiMessage },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    })

    await logActivity(user.id, `CREACION_NOTA: estudiante ${student?.user.name}, materia ${subject?.name}, nota ${score}`, "grades", nota.id)

    // Enviar notificaciones por correo de manera asíncrona
    if (student?.user.email) {
      const { sendNewGradeEmail, sendLowGradeAlertEmail } = await import("@/lib/mailer")
      sendNewGradeEmail(student.user.email, student.user.name, subject?.name ?? "la materia", score, comment || undefined)
      if (score < 13) {
        sendLowGradeAlertEmail(student.user.email, student.user.name, subject?.name ?? "la materia", score)
      }

      if (student.parent?.user.email) {
        sendNewGradeEmail(student.parent.user.email, student.user.name, subject?.name ?? "la materia", score, comment || undefined)
        if (score < 13) {
          sendLowGradeAlertEmail(student.parent.user.email, student.user.name, subject?.name ?? "la materia", score)
        }
      }
    }

    return NextResponse.json(nota, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al crear nota" }, { status: 500 })
  }
}