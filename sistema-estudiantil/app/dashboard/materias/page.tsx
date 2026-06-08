"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

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

type Materia = {
  id: string
  name: string
  code: string | null
  career: string | null
  teacher: { id: string; user: { name: string } } | null
}

type Profesor = {
  id: string
  user: { name: string }
}

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [materiaEditar, setMateriaEditar] = useState<Materia | null>(null)
  const [form, setForm] = useState({ name: "", code: "", career: "", teacherId: "" })
  const [formEdit, setFormEdit] = useState({ name: "", code: "", career: "", teacherId: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filtroCarrera, setFiltroCarrera] = useState("")

  const cargar = async () => {
    setLoading(true)
    const [m, p] = await Promise.all([
      fetch("/api/materias").then(r => r.json()),
      fetch("/api/profesores").then(r => r.json()),
    ])
    setMaterias(m)
    setProfesores(p)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const materiasFiltradas = filtroCarrera
    ? materias.filter(m => m.career === filtroCarrera)
    : materias

  const handleCrear = async () => {
    setError("")
    if (!form.name || !form.career) {
      setError("Nombre y carrera son obligatorios")
      return
    }
    const res = await fetch("/api/materias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Materia creada correctamente")
      setForm({ name: "", code: "", career: "", teacherId: "" })
      setShowModal(false)
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al crear materia")
    }
  }

  const handleEditar = async () => {
    if (!materiaEditar) return
    setError("")
    const res = await fetch(`/api/materias/${materiaEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdit),
    })
    if (res.ok) {
      setSuccess("Materia actualizada correctamente")
      setShowEditModal(false)
      cargar()
    } else {
      setError("Error al actualizar materia")
    }
  }

  const handleEliminar = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${name}"?`)) return
    await fetch(`/api/materias/${id}`, { method: "DELETE" })
    setSuccess("Materia eliminada")
    cargar()
  }

  const abrirEditar = (m: Materia) => {
    setMateriaEditar(m)
    setFormEdit({
      name: m.name,
      code: m.code ?? "",
      career: m.career ?? "",
      teacherId: m.teacher?.id ?? "",
    })
    setError("")
    setShowEditModal(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Materias</h1>
          <p className="text-gray-500 text-sm mt-1">Administra las materias por carrera del instituto</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError("") }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Nueva materia
        </button>
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="flex gap-3 items-center">
        <select
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm"
          value={filtroCarrera}
          onChange={(e) => setFiltroCarrera(e.target.value)}
        >
          <option value="">Todas las carreras</option>
          {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500">{materiasFiltradas.length} materia(s)</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando materias...</p>
        ) : materiasFiltradas.length === 0 ? (
          <p className="p-6 text-gray-400">No hay materias registradas.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Materia</th>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Carrera</th>
                <th className="px-6 py-3">Profesor</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiasFiltradas.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-6 py-3 text-gray-500">{m.code ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      {m.career ?? "Sin carrera"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{m.teacher?.user.name ?? "Sin asignar"}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => abrirEditar(m)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleEliminar(m.id, m.name)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Nueva Materia</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nombre de la materia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código (opcional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Seleccionar profesor (opcional)</option>
              {profesores.map(p => <option key={p.id} value={p.id}>{p.user.name}</option>)}
            </select>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Crear materia</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && materiaEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Editar Materia</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nombre de la materia" value={formEdit.name} onChange={(e) => setFormEdit({ ...formEdit, name: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código (opcional)" value={formEdit.code} onChange={(e) => setFormEdit({ ...formEdit, code: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.career} onChange={(e) => setFormEdit({ ...formEdit, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.teacherId} onChange={(e) => setFormEdit({ ...formEdit, teacherId: e.target.value })}>
              <option value="">Sin profesor asignado</option>
              {profesores.map(p => <option key={p.id} value={p.id}>{p.user.name}</option>)}
            </select>
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