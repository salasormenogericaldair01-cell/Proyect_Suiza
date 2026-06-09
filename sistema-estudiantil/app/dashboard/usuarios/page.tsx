"use client"

import { useEffect, useState } from "react"
import { UserPlus, Ban, Check, Pencil, Trash2, Upload } from "lucide-react"
import ImportUsuariosModal from "../../components/dashboard/ImportUsuariosModal"

type Usuario = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

const rolNombre: Record<string, string> = {
  ADMIN: "Administrador",
  TEACHER: "Profesor",
  STUDENT: "Estudiante",
  PARENT: "Padre/Tutor",
  SUPPORT: "Soporte",
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" })
  const [formEdit, setFormEdit] = useState({ name: "", email: "", role: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const cargarUsuarios = async () => {
    setLoading(true)
    const res = await fetch("/api/usuarios")
    const data = await res.json()
    setUsuarios(data)
    setLoading(false)
  }

  useEffect(() => { cargarUsuarios() }, [])

  const handleCrear = async () => {
    setError("")
    if (!form.name || !form.email || !form.password) {
      setError("Todos los campos son obligatorios")
      return
    }
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Usuario creado correctamente")
      setForm({ name: "", email: "", password: "", role: "STUDENT" })
      setShowModal(false)
      cargarUsuarios()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al crear usuario")
    }
  }

  const handleEditar = async () => {
    if (!usuarioEditar) return
    setError("")
    const res = await fetch(`/api/usuarios/${usuarioEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdit),
    })
    if (res.ok) {
      setSuccess("Usuario actualizado correctamente")
      setShowEditModal(false)
      cargarUsuarios()
    } else {
      setError("Error al actualizar usuario")
    }
  }

  const handleEliminar = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" })
    setSuccess("Usuario eliminado")
    cargarUsuarios()
  }

  const toggleActivo = async (id: string, isActive: boolean) => {
    await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    cargarUsuarios()
  }

  const abrirEditar = (u: Usuario) => {
    setUsuarioEditar(u)
    setFormEdit({ name: u.name, email: u.email, role: u.role })
    setError("")
    setShowEditModal(true)
  }

  const rolColor: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    TEACHER: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
    PARENT: "bg-yellow-100 text-yellow-700",
    SUPPORT: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Administra todos los usuarios del sistema</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload size={18} /> Carga masiva (CSV)
          </button>
          <button
            onClick={() => { setShowModal(true); setError("") }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus size={18} /> Nuevo usuario
          </button>
        </div>
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando usuarios...</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-6 py-3 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rolColor[u.role] ?? "bg-gray-100"}`}>
                      {rolNombre[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => abrirEditar(u)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleActivo(u.id, u.isActive)}
                      className={`p-1.5 rounded-lg transition ${u.isActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                      title={u.isActive ? "Desactivar" : "Activar"}
                    >
                      {u.isActive ? <Ban size={16} /> : <Check size={16} />}
                    </button>
                    <button onClick={() => handleEliminar(u.id, u.name)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Eliminar">
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
            <h2 className="text-lg font-bold text-gray-800">Nuevo Usuario</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Administrador</option>
              <option value="TEACHER">Profesor</option>
              <option value="STUDENT">Estudiante</option>
              <option value="PARENT">Padre/Tutor</option>
              <option value="SUPPORT">Soporte</option>
            </select>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Crear usuario</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showEditModal && usuarioEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Editar Usuario</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nombre completo" value={formEdit.name} onChange={(e) => setFormEdit({ ...formEdit, name: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Email" type="email" value={formEdit.email} onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.role} onChange={(e) => setFormEdit({ ...formEdit, role: e.target.value })}>
              <option value="ADMIN">Administrador</option>
              <option value="TEACHER">Profesor</option>
              <option value="STUDENT">Estudiante</option>
              <option value="PARENT">Padre/Tutor</option>
              <option value="SUPPORT">Soporte</option>
            </select>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEditar} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">Guardar cambios</button>
              <button onClick={() => { setShowEditModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <ImportUsuariosModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={cargarUsuarios}
      />
    </div>
  )
}