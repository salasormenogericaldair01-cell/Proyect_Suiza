import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageSubjects } from "@/lib/authz"
import { deleteCache } from "@/lib/cache"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await canManageSubjects())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const { name, code, career, teacherId } = await req.json()
    const materia = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code: code || null,
        career: career || null,
        teacherId: teacherId || null,
      },
    })

    // Invalidador de caché
    deleteCache("subjects:all")
    if (teacherId) deleteCache(`subjects:teacher:${teacherId}`)

    return NextResponse.json(materia)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al actualizar materia" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await canManageSubjects())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    
    // Buscar la materia antes de eliminar para obtener el teacherId e invalidar su caché
    const subject = await prisma.subject.findUnique({ where: { id } })

    await prisma.subject.delete({ where: { id } })

    deleteCache("subjects:all")
    if (subject?.teacherId) {
      deleteCache(`subjects:teacher:${subject.teacherId}`)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar materia" }, { status: 500 })
  }
}