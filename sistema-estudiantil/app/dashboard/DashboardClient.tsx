"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import {
  Users, GraduationCap, BookOpen, ClipboardList, TrendingUp, AlertTriangle, Activity
} from "lucide-react"

type Props = {
  userName: string
  stats: {
    totalEstudiantes: number
    totalProfesores: number
    totalMaterias: number
    totalUsuarios: number
  }
  notasRecientes: { estudiante: string; materia: string; nota: number; fecha: string }[]
  todasLasNotas: { materia: string; nota: number }[]
}

function promediosPorMateria(notas: { materia: string; nota: number }[]) {
  const mapa: Record<string, { suma: number; count: number }> = {}
  for (const n of notas) {
    if (!mapa[n.materia]) mapa[n.materia] = { suma: 0, count: 0 }
    mapa[n.materia].suma += n.nota
    mapa[n.materia].count += 1
  }
  return Object.entries(mapa).map(([materia, { suma, count }]) => ({
    materia: materia.length > 15 ? materia.substring(0, 13) + "..." : materia,
    promedio: parseFloat((suma / count).toFixed(1)),
  }))
}

function colorNotaBadge(nota: number) {
  if (nota >= 13) return "bg-green-100 text-green-700 border border-green-200"
  if (nota >= 10) return "bg-yellow-100 text-yellow-700 border border-yellow-200"
  return "bg-red-100 text-red-700 border border-red-200"
}

export default function DashboardClient({ userName, stats, notasRecientes, todasLasNotas }: Props) {
  const promedios = promediosPorMateria(todasLasNotas)

  // Cálculos adicionales para un Dashboard más completo
  const totalCalificaciones = todasLasNotas.length
  const promedioGeneral = totalCalificaciones > 0
    ? (todasLasNotas.reduce((acc, n) => acc + n.nota, 0) / totalCalificaciones).toFixed(1)
    : "—"
  const notasBajas = todasLasNotas.filter(n => n.nota < 13).length

  const tarjetas = [
    { label: "Estudiantes", value: stats.totalEstudiantes, icon: GraduationCap, color: "from-blue-500 to-indigo-600", lightBg: "bg-blue-50" },
    { label: "Profesores", value: stats.totalProfesores, icon: Users, color: "from-emerald-400 to-teal-600", lightBg: "bg-emerald-50" },
    { label: "Materias", value: stats.totalMaterias, icon: BookOpen, color: "from-purple-500 to-pink-600", lightBg: "bg-purple-50" },
    { label: "Usuarios del Sistema", value: stats.totalUsuarios, icon: ClipboardList, color: "from-amber-400 to-orange-600", lightBg: "bg-amber-50" },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <GraduationCap size={320} />
        </div>
        <div className="relative z-10 space-y-2">
          <p className="text-blue-200 text-xs font-bold tracking-widest uppercase">IESTP SUIZA — PUCALLPA</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido, {userName} 👋</h1>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Panel de administración centralizado. Supervise el desempeño de los estudiantes, gestione materias y configure el acceso del personal.
          </p>
        </div>
      </div>

      {/* Grid de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex items-center justify-between hover:shadow-md transition-all duration-350 transform hover:-translate-y-0.5 group">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">{t.label}</p>
              <p className="text-3xl font-extrabold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">{t.value}</p>
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${t.color} text-white shadow-md`}>
              <t.icon size={22} className="stroke-[2px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Sección intermedia: Gráfico y Resumen Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800">Rendimiento por Materia</h2>
              <p className="text-xs text-gray-400">Promedio general de notas registradas</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">Oficial</span>
          </div>
          {promedios.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm italic">
              Aún no hay calificaciones cargadas en el sistema.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={promedios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="materia" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                  itemStyle={{ color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="promedio" fill="#2563eb" radius={[6, 6, 0, 0]} name="Promedio" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumen rápido / Analytics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 border-b pb-3">Resumen de Notas</h2>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Promedio General</p>
                  <p className="text-base font-bold text-gray-850">{promedioGeneral}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Notas Desaprobadas (&lt; 13)</p>
                  <p className="text-base font-bold text-gray-850">{notasBajas} calificaciones</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Calificaciones Evaluadas</p>
                  <p className="text-base font-bold text-gray-850">{totalCalificaciones} total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mt-4 text-xs text-gray-500 border border-dashed border-gray-200">
            Consejo: Puede generar informes detallados para impresión en PDF desde el menú lateral de <strong>Reportes</strong>.
          </div>
        </div>
      </div>

      {/* Últimas Notas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-800 border-b pb-3">Últimas Calificaciones Registradas</h2>
        {notasRecientes.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No hay registros de calificaciones recientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 font-semibold border-b">
                  <th className="pb-3 px-4">Estudiante</th>
                  <th className="pb-3 px-4">Materia</th>
                  <th className="pb-3 px-4">Calificación</th>
                  <th className="pb-3 px-4 text-right">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notasRecientes.map((n, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-800 font-semibold">{n.estudiante}</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{n.materia}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorNotaBadge(n.nota)}`}>
                        {n.nota}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-right">{n.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}