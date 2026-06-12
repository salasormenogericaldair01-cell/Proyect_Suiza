import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageTeachers } from "@/lib/authz"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await canManageTeachers())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    await prisma.teacher.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al eliminar profesor" }, { status: 500 })
  }
}