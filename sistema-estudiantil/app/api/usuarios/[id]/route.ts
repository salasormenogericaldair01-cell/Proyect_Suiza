import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { isActive, name, email, role } = await req.json()
  const usuario = await prisma.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
  })
  return NextResponse.json(usuario)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}