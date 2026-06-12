"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts"
import {
  Download, Printer, FileText, CheckSquare, BarChart2, Users, GraduationCap, Search, Filter
} from "lucide-react"
import Papa from "papaparse"

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
const PERIODOS = [
  { value: "TRIMESTER_1", label: "Trimestre 1" },
  { value: "TRIMESTER_2", label: "Trimestre 2" },
  { value: "TRIMESTER_3", label: "Trimestre 3" },
  { value: "FINAL", label: "Final" },
]

type EstudianteData = { id: string; name: string; email: string; career: string; cycle: string }
type NotaData = { id: string; studentName: string; career: string; cycle: string; subjectName: string; score: number; period: string; date: string }
type AsistenciaData = { id: string; studentName: string; career: string; cycle: string; subjectName: string; status: string; date: string }
type MateriaData = { id: string; name: string; career: string | null }

type Props = {
  estudiantes: EstudianteData[]
  notas: NotaData[]
  asistencias: AsistenciaData[]
  materias: MateriaData[]
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"]

export default function ReportesClient({ estudiantes, notas, asistencias, materias }: Props) {
  const [activeTab, setActiveTab] = useState<"graficos" | "notas" | "asistencia">("graficos")

  // Filtros pestaña Notas
  const [filtroNotasCarrera, setFiltroNotasCarrera] = useState("")
  const [filtroNotasCiclo, setFiltroNotasCiclo] = useState("")
  const [filtroNotasPeriodo, setFiltroNotasPeriodo] = useState("")
  const [filtroNotasMateria, setFiltroNotasMateria] = useState("")
  const [busquedaNotas, setBusquedaNotas] = useState("")

  // Filtros pestaña Asistencia
  const [filtroAsisCarrera, setFiltroAsisCarrera] = useState("")
  const [filtroAsisCiclo, setFiltroAsisCiclo] = useState("")
  const [filtroAsisMateria, setFiltroAsisMateria] = useState("")
  const [filtroAsisFechaDesde, setFiltroAsisFechaDesde] = useState("")
  const [filtroAsisFechaHasta, setFiltroAsisFechaHasta] = useState("")

  // --- CALCULO DE KPIs Y GRAFICOS ---
  const kpis = useMemo(() => {
    const totalPromedio = notas.length > 0
      ? (notas.reduce((acc, n) => acc + n.score, 0) / notas.length).toFixed(1)
      : "—"
    
    const aprobadasCount = notas.filter(n => n.score >= 13).length
    const reprobadasCount = notas.length - aprobadasCount
    const tasaAprobacion = notas.length > 0
      ? Math.round((aprobadasCount / notas.length) * 100)
      : 0

    const totalAsist = asistencias.length
    const presentes = asistencias.filter(a => a.status === "PRESENT" || a.status === "LATE").length
    const tasaAsist = totalAsist > 0
      ? Math.round((presentes / totalAsist) * 100)
      : 0

    return { totalPromedio, aprobadasCount, reprobadasCount, tasaAprobacion, tasaAsist }
  }, [notas, asistencias])

  const promedioCarrerasData = useMemo(() => {
    const mapa: Record<string, { suma: number; count: number }> = {}
    notas.forEach((n) => {
      if (!mapa[n.career]) mapa[n.career] = { suma: 0, count: 0 }
      mapa[n.career].suma += n.score
      mapa[n.career].count += 1
    })

    return Object.entries(mapa).map(([carrera, { suma, count }]) => ({
      carrera: carrera.length > 20 ? carrera.substring(0, 18) + "..." : carrera,
      promedio: parseFloat((suma / count).toFixed(1)),
    }))
  }, [notas])

  const asistenciaStatusData = useMemo(() => {
    const mapa: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }
    asistencias.forEach((a) => {
      if (a.status in mapa) mapa[a.status] += 1
    })

    return [
      { name: "Presente", value: mapa.PRESENT },
      { name: "Ausente", value: mapa.ABSENT },
      { name: "Tardanza", value: mapa.LATE },
      { name: "Justificado", value: mapa.EXCUSED },
    ].filter(v => v.value > 0)
  }, [asistencias])

  // --- FILTRADO DE NOTAS PARA EXPORTACION ---
  const notasFiltradas = useMemo(() => {
    return notas.filter((n) => {
      const matchCarrera = !filtroNotasCarrera || n.career === filtroNotasCarrera
      const matchCiclo = !filtroNotasCiclo || n.cycle === filtroNotasCiclo
      const matchPeriodo = !filtroNotasPeriodo || n.period === filtroNotasPeriodo
      const matchMateria = !filtroNotasMateria || n.subjectName === filtroNotasMateria
      const matchBusqueda = !busquedaNotas || n.studentName.toLowerCase().includes(busquedaNotas.toLowerCase())
      return matchCarrera && matchCiclo && matchPeriodo && matchMateria && matchBusqueda
    })
  }, [notas, filtroNotasCarrera, filtroNotasCiclo, filtroNotasPeriodo, filtroNotasMateria, busquedaNotas])

  // --- FILTRADO Y RESUMEN DE ASISTENCIA ---
  const asistenciaFiltradaPorAlumno = useMemo(() => {
    // 1. Filtrar registros en base a filtros de asistencia
    const asistenciasFilt = asistencias.filter((a) => {
      const matchCarrera = !filtroAsisCarrera || a.career === filtroAsisCarrera
      const matchCiclo = !filtroAsisCiclo || a.cycle === filtroAsisCiclo
      const matchMateria = !filtroAsisMateria || a.subjectName === filtroAsisMateria
      const matchDesde = !filtroAsisFechaDesde || a.date >= filtroAsisFechaDesde
      const matchHasta = !filtroAsisFechaHasta || a.date <= filtroAsisFechaHasta
      return matchCarrera && matchCiclo && matchMateria && matchDesde && matchHasta
    })

    // 2. Agrupar por estudiante
    const agrupado: Record<string, {
      studentName: string
      career: string
      cycle: string
      presentes: number
      ausentes: number
      tardanzas: number
      justificados: number
    }> = {}

    asistenciasFilt.forEach((a) => {
      if (!agrupado[a.studentName]) {
        agrupado[a.studentName] = {
          studentName: a.studentName,
          career: a.career,
          cycle: a.cycle,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
          justificados: 0,
        }
      }

      if (a.status === "PRESENT") agrupado[a.studentName].presentes += 1
      else if (a.status === "ABSENT") agrupado[a.studentName].ausentes += 1
      else if (a.status === "LATE") agrupado[a.studentName].tardanzas += 1
      else if (a.status === "EXCUSED") agrupado[a.studentName].justificados += 1
    })

    return Object.values(agrupado).map((a) => {
      const total = a.presentes + a.ausentes + a.tardanzas + a.justificados
      const porcentaje = total > 0
        ? Math.round(((a.presentes + a.tardanzas) / total) * 100)
        : 100
      return { ...a, total, porcentaje }
    })
  }, [asistencias, filtroAsisCarrera, filtroAsisCiclo, filtroAsisMateria, filtroAsisFechaDesde, filtroAsisFechaHasta])

  // --- EXPORTAR EXCEL (CSV) ---
  const handleExportNotasExcel = () => {
    const exportData = notasFiltradas.map((n) => ({
      Estudiante: n.studentName,
      Carrera: n.career,
      Ciclo: n.cycle,
      Materia: n.subjectName,
      Nota: n.score,
      Periodo: PERIODOS.find(p => p.value === n.period)?.label ?? n.period,
      Fecha: n.date,
    }))
    const csv = Papa.unparse(exportData)
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Reporte_Notas_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportAsistenciaExcel = () => {
    const exportData = asistenciaFiltradaPorAlumno.map((a) => ({
      Estudiante: a.studentName,
      Carrera: a.career,
      Ciclo: a.cycle,
      Presentes: a.presentes,
      Ausentes: a.ausentes,
      Tardanzas: a.tardanzas,
      Justificados: a.justificados,
      "Total Clases": a.total,
      "Tasa Asistencia (%)": `${a.porcentaje}%`,
    }))
    const csv = Papa.unparse(exportData)
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Reporte_Asistencias_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- IMPRIMIR / PDF ---
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={26} /> Módulo de Reportes y Estadísticas
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Genera reportes de desempeño, asistencia y descarga datos en Excel o PDF.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* TÍTULO PARA IMPRESIÓN */}
      <div className="hidden print:block text-center space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">IESTP Suiza — Pucallpa</h1>
        <h2 className="text-xl font-bold text-gray-700">Reporte Académico Oficial</h2>
        <p className="text-sm text-gray-400">Fecha del Reporte: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit print:hidden">
        <button
          onClick={() => setActiveTab("graficos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "graficos" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <BarChart2 size={16} /> Estadísticas y KPIs
        </button>
        <button
          onClick={() => setActiveTab("notas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "notas" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FileText size={16} /> Reporte de Notas
        </button>
        <button
          onClick={() => setActiveTab("asistencia")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "asistencia" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CheckSquare size={16} /> Reporte de Asistencia
        </button>
      </div>

      {/* PESTAÑA 1: KPIs Y GRÁFICOS */}
      {activeTab === "graficos" && (
        <div className="space-y-6">
          {/* Tarjetas KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
              <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm">
                <GraduationCap size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Alumnos Registrados</p>
                <p className="text-2xl font-bold text-gray-800">{estudiantes.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
              <div className="bg-emerald-500 text-white p-3 rounded-lg shadow-sm">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Promedio General</p>
                <p className="text-2xl font-bold text-gray-800">{kpis.totalPromedio}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
              <div className="bg-indigo-500 text-white p-3 rounded-lg shadow-sm">
                <CheckSquare size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Tasa de Asistencia</p>
                <p className="text-2xl font-bold text-gray-800">{kpis.tasaAsist}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
              <div className="bg-teal-500 text-white p-3 rounded-lg shadow-sm">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Tasa de Aprobación</p>
                <p className="text-2xl font-bold text-gray-800">{kpis.tasaAprobacion}%</p>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Promedios por Carrera */}
            <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Calificaciones Promedio por Carrera</h3>
              {promedioCarrerasData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12">No hay calificaciones registradas aún.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={promedioCarrerasData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="carrera" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="promedio" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Distribución Asistencia */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4 flex flex-col justify-between">
              <h3 className="font-bold text-gray-800 border-b pb-2">Distribución de Asistencias</h3>
              {asistenciaStatusData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12">No hay incidencias de asistencia.</p>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={asistenciaStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {asistenciaStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
                    {asistenciaStatusData.map((d, index) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-gray-600">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: EXPORTAR NOTAS */}
      {activeTab === "notas" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por estudiante..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white"
                value={busquedaNotas}
                onChange={(e) => setBusquedaNotas(e.target.value)}
              />
            </div>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroNotasCarrera}
              onChange={(e) => setFiltroNotasCarrera(e.target.value)}
            >
              <option value="">Todas las Carreras</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroNotasCiclo}
              onChange={(e) => setFiltroNotasCiclo(e.target.value)}
            >
              <option value="">Todos los Ciclos</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroNotasPeriodo}
              onChange={(e) => setFiltroNotasPeriodo(e.target.value)}
            >
              <option value="">Todos los Periodos</option>
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>

            <button
              onClick={handleExportNotasExcel}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
            >
              <Download size={16} /> Exportar Excel
            </button>
          </div>

          {/* Tabla de Resultados */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Calificaciones Filtradas</h3>
              <span className="text-xs text-gray-500 font-medium">{notasFiltradas.length} calificaciones encontradas</span>
            </div>

            {notasFiltradas.length === 0 ? (
              <p className="p-10 text-center text-gray-400 italic">No hay notas registradas que coincidan con los filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Estudiante</th>
                      <th className="px-6 py-3">Carrera</th>
                      <th className="px-6 py-3">Ciclo</th>
                      <th className="px-6 py-3">Materia</th>
                      <th className="px-6 py-3">Periodo</th>
                      <th className="px-6 py-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasFiltradas.map((n) => (
                      <tr key={n.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                        <td className="px-6 py-3 font-semibold text-gray-800">{n.studentName}</td>
                        <td className="px-6 py-3 text-gray-600">{n.career}</td>
                        <td className="px-6 py-3 text-gray-600">Ciclo {n.cycle}</td>
                        <td className="px-6 py-3 text-gray-700">{n.subjectName}</td>
                        <td className="px-6 py-3 text-gray-500">
                          {PERIODOS.find(p => p.value === n.period)?.label ?? n.period}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            n.score >= 13 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {n.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: ASISTENCIA POR PERIODO */}
      {activeTab === "asistencia" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 print:hidden">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroAsisCarrera}
              onChange={(e) => setFiltroAsisCarrera(e.target.value)}
            >
              <option value="">Todas las Carreras</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroAsisCiclo}
              onChange={(e) => setFiltroAsisCiclo(e.target.value)}
            >
              <option value="">Todos los Ciclos</option>
              {CICLOS.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroAsisMateria}
              onChange={(e) => setFiltroAsisMateria(e.target.value)}
            >
              <option value="">Todas las Materias</option>
              {materias.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>

            <input
              type="date"
              placeholder="Desde"
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroAsisFechaDesde}
              onChange={(e) => setFiltroAsisFechaDesde(e.target.value)}
            />

            <input
              type="date"
              placeholder="Hasta"
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50"
              value={filtroAsisFechaHasta}
              onChange={(e) => setFiltroAsisFechaHasta(e.target.value)}
            />

            <button
              onClick={handleExportAsistenciaExcel}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
            >
              <Download size={16} /> Exportar Excel
            </button>
          </div>

          {/* Tabla de Resumen */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Tasa de Asistencia por Estudiante</h3>
              <span className="text-xs text-gray-500 font-medium">{asistenciaFiltradaPorAlumno.length} estudiantes resumidos</span>
            </div>

            {asistenciaFiltradaPorAlumno.length === 0 ? (
              <p className="p-10 text-center text-gray-400 italic">No hay registros de asistencia que coincidan con los filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left font-medium">
                  <thead className="bg-gray-100 text-gray-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Estudiante</th>
                      <th className="px-6 py-3">Carrera</th>
                      <th className="px-6 py-3">Ciclo</th>
                      <th className="px-6 py-3 text-center text-green-600">Presentes</th>
                      <th className="px-6 py-3 text-center text-red-500">Ausentes</th>
                      <th className="px-6 py-3 text-center text-yellow-500">Tardanzas</th>
                      <th className="px-6 py-3 text-center text-blue-500">Justificados</th>
                      <th className="px-6 py-3 text-center">Total Clases</th>
                      <th className="px-6 py-3 text-right">Porcentaje Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistenciaFiltradaPorAlumno.map((a, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                        <td className="px-6 py-3 font-semibold text-gray-800">{a.studentName}</td>
                        <td className="px-6 py-3 text-gray-500">{a.career}</td>
                        <td className="px-6 py-3 text-gray-500">Ciclo {a.cycle}</td>
                        <td className="px-6 py-3 text-center text-green-600">{a.presentes}</td>
                        <td className="px-6 py-3 text-center text-red-500">{a.ausentes}</td>
                        <td className="px-6 py-3 text-center text-yellow-500">{a.tardanzas}</td>
                        <td className="px-6 py-3 text-center text-blue-500">{a.justificados}</td>
                        <td className="px-6 py-3 text-center text-gray-600 font-bold">{a.total}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            a.porcentaje >= 80 ? "bg-green-100 text-green-700" :
                            a.porcentaje >= 65 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {a.porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
