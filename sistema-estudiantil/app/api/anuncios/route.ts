import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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
        authorId: session.user.id
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