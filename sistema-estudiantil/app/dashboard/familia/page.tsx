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

export default async function FamiliaPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Obtener datos del padre e hijos con notas y asistencia
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
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
      },
    },
  })

  const children = parent?.children ?? []

  return (
    <div className="p-6 space-y-8">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Panel Familiar</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Seguimiento Académico de Hijos 🏫</h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenido, apoderado {session.user.name}. Aquí puedes supervisar las notas y asistencia.</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <GraduationCap className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-700">Sin estudiantes asociados</h3>
          <p className="text-gray-500 text-sm mt-1">No hay ningún estudiante registrado en el sistema que esté vinculado a su cuenta familiar.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Encabezado del Estudiante */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {child.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{child.user.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Código: {child.studentCode ?? "No asignado"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-lg font-semibold">
                    {child.career}
                  </span>
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1.5 rounded-lg font-semibold">
                    Ciclo {child.cycle}
                  </span>
                </div>
              </div>

              {/* Información Académica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Notas del Hijo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <FileText className="text-blue-500" size={18} />
                    <h3 className="font-semibold text-gray-700">Calificaciones Recientes</h3>
                  </div>

                  {child.grades.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4">No hay notas registradas para este estudiante.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto border rounded-xl divide-y bg-gray-50/50">
                      {child.grades.map((g) => (
                        <div key={g.id} className="p-3.5 flex items-start justify-between gap-4 bg-white hover:bg-gray-50 transition">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{g.subject.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {g.period === "TRIMESTER_1" ? "1er Trimestre" :
                               g.period === "TRIMESTER_2" ? "2do Trimestre" :
                               g.period === "TRIMESTER_3" ? "3er Trimestre" : "Examen Final"}
                            </p>
                            {g.aiMessage && (
                              <div className="flex items-start gap-1 mt-1 text-[11px] text-purple-600 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                                <Sparkles size={11} className="mt-0.5 shrink-0" />
                                <span>{g.aiMessage}</span>
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${colorNota(g.score)}`}>
                            {g.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Asistencia del Hijo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <CheckSquare className="text-indigo-500" size={18} />
                    <h3 className="font-semibold text-gray-700">Registro de Asistencia</h3>
                  </div>

                  {child.attendance.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4">No hay registros de asistencia para este estudiante.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto border rounded-xl divide-y bg-gray-50/50">
                      {child.attendance.map((a) => (
                        <div key={a.id} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{a.subject.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                              <Calendar size={12} />
                              <span>{new Date(a.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                            </div>
                            {a.note && <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-1 rounded">Nota: {a.note}</p>}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstado(a.status)}`}>
                            {labelEstado(a.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
