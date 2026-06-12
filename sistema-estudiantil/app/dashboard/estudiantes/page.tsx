"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { UserPlus, Pencil, Trash2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [userRole, setUserRole] = useState("")

  // Filtros y Paginación
  const [busqueda, setBusqueda] = useState("")
  const [filtroCarrera, setFiltroCarrera] = useState("")
  const [filtroCiclo, setFiltroCiclo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const sesRes = await fetch("/api/auth/session").then(r => r.json())
      const role = sesRes?.user?.role || ""
      setUserRole(role)

      const e = await fetch("/api/estudiantes").then(r => r.json())
      setEstudiantes(Array.isArray(e) ? e : [])

      if (role === "ADMIN" || role === "SUPPORT") {
        const u = await fetch("/api/usuarios").then(r => r.json())
        setUsuarios(Array.isArray(u) ? u : [])
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Filtrado de alumnos
  const estudiantesFiltrados = useMemo(() => {
    setCurrentPage(1) // Reiniciar a la primera página ante cambios de filtro
    return estudiantes.filter((e) => {
      const matchBusqueda = !busqueda || 
        e.user.name.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.user.email.toLowerCase().includes(busqueda.toLowerCase())
      const matchCarrera = !filtroCarrera || e.career === filtroCarrera
      const matchCiclo = !filtroCiclo || e.cycle === filtroCiclo
      return matchBusqueda && matchCarrera && matchCiclo
    })
  }, [estudiantes, busqueda, filtroCarrera, filtroCiclo])

  // Paginación de alumnos
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return estudiantesFiltrados.slice(start, start + itemsPerPage)
  }, [estudiantesFiltrados, currentPage])

  const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage)

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
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Estudiantes</h1>
          <p className="text-gray-500 text-sm mt-1">Registra y administra los estudiantes del instituto</p>
        </div>
        {userRole === "ADMIN" && (
          <button
            onClick={() => { setShowModal(true); setError("") }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-semibold text-sm"
          >
            <UserPlus size={18} /> Nuevo estudiante
          </button>
        )}
      </div>

      {success && <p className="text-green-600 bg-green-50 px-4 py-2 rounded-lg text-sm">{success}</p>}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white transition"
          value={filtroCarrera}
          onChange={(e) => setFiltroCarrera(e.target.value)}
        >
          <option value="">Todas las Carreras</option>
          {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white transition"
          value={filtroCiclo}
          onChange={(e) => setFiltroCiclo(e.target.value)}
        >
          <option value="">Todos los Ciclos</option>
          {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
        </select>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-sm">Cargando estudiantes...</p>
        ) : paginatedStudents.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm italic">No hay estudiantes registrados que coincidan con los filtros.</p>
        ) : (
          <div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Carrera</th>
                  <th className="px-6 py-3">Ciclo</th>
                  <th className="px-6 py-3">Padre/Tutor</th>
                  {userRole === "ADMIN" && <th className="px-6 py-3">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedStudents.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 font-semibold text-gray-800">{e.user.name}</td>
                    <td className="px-6 py-3 text-gray-500">{e.user.email}</td>
                    <td className="px-6 py-3 text-gray-700 font-medium">{e.career}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        Ciclo {e.cycle}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{e.parent?.user.name ?? "Sin asignar"}</td>
                    {userRole === "ADMIN" && (
                      <td className="px-6 py-3 flex gap-2">
                        <button onClick={() => abrirEditar(e)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleEliminar(e.id, e.user.name)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                <span className="text-xs text-gray-500">
                  Mostrando página {currentPage} de {totalPages} ({estudiantesFiltrados.length} estudiantes en total)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal crear */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Nuevo Estudiante</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Seleccionar usuario estudiante</option>
              {usuariosSinEstudiante.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
              <option value="">Seleccionar ciclo</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Seleccionar padre/tutor (opcional)</option>
              {padres.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código de estudiante (opcional)" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleCrear} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">Registrar</button>
              <button onClick={() => { setShowModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800 font-semibold">Cancelar</button>
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
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={formEdit.career} onChange={(e) => setFormEdit({ ...formEdit, career: e.target.value })}>
              <option value="">Seleccionar carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={formEdit.cycle} onChange={(e) => setFormEdit({ ...formEdit, cycle: e.target.value })}>
              <option value="">Seleccionar ciclo</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white" value={formEdit.parentId} onChange={(e) => setFormEdit({ ...formEdit, parentId: e.target.value })}>
              <option value="">Sin padre/tutor</option>
              {padres.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="Código de estudiante" value={formEdit.studentCode} onChange={(e) => setFormEdit({ ...formEdit, studentCode: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleEditar} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">Guardar cambios</button>
              <button onClick={() => { setShowEditModal(false); setError("") }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-sm text-gray-800 font-semibold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}