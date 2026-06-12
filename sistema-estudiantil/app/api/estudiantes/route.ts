import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, canManageStudents } from "@/lib/authz"

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

    let estudiantes = []

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { subjects: true }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
      }
      const careers = teacher.subjects.map(s => s.career).filter(Boolean) as string[]
      estudiantes = await prisma.student.findMany({
        where: {
          career: { in: careers }
        },
        include: {
          user: true,
          parent: { include: { user: true } },
        },
        orderBy: { user: { name: "asc" } },
        ...pagination,
      })
    } else if (user.role === "ADMIN" || user.role === "SUPPORT") {
      estudiantes = await prisma.student.findMany({
        include: {
          user: true,
          parent: { include: { user: true } },
        },
        orderBy: { user: { name: "asc" } },
        ...pagination,
      })
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(estudiantes)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener estudiantes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await canManageStudents())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { userId, parentId, career, cycle, studentCode } = await req.json()
    const existe = await prisma.student.findUnique({ where: { userId } })
    if (existe) return NextResponse.json({ error: "Este usuario ya tiene un perfil de estudiante" }, { status: 400 })

    let parentDbId: string | null = null
    if (parentId) {
      const padre = await prisma.parent.findUnique({ where: { userId: parentId } })
      if (padre) parentDbId = padre.id
    }

    const estudiante = await prisma.student.create({
      data: {
        userId,
        career,
        cycle,
        studentCode: studentCode || null,
        parentId: parentDbId,
      },
    })
    return NextResponse.json(estudiante)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al registrar estudiante" }, { status: 500 })
  }
}