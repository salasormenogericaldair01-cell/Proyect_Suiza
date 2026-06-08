"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Megaphone, Globe, Lock } from "lucide-react"

interface Author {
  name: string
  role: string
}

interface Anuncio {
  id: string
  title: string
  content: string
  isPublic: boolean
  createdAt: string
  author: Author
}

const rolLabel: Record<string, string> = {
  ADMIN: "Administrador",
  TEACHER: "Profesor",
  STUDENT: "Estudiante",
  SUPPORT: "Soporte",
}

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Anuncio | null>(null)
  const [form, setForm] = useState({ title: "", content: "", isPublic: true })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/anuncios")
      const data = await res.json()
      setAnuncios(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setForm({ title: "", content: "", isPublic: true })
    setError("")
    setModalCrear(true)
  }

  const abrirEditar = (anuncio: Anuncio) => {
    setSeleccionado(anuncio)
    setForm({ title: anuncio.title, content: anuncio.content, isPublic: anuncio.isPublic })
    setError("")
    setModalEditar(true)
  }

  const cerrarModales = () => {
    setModalCrear(false)
    setModalEditar(false)
    setSeleccionado(null)
    setError("")
  }

  const crear = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError("El título y el contenido son obligatorios.")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch("/api/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al crear anuncio")
        return
      }
      await cargar()
      cerrarModales()
    } catch (e) {
      console.error(e)
      setError("Error inesperado")
    } finally {
      setGuardando(false)
    }
  }

  const editar = async () => {
    if (!seleccionado) return
    if (!form.title.trim() || !form.content.trim()) {
      setError("El título y el contenido son obligatorios.")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch(`/api/anuncios/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al editar anuncio")
        return
      }
      await cargar()
      cerrarModales()
    } catch (e) {
      console.error(e)
      setError("Error inesperado")
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm("¿Estás segura de que deseas eliminar este anuncio?")) return
    try {
      await fetch(`/api/anuncios/${id}`, { method: "DELETE" })
      await cargar()
    } catch (e) {
      console.error(e)
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric"
    })
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Anuncios</h1>
            <p className="text-sm text-gray-500">Comunicados institucionales del sistema</p>
          </div>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Nuevo Anuncio
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando anuncios...</div>
        ) : anuncios.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No hay anuncios registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Contenido</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Autor</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Visibilidad</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {anuncios.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-800 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <p className="truncate">{a.content}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{a.author.name}</div>
                    <div className="text-xs text-gray-400">{rolLabel[a.author.role] ?? a.author.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    {a.isPublic ? (
                      <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs w-fit">
                        <Globe size={12} /> Público
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-700 bg-gray-200 px-2 py-1 rounded-full text-xs w-fit">
                        <Lock size={12} /> Privado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{formatFecha(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(a)}
                        className="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => eliminar(a.id)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nuevo Anuncio</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Reunión de padres de familia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el anuncio..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
                <select
                  value={form.isPublic ? "true" : "false"}
                  onChange={e => setForm({ ...form, isPublic: e.target.value === "true" })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Público (todos pueden verlo)</option>
                  <option value="false">Privado (solo administradores)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cerrarModales}
                className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={crear}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Crear Anuncio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && seleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Editar Anuncio</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
                <select
                  value={form.isPublic ? "true" : "false"}
                  onChange={e => setForm({ ...form, isPublic: e.target.value === "true" })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Público (todos pueden verlo)</option>
                  <option value="false">Privado (solo administradores)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cerrarModales}
                className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={editar}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}