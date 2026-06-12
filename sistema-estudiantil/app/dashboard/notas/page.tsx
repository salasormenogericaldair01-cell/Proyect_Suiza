"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react"

const PERIODOS = [
  { value: "TRIMESTER_1", label: "Trimestre 1" },
  { value: "TRIMESTER_2", label: "Trimestre 2" },
  { value: "TRIMESTER_3", label: "Trimestre 3" },
  { value: "FINAL", label: "Final" },
]

type Nota = {
  id: string
  score: number
  period: string
  comment: string | null
  aiMessage: string | null
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
  career: string | null
}

function colorNota(score: number) {
  if (score >= 13) return "bg-green-100 text-green-700"
  if (score >= 10) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-700"
}

function labelPeriodo(period: string) {
  return PERIODOS.find(p => p.value === period)?.label ?? period
}

export default function NotasPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [notaEditar, setNotaEditar] = useState<Nota | null>(null)
  const [form, setForm] = useState({ studentId: "", subjectId: "", score: "", period: "", comment: "" })
  const [formEdit, setFormEdit] = useState({ score: "", period: "", comment: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filtroPeriodo, setFiltroPeriodo] = useState("")
  const [loadingIA, setLoadingIA] = useState(false)
  const [userRole, setUserRole] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const sesRes = await fetch("/api/auth/session").then(r => r.json())
      const role = sesRes?.user?.role || ""
      setUserRole(role)

      const n = await fetch("/api/notas").then(r => r.json())
      setNotas(Array.isArray(n) ? n : [])

      if (role === "ADMIN" || role === "TEACHER") {
        const [e, m] = await Promise.all([
          fetch("/api/estudiantes").then(r => r.json()),
          fetch("/api/materias").then(r => r.json()),
        ])
        setEstudiantes(Array.isArray(e) ? e : [])
        setMaterias(Array.isArray(m) ? m : [])
      }
    } catch (err) {
      console.error("Error al cargar notas:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const notasFiltradas = filtroPeriodo
    ? notas.filter(n => n.period === filtroPeriodo)
    : notas

  const handleCrear = async () => {
    setError("")
    if (!form.studentId || !form.subjectId || !form.score || !form.period) {
      setError("Todos los campos obligatorios deben completarse")
      return
    }
    const scoreNum = parseFloat(form.score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 20) {
      setError("La nota debe ser un número entre 0 y 20")
      return
    }
    setLoadingIA(true)
    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, score: scoreNum }),
    })
    setLoadingIA(false)
    if (res.ok) {
      setSuccess("Nota registrada correctamente")
      setForm({ studentId: "", subjectId: "", score: "", period: "", comment: "" })
      setShowModal(false)
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al registrar nota")
    }
  }

  const handleEditar = async () => {
    if (!notaEditar) return
    setError("")
    const scoreNum = parseFloat(formEdit.score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 20) {
      setError("La nota debe ser un número entre 0 y 20")
      return
    }
    const res = await fetch(`/api/notas/${notaEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formEdit, score: scoreNum }),
    })
    if (res.ok) {
      setSuccess("Nota actualizada correctamente")
      setShowEditModal(false)
      cargar()
    } else {
      setError("Error al actualizar nota")
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta nota?")) return
    await fetch(`/api/notas/${id}`, { method: "DELETE" })
    setSuccess("Nota eliminada")
    cargar()
  }

  const abrirEditar = (n: Nota) => {
    setNotaEditar(n)
    setFormEdit({ score: n.score.toString(), period: n.period, comment: n.comment ?? "" })
    setError("")
    setShowEditModal(true)
  }

  const puedeModificar = userRole === "ADMIN" || userRole === "TEACHER"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Notas</h1>
          <p className="text-gray-500 text-sm mt-1">Registra y administra las notas de los estudiantes</p>
        </div>
        {puedeModificar && (
          <button
            onClick={() => { setShowModal(true); setError("") }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Nueva nota
          </button>
        )}
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

      <div className="flex gap-3 items-center">
        <select
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm"
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
        >
          <option value="">Todos los períodos</option>
          {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <span className="text-sm text-gray-500">{notasFiltradas.length} nota(s)</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">Cargando notas...</p>
        ) : notasFiltradas.length === 0 ? (
          <p className="p-6 text-gray-400">No hay notas registradas.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Estudiante</th>
                <th className="px-6 py-3">Materia</th>
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Nota</th>
                <th className="px-6 py-3">Mensaje IA</th>
                {puedeModificar && <th className="px-6 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.map((n) => (
                <tr key={n.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{n.student.user.name}</td>
                  <td className="px-6 py-3 text-gray-600">{n.subject.name}</td>
                  <td className="px-6 py-3 text-gray-500">{labelPeriodo(n.period)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorNota(n.score)}`}>
                      {n.score}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 max-w-xs">
                    {n.aiMessage ? (
                      <span className="flex items-start gap-1">
                        <Sparkles size={14} className="text-purple-500 mt-0.5 shrink-0" />
                        <span className="text-xs">{n.aiMessage}</span>
                      </span>
                    ) : "—"}
                  </td>
                  {puedeModificar && (
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={() => abrirEditar(n)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleEliminar(n.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Nueva Nota</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">Seleccionar estudiante</option>
              {estudiantes.map(e => <option key={e.id} value={e.id}>{e.user.name} — {e.career}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Seleccionar materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="number" min="0" max="20" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nota (0 - 20)" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
              <option value="">Seleccionar período</option>
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Comentario (opcional)" rows={2} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} disabled={loadingIA} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-60">
                {loadingIA ? "Generando mensaje IA..." : "Registrar nota"}
              </button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && notaEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Editar Nota</h2>
            <p className="text-sm text-gray-500">{notaEditar.student.user.name} — {notaEditar.subject.name}</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="number" min="0" max="20" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Nota (0 - 20)" value={formEdit.score} onChange={(e) => setFormEdit({ ...formEdit, score: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" value={formEdit.period} onChange={(e) => setFormEdit({ ...formEdit, period: e.target.value })}>
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Comentario (opcional)" rows={2} value={formEdit.comment} onChange={(e) => setFormEdit({ ...formEdit, comment: e.target.value })} />
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