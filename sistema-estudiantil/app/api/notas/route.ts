import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

export async function GET() {
  try {
    const notas = await prisma.grade.findMany({
      include: {
        student: { include: { user: true } },
        subject: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(notas)
  } catch {
    return NextResponse.json({ error: "Error al obtener notas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { studentId, subjectId, score, period, comment } = await req.json()
    if (!studentId || !subjectId || score === undefined || !period) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
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
    return NextResponse.json(nota, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear nota" }, { status: 500 })
  }
}