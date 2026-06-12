import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import dynamic from "next/dynamic"

const ReportesClient = dynamic(() => import("./ReportesClient"), {
  ssr: false,
  loading: () => <div className="p-6 text-center text-gray-500">Cargando gráficos y reportes...</div>
})

export default async function ReportesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = (session.user as any)?.role || ""
  if (role !== "ADMIN" && role !== "SUPPORT") {
    redirect("/dashboard")
  }

  const [estudiantes, notas, asistencias, materias] = await Promise.all([
    prisma.student.findMany({
      include: {
        user: true,
      },
    }),
    prisma.grade.findMany({
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    }),
    prisma.attendance.findMany({
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    }),
    prisma.subject.findMany(),
  ])

  // Formatear datos para el componente de cliente
  const studentsFormatted = estudiantes.map((e) => ({
    id: e.id,
    name: e.user.name,
    email: e.user.email,
    career: e.career,
    cycle: e.cycle,
  }))

  const gradesFormatted = notas.map((g) => ({
    id: g.id,
    studentName: g.student.user.name,
    career: g.student.career,
    cycle: g.student.cycle,
    subjectName: g.subject.name,
    score: g.score,
    period: g.period,
    date: g.createdAt.toISOString().split("T")[0],
  }))

  const attendanceFormatted = asistencias.map((a) => ({
    id: a.id,
    studentName: a.student.user.name,
    career: a.student.career,
    cycle: a.student.cycle,
    subjectName: a.subject.name,
    status: a.status,
    date: a.date.toISOString().split("T")[0],
  }))

  const subjectsFormatted = materias.map((m) => ({
    id: m.id,
    name: m.name,
    career: m.career,
  }))

  return (
    <ReportesClient
      estudiantes={studentsFormatted}
      notas={gradesFormatted}
      asistencias={attendanceFormatted}
      materias={subjectsFormatted}
    />
  )
}
