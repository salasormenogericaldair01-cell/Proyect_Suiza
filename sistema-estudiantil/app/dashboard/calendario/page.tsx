"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Calendar } from "lucide-react"

interface Subject {
  name: string
}

interface Evento {
  id: string
  title: string
  description: string | null
  type: string
  date: string
  dueDate: string | null
  subjectId: string | null
  subject: Subject | null
}

const tipoLabel: Record<string, string> = {
  EXAM: "Examen",
  TASK: "Tarea",
  PROJECT: "Proyecto",
  HOLIDAY: "Feriado",
  MEETING: "Reunión",
  OTHER: "Otro",
}

const tipoColor: Record<string, string> = {
  EXAM: "bg-red-100 text-red-700",
  TASK: "bg-yellow-100 text-yellow-700",
  PROJECT: "bg-blue-100 text-blue-700",
  HOLIDAY: "bg-green-100 text-green-700",
  MEETING: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-700",
}

const tiposEvento = ["EXAM", "TASK", "PROJECT", "HOLIDAY", "MEETING", "OTHER"]

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [materias, setMaterias] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "EXAM",
    date: "",
    dueDate: "",
    subjectId: ""
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [evRes, matRes] = await Promise.all([
        fetch("/api/calendario"),
        fetch("/api/materias")
      ])
      const evData = await evRes.json()
      const matData = await matRes.json()
      setEventos(evData)
      setMaterias(matData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setForm({ title: "", description: "", type: "EXAM", date: "", dueDate: "", subjectId: "" })
    setError("")
    setModalCrear(true)
  }

  const abrirEditar = (evento: Evento) => {
    setSeleccionado(evento)
    setForm({
      title: evento.title,
      description: evento.description || "",
      type: evento.type,
      date: evento.date.split("T")[0],
      dueDate: evento.dueDate ? evento.dueDate.split("T")[0] : "",
      subjectId: evento.subjectId || ""
    })
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
    if (!form.title.trim() || !form.date) {
      setError("El título y la fecha son obligatorios.")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch("/api/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al crear evento")
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
    if (!form.title.trim() || !form.date) {
      setError("El título y la fecha son obligatorios.")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch(`/api/calendario/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al editar evento")
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
    if (!confirm("¿Estás segura de que deseas eliminar este evento?")) return
    try {
      await fetch(`/api/calendario/${id}`, { method: "DELETE" })
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

  const eventosFiltrados = filtroTipo
    ? eventos.filter(e => e.type === filtroTipo)
    : eventos

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calendario Académico</h1>
            <p className="text-sm text-gray-500">Eventos, exámenes y actividades institucionales</p>
          </div>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          {tiposEvento.map(t => (
            <option key={t} value={t}>{tipoLabel[t]}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando eventos...</div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No hay eventos registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha límite</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Materia</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Descripción</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventosFiltrados.map((ev, i) => (
                <tr key={ev.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-800 font-medium">{ev.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoColor[ev.type]}`}>
                      {tipoLabel[ev.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{formatFecha(ev.date)}</td>
                  <td className="px-4 py-3 text-gray-800">
                    {ev.dueDate ? formatFecha(ev.dueDate) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {ev.subject ? ev.subject.name : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <p className="truncate">{ev.description || <span className="text-gray-400">—</span>}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(ev)}
                        className="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => eliminar(ev.id)}
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

      {/* Modal Crear / Editar — componente reutilizable */}
      {(modalCrear || modalEditar) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {modalCrear ? "Nuevo Evento" : "Editar Evento"}
            </h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Examen parcial de Matemáticas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tiposEvento.map(t => (
                    <option key={t} value={t}>{tipoLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite (opcional)</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materia (opcional)</label>
                <select
                  value={form.subjectId}
                  onChange={e => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin materia</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales del evento..."
                />
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
                onClick={modalCrear ? crear : editar}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : modalCrear ? "Crear Evento" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}