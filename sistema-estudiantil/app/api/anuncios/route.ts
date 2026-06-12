import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, canManageAnnouncements } from "@/lib/authz"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const anuncios = await prisma.announcement.findMany({
      include: {
        author: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(anuncios)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener anuncios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user || !(await canManageAnnouncements())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, isPublic } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Título y contenido son obligatorios" }, { status: 400 })
    }

    const anuncio = await prisma.announcement.create({
      data: {
        title,
        content,
        isPublic: isPublic ?? true,
        authorId: user.id
      },
      include: {
        author: { select: { name: true, role: true } }
      }
    })

    return NextResponse.json(anuncio, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al crear anuncio" }, { status: 500 })
  }
}