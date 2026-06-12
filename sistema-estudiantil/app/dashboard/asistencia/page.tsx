"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

const ESTADOS = [
  { value: "PRESENT", label: "Presente", color: "bg-green-100 text-green-700" },
  { value: "ABSENT", label: "Ausente", color: "bg-red-100 text-red-700" },
  { value: "LATE", label: "Tardanza", color: "bg-yellow-100 text-yellow-700" },
  { value: "EXCUSED", label: "Justificado", color: "bg-blue-100 text-blue-700" },
]

type Asistencia = {
  id: string
  date: string
  status: string
  note: string | null
  student: { id: string; user: { name: string }; career: string }
  subject: { id: string; name: string }
}

type Estudiante = {
  id: string
  user: { name: string }
  career: string
}

type Materia = {
  id: string
  name: string
}

function colorEstado(status: string) {
  return ESTADOS.find(e => e.value === status)?.color ?? "bg-gray-100 text-gray-700"
}

function labelEstado(status: string) {
  return ESTADOS.find(e => e.value === status)?.label ?? status
}

export default function AsistenciaPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [asistenciaEditar, setAsistenciaEditar] = useState<Asistencia | null>(null)
  const [form, setForm] = useState({ studentId: "", subjectId: "", date: "", status: "PRESENT", note: "" })
  const [formEdit, setFormEdit] = useState({ status: "PRESENT", note: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [userRole, setUserRole] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const sesRes = await fetch("/api/auth/session").then(r => r.json())
      const role = sesRes?.user?.role || ""
      setUserRole(role)

      const a = await fetch("/api/asistencia").then(r => r.json())
      setAsistencias(Array.isArray(a) ? a : [])

      if (role === "ADMIN" || role === "TEACHER") {
        const [e, m] = await Promise.all([
          fetch("/api/estudiantes").then(r => r.json()),
          fetch("/api/materias").then(r => r.json()),
        ])
        setEstudiantes(Array.isArray(e) ? e : [])
        setMaterias(Array.isArray(m) ? m : [])
      }
    } catch (err) {
      console.error("Error al cargar asistencia:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const asistenciasFiltradas = filtroEstado
    ? asistencias.filter(a => a.status === filtroEstado)
    : asistencias

  const handleCrear = async () => {
    setError("")
    if (!form.studentId || !form.subjectId || !form.date || !form.status) {
      setError("Todos los campos obligatorios deben completarse")
      return
    }
    const res = await fetch("/api/asistencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Asistencia registrada correctamente")
      setForm({ studentId: "", subjectId: "", date: "", status: "PRESENT", note: "" })
      setShowModal(false)
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al registrar asistencia")
    }
  }

  const handleEditar = async () => {
    if (!asistenciaEditar) return
    setError("")
    const res = await fetch(`/api/asistencia/${asistenciaEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdit),
    })
    if (res.ok) {
      setSuccess("Asistencia actualizada correctamente")
      setShowEditModal(false)
      cargar()
    } else {
      setError("Error al actualizar asistencia")
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return
    await fetch(`/api/asistencia/${id}`, { method: "DELETE" })
    setSuccess("Registro eliminado")
    cargar()
  }

  const abrirEditar = (a: Asistencia) => {
    setAsistenciaEditar(a)
    setFormEdit({ status: a.status, note: a.note ?? "" })
    setError("")
    setShowEditModal(true)
  }

  const puedeModificar = userRole === "ADMIN" || userRole === "TEACHER"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Asistencia</h1>
          <p className="text-gray-500 text-sm mt-1">Registra y administra la asistencia de los estudiantes</p>
        </div>
        {puedeModificar && (
          <button
            onClick={() => { setShowModal(true); setError("") }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Nueva asistencia
          </button>
        )}
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="flex gap-3 items-center">
        <select
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <span className="text-sm text-gray-500">{asistenciasFiltradas.length} registro(s)</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando asistencias...</p>
        ) : asistenciasFiltradas.length === 0 ? (
          <p className="p-6 text-gray-400">No hay registros de asistencia.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Estudiante</th>
                <th className="px-6 py-3">Materia</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Nota</th>
                {puedeModificar && <th className="px-6 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {asistenciasFiltradas.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{a.student.user.name}</td>
                  <td className="px-6 py-3 text-gray-600">{a.subject.name}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(a.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(a.status)}`}>
                      {labelEstado(a.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{a.note ?? "—"}</td>
                  {puedeModificar && (
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleEliminar(a.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Nueva Asistencia</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">Seleccionar estudiante</option>
              {estudiantes.map(e => <option key={e.id} value={e.id}>{e.user.name} — {e.career}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Seleccionar materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Observación (opcional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Registrar</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showEditModal && asistenciaEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Editar Asistencia</h2>
            <p className="text-sm text-gray-500">{asistenciaEditar.student.user.name} — {asistenciaEditar.subject.name}</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.status} onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })}>
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Observación (opcional)" value={formEdit.note} onChange={(e) => setFormEdit({ ...formEdit, note: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleEditar} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Guardar cambios</button>
              <button onClick={() => { setShowEditModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}