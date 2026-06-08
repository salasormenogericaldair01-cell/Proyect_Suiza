import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        subjects: {
          include: {
            grades: true,
            attendance: true,
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
    }

    const totalMaterias = teacher.subjects.length
    const totalNotas = teacher.subjects.reduce((acc, s) => acc + s.grades.length, 0)
    const totalAsistencias = teacher.subjects.reduce((acc, s) => acc + s.attendance.length, 0)

    // Estudiantes únicos en todas sus materias
    const estudiantesIds = new Set<string>()
    teacher.subjects.forEach(s => {
      s.grades.forEach(g => estudiantesIds.add(g.studentId))
      s.attendance.forEach(a => estudiantesIds.add(a.studentId))
    })

    return NextResponse.json({
      totalMaterias,
      totalNotas,
      totalAsistencias,
      totalEstudiantes: estudiantesIds.size,
      materias: teacher.subjects.map(s => ({
        id: s.id,
        name: s.name,
        career: s.career,
        totalNotas: s.grades.length,
        totalAsistencias: s.attendance.length,
      }))
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al obtener resumen" }, { status: 500 })
  }
}