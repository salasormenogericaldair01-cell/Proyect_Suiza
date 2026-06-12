import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GraduationCap, FileText, CheckSquare, Calendar, Sparkles } from "lucide-react"

function colorNota(score: number) {
  if (score >= 13) return "bg-green-100 text-green-700 font-bold"
  if (score >= 10) return "bg-yellow-100 text-yellow-700 font-bold"
  return "bg-red-100 text-red-700 font-bold"
}

function labelEstado(status: string) {
  const map: Record<string, string> = {
    PRESENT: "Presente",
    ABSENT: "Ausente",
    LATE: "Tardanza",
    EXCUSED: "Justificado",
  }
  return map[status] ?? status
}

function colorEstado(status: string) {
  const map: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

export default async function EstudiantePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Obtener datos del estudiante, notas y asistencia
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      grades: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      attendance: {
        include: { subject: true },
        orderBy: { date: "desc" },
      },
    },
  })

  if (!student) {
    return (
      <div className="p-6 text-center text-red-500">
        Perfil de estudiante no encontrado. Por favor, contacte al administrador.
      </div>
    )
  }

  // Calcular estadísticas simples
  const totalNotas = student.grades.length
  const promedio = totalNotas > 0 
    ? (student.grades.reduce((acc, g) => acc + g.score, 0) / totalNotas).toFixed(1)
    : "—"
  
  const totalClases = student.attendance.length
  const asistenciasRealizadas = student.attendance.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const porcentajeAsistencia = totalClases > 0
    ? Math.round((asistenciasRealizadas / totalClases) * 100)
    : "—"

  return (
    <div className="p-6 space-y-8">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Panel del Estudiante</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">¡Hola, {session.user.name}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">
            Revisa tu progreso académico en la carrera de <span className="font-semibold text-blue-600">{student.career}</span> (Ciclo {student.cycle}).
          </p>
        </div>
        <div className="text-right sm:text-left md:text-right">
          <p className="text-xs text-gray-400">Código de Estudiante</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5 bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
            {student.studentCode ?? "No asignado"}
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Calificación Promedio</p>
            <p className="text-xl font-bold text-gray-850">{promedio}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-xl text-white">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Calificaciones Registradas</p>
            <p className="text-xl font-bold text-gray-850">{totalNotas}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-500 p-3 rounded-xl text-white">
            <CheckSquare size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Porcentaje de Asistencia</p>
            <p className="text-xl font-bold text-gray-850">{porcentajeAsistencia !== "—" ? `${porcentajeAsistencia}%` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Secciones de Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Notas */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <FileText className="text-blue-500" size={18} />
            <h3 className="font-semibold text-gray-700">Mis Notas Recientes</h3>
          </div>

          {student.grades.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4">No tienes notas registradas en este período.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {student.grades.map((g) => (
                <div key={g.id} className="p-3.5 border rounded-xl flex items-start justify-between gap-4 hover:bg-gray-50 transition bg-white">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.subject.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {g.period === "TRIMESTER_1" ? "1er Trimestre" :
                       g.period === "TRIMESTER_2" ? "2do Trimestre" :
                       g.period === "TRIMESTER_3" ? "3er Trimestre" : "Examen Final"}
                    </p>
                    {g.aiMessage && (
                      <div className="flex items-start gap-1 mt-1.5 text-[11px] text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                        <Sparkles size={11} className="mt-0.5 shrink-0" />
                        <span>{g.aiMessage}</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs ${colorNota(g.score)}`}>
                    {g.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mi Asistencia */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <CheckSquare className="text-indigo-500" size={18} />
            <h3 className="font-semibold text-gray-700">Mi Registro de Asistencia</h3>
          </div>

          {student.attendance.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4">No hay asistencias registradas para ti.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {student.attendance.map((a) => (
                <div key={a.id} className="p-3.5 border rounded-xl flex items-center justify-between gap-4 hover:bg-gray-50 transition bg-white">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.subject.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <Calendar size={12} />
                      <span>{new Date(a.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                    </div>
                    {a.note && <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-1 rounded">Nota: {a.note}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorEstado(a.status)}`}>
                    {labelEstado(a.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
