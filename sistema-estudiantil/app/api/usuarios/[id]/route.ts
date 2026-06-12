import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageUsers, canDeleteUser } from "@/lib/authz"
import { Role } from "@prisma/client"
import { z } from "zod"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canManageUsers())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const parsed = z.object({
    isActive: z.boolean().optional(),
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    role: z.nativeEnum(Role).optional(),
  }).safeParse(await req.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { isActive, name, email, role } = parsed.data
  const usuario = await prisma.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })
  return NextResponse.json(usuario)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canDeleteUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
