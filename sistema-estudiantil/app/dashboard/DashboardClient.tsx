"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  Users, GraduationCap, BookOpen, ClipboardList,
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
    materia,
    promedio: parseFloat((suma / count).toFixed(1)),
  }))
}

function colorNota(nota: number) {
  if (nota >= 15) return "text-green-600 font-bold"
  if (nota >= 11) return "text-yellow-600 font-bold"
  return "text-red-600 font-bold"
}

export default function DashboardClient({ userName, stats, notasRecientes, todasLasNotas }: Props) {
  const promedios = promediosPorMateria(todasLasNotas)

  const tarjetas = [
    { label: "Estudiantes", value: stats.totalEstudiantes, icon: GraduationCap, color: "bg-blue-500" },
    { label: "Profesores", value: stats.totalProfesores, icon: Users, color: "bg-green-500" },
    { label: "Materias", value: stats.totalMaterias, icon: BookOpen, color: "bg-purple-500" },
    { label: "Usuarios totales", value: stats.totalUsuarios, icon: ClipboardList, color: "bg-orange-500" },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {userName} 👋</h1>
        <p className="text-gray-500 mt-1">Panel de Administración — resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className={`${t.color} text-white p-3 rounded-lg`}>
              <t.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t.label}</p>
              <p className="text-2xl font-bold text-gray-800">{t.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Promedio por materia</h2>
        {promedios.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay notas registradas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={promedios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="materia" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="promedio" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Promedio" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Últimas notas registradas</h2>
        {notasRecientes.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay notas registradas.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="pb-2">Estudiante</th>
                <th className="pb-2">Materia</th>
                <th className="pb-2">Nota</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {notasRecientes.map((n, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{n.estudiante}</td>
                  <td className="py-2 text-gray-800">{n.materia}</td>
                  <td className={`py-2 ${colorNota(n.nota)}`}>{n.nota}</td>
                  <td className="py-2 text-gray-600">{n.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}