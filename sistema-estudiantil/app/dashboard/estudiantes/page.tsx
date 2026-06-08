"use client"

import { useEffect, useState } from "react"
import { UserPlus, Pencil, Trash2 } from "lucide-react"

const CARRERAS = [
  "Enfermería Técnica",
  "Electricidad Industrial",
  "Desarrollo de Sistemas de Información",
  "Construcción Civil",
  "Contabilidad",
  "Asistencia Administrativa",
  "Administración de Operaciones Turísticas",
  "Administración de Empresas",
  "Producción Agropecuaria",
  "Mecatrónica Automotriz",
  "Manejo Forestal",
]

const CICLOS = ["I", "II", "III", "IV", "V", "VI"]

type Estudiante = {
  id: string
  career: string
  cycle: string
  studentCode: string | null
  user: { name: string; email: string }
  parent: { user: { name: string } } | null
}

type Usuario = {
  id: string
  name: string
  email: string
  role: string
}

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [estudianteEditar, setEstudianteEditar] = useState<Estudiante | null>(null)
  const [form, setForm] = useState({ userId: "", parentId: "", career: "", cycle: "", studentCode: "" })
  const [formEdit, setFormEdit] = useState({ parentId: "", career: "", cycle: "", studentCode: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const cargar = async () => {
    setLoading(true)
    const [e, u] = await Promise.all([
      fetch("/api/estudiantes").then(r => r.json()),
      fetch("/api/usuarios").then(r => r.json()),
    ])
    setEstudiantes(e)
    setUsuarios(u)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const usuariosSinEstudiante = usuarios.filter(
    u => u.role === "STUDENT" && !estudiantes.some(e => e.user.email === u.email)
  )

  const padres = usuarios.filter(u => u.role === "PARENT")

  const handleCrear = async () => {
    setError("")
    if (!form.userId || !form.career || !form.cycle) {
      setError("Usuario, carrera y ciclo son obligatorios")
      return
    }
    const res = await fetch("/api/estudiantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Estudiante registrado correctamente")
      setForm({ userId: "", parentId: "", career: "", cycle: "", studentCode: "" })
      setShowModal(false)
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al registrar estudiante")
    }
  }

  const handleEditar = async () => {
    if (!estudianteEditar) return
    setError("")
    const res = await fetch(`/api/estudiantes/${estudianteEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdit),
    })
    if (res.ok) {
      setSuccess("Estudiante actualizado correctamente")
      setShowEditModal(false)
      cargar()
    } else {
      setError("Error al actualizar estudiante")
    }
  }

  const handleEliminar = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a ${name}?`)) return
    await fetch(`/api/estudiantes/${id}`, { method: "DELETE" })
    setSuccess("Estudiante eliminado")
    cargar()
  }

  const abrirEditar = (e: Estudiante) => {
    setEstudianteEditar(e)
    setFormEdit({ parentId: "", career: e.career, cycle: e.cycle, studentCode: e.studentCode ?? "" })
    setError("")
    setShowEditModal(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Estudiantes</h1>
          <p className="text-gray-500 text-sm mt-1">Registra y administra los estudiantes del instituto</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError("") }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus size={18} /> Nuevo estudiante
        </button>
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando estudiantes...</p>
        ) : estudiantes.length === 0 ? (
          <p className="p-6 text-gray-400">No hay estudiantes registrados.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Carrera</th>
                <th className="px-6 py-3">Ciclo</th>
                <th className="px-6 py-3">Padre/Tutor</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{e.user.name}</td>
                  <td className="px-6 py-3 text-gray-500">{e.user.email}</td>
                  <td className="px-6 py-3 text-gray-700">{e.career}</td>
                  <td className="px-6 py-3 text-gray-700">{e.cycle}</td>
                  <td className="px-6 py-3 text-gray-500">{e.parent?.user.name ?? "Sin asignar"}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => abrirEditar(e)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleEliminar(e.id, e.user.name)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
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
            <h2 className="text-lg font-bold text-gray-800">Nuevo Estudiante</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Seleccionar usuario estudiante</option>
              {usuariosSinEstudiante.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
              <option value="">Seleccionar ciclo</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Seleccionar padre/tutor (opcional)</option>
              {padres.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código de estudiante (opcional)" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Registrar</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showEditModal && estudianteEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Editar — {estudianteEditar.user.name}</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.career} onChange={(e) => setFormEdit({ ...formEdit, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.cycle} onChange={(e) => setFormEdit({ ...formEdit, cycle: e.target.value })}>
              <option value="">Seleccionar ciclo</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.parentId} onChange={(e) => setFormEdit({ ...formEdit, parentId: e.target.value })}>
              <option value="">Sin padre/tutor</option>
              {padres.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código de estudiante" value={formEdit.studentCode} onChange={(e) => setFormEdit({ ...formEdit, studentCode: e.target.value })} />
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