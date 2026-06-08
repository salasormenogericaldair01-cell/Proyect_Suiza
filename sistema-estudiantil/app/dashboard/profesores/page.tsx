"use client"

import { useEffect, useState } from "react"
import { UserPlus, Trash2 } from "lucide-react"

type Profesor = {
  id: string
  user: { name: string; email: string }
  subjects: { id: string; name: string }[]
}

type Usuario = {
  id: string
  name: string
  email: string
  role: string
}

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ userId: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const cargar = async () => {
    setLoading(true)
    const [p, u] = await Promise.all([
      fetch("/api/profesores").then(r => r.json()),
      fetch("/api/usuarios").then(r => r.json()),
    ])
    setProfesores(p)
    setUsuarios(u)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const usuariosSinProfesor = usuarios.filter(
    u => u.role === "TEACHER" && !profesores.some(p => p.user.email === u.email)
  )

  const handleCrear = async () => {
    setError("")
    if (!form.userId) {
      setError("Selecciona un usuario")
      return
    }
    const res = await fetch("/api/profesores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Profesor registrado correctamente")
      setForm({ userId: "" })
      setShowModal(false)
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al registrar profesor")
    }
  }

  const handleEliminar = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a ${name}?`)) return
    await fetch(`/api/profesores/${id}`, { method: "DELETE" })
    setSuccess("Profesor eliminado")
    cargar()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Profesores</h1>
          <p className="text-gray-500 text-sm mt-1">Registra y administra los profesores del instituto</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError("") }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus size={18} /> Nuevo profesor
        </button>
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando profesores...</p>
        ) : profesores.length === 0 ? (
          <p className="p-6 text-gray-400">No hay profesores registrados.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Materias asignadas</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profesores.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{p.user.name}</td>
                  <td className="px-6 py-3 text-gray-500">{p.user.email}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {p.subjects.length === 0 ? (
                      <span className="text-gray-400">Sin materias</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.subjects.map(s => (
                          <span key={s.id} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => handleEliminar(p.id, p.user.name)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Eliminar">
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
            <h2 className="text-lg font-bold text-gray-800">Nuevo Profesor</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.userId} onChange={(e) => setForm({ userId: e.target.value })}>
              <option value="">Seleccionar usuario profesor</option>
              {usuariosSinProfesor.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Registrar</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}