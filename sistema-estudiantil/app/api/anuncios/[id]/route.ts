import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, content, isPublic } = body

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    await prisma.announcement.delete({ where: { id } })

    return NextResponse.json({ message: "Anuncio eliminado" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar anuncio" }, { status: 500 })
  }
}