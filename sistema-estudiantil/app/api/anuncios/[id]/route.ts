import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/authz"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, content, isPublic } = body

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 })
    }

    // Teachers can only modify their own announcements
    if (user.role === "TEACHER" && announcement.authorId !== user.id) {
      return NextResponse.json({ error: "No autorizado para modificar este anuncio" }, { status: 403 })
    }

    const anuncio = await prisma.announcement.update({
      where: { id },
      data: { title, content, isPublic },
      include: {
        author: { select: { name: true, role: true } }
      }
    })

    return NextResponse.json(anuncio)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al actualizar anuncio" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 })
    }

    // Teachers can only delete their own announcements
    if (user.role === "TEACHER" && announcement.authorId !== user.id) {
      return NextResponse.json({ error: "No autorizado para eliminar este anuncio" }, { status: 403 })
    }

    await prisma.announcement.delete({ where: { id } })

    return NextResponse.json({ message: "Anuncio eliminado" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar anuncio" }, { status: 500 })
  }
}