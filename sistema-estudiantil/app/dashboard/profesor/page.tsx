"use client"

import { useEffect, useState, useCallback } from "react"
import { BookOpen, Users, FileText, CheckSquare } from "lucide-react"

interface Materia {
  id: string
  name: string
  career: string | null
  totalNotas: number
  totalAsistencias: number
}

interface Resumen {
  totalMaterias: number
  totalNotas: number
  totalAsistencias: number
  totalEstudiantes: number
  materias: Materia[]
}

export default function ProfesorPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [nombreProfesor, setNombreProfesor] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resRes, sesRes] = await Promise.all([
        fetch("/api/profesor/resumen"),
        fetch("/api/auth/session")
      ])
      const resData = await resRes.json()
      const sesData = await sesRes.json()
      setResumen(resData)
      setNombreProfesor(sesData?.user?.name || "Profesor")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Cargando panel...</div>
    )
  }

  if (!resumen) {
    return (
      <div className="p-6 text-center text-red-500">Error al cargar el panel.</div>
    )
  }

  const tarjetas = [
    { label: "Mis Materias", value: resumen.totalMaterias, icon: BookOpen, color: "bg-blue-500" },
    { label: "Mis Estudiantes", value: resumen.totalEstudiantes, icon: Users, color: "bg-green-500" },
    { label: "Notas Registradas", value: resumen.totalNotas, icon: FileText, color: "bg-purple-500" },
    { label: "Asistencias", value: resumen.totalAsistencias, icon: CheckSquare, color: "bg-orange-500" },
  ]

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {nombreProfesor} 👋
        </h1>
        <p className="text-sm text-gray-500">Panel docente — resumen de tus actividades</p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tarjetas.map((t) => {
          const Icon = t.icon
          return (
            <div key={t.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
              <div className={`${t.color} p-3 rounded-xl`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.label}</p>
                <p className="text-2xl font-bold text-gray-800">{t.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla de materias */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">Mis Materias</h2>
          <p className="text-sm text-gray-500">Resumen de actividad por materia</p>
        </div>
        {resumen.materias.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No tienes materias asignadas aún.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Materia</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Carrera</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Notas registradas</th>
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Asistencias</th>
              </tr>
            </thead>
            <tbody>
              {resumen.materias.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-3 text-gray-800 font-medium">{m.name}</td>
                  <td className="px-6 py-3 text-gray-600">{m.career || "—"}</td>
                  <td className="px-6 py-3 text-gray-800">{m.totalNotas}</td>
                  <td className="px-6 py-3 text-gray-800">{m.totalAsistencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}