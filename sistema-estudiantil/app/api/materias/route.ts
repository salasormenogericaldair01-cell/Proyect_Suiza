import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, canManageSubjects } from "@/lib/authz"
import { wrapCache, deleteCache } from "@/lib/cache"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let materias = []

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
      }
      const cacheKey = `subjects:teacher:${teacher.id}`
      materias = await wrapCache(cacheKey, async () => {
        return prisma.subject.findMany({
          where: { teacherId: teacher.id },
          include: { teacher: { include: { user: true } } },
          orderBy: { name: "asc" },
        })
      }, 60)
    } else if (user.role === "ADMIN" || user.role === "SUPPORT") {
      const cacheKey = "subjects:all"
      materias = await wrapCache(cacheKey, async () => {
        return prisma.subject.findMany({
          include: { teacher: { include: { user: true } } },
          orderBy: { name: "asc" },
        })
      }, 60)
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(materias)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener materias" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await canManageSubjects())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { name, code, career, teacherId } = await req.json()
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

    const materia = await prisma.subject.create({
      data: {
        name,
        code: code || null,
        career: career || null,
        teacherId: teacherId || null,
      },
    })

    // Invalidar caches relacionadas con materias
    deleteCache("subjects:all")
    if (teacherId) {
      deleteCache(`subjects:teacher:${teacherId}`)
    }

    return NextResponse.json(materia)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al registrar materia" }, { status: 500 })
  }
}