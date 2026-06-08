import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [totalEstudiantes, totalProfesores, totalMaterias, totalUsuarios] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.subject.count(),
    prisma.user.count(),
  ])

  const notasRecientes = await prisma.grade.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      student: { include: { user: true } },
      subject: true,
    },
  })

  const todasLasNotas = await prisma.grade.findMany({
    select: { score: true, subject: { select: { name: true } } },
  })

  return (
    <DashboardClient
      userName={session.user?.name ?? ""}
      stats={{ totalEstudiantes, totalProfesores, totalMaterias, totalUsuarios }}
      notasRecientes={notasRecientes.map((n) => ({
        estudiante: n.student.user.name ?? "",
        materia: n.subject.name,
        nota: n.score,
        fecha: n.createdAt.toISOString().split("T")[0],
      }))}
      todasLasNotas={todasLasNotas.map((n) => ({
        materia: n.subject.name,
        nota: n.score,
      }))}
    />
  )
}