"use client"

import { useState } from "react"
import { Upload, Download, AlertTriangle, Loader2, Copy, Check, X } from "lucide-react"
import Papa from "papaparse"

interface ImportUsuariosModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface RowError {
  row: number
  email?: string
  error: string
}

interface UserCredential {
  name: string
  email: string
  role: string
  tempPassword?: string
}

interface ImportUserRow {
  name?: string
  email?: string
  role?: string
  phone?: string
  career?: string
  cycle?: string
  studentCode?: string
  parentEmail?: string
}

interface ImportResponse {
  imported: number
  updated: number
  errors?: RowError[]
  credentials?: UserCredential[]
  error?: string
}

export default function ImportUsuariosModal({ isOpen, onClose, onSuccess }: ImportUsuariosModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    imported: number
    updated: number
    errors: RowError[]
    credentials: UserCredential[]
  } | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Function to download CSV template
  const downloadTemplate = () => {
    const headers = ["name", "email", "role", "phone", "career", "cycle", "studentCode", "parentEmail"]
    const rows = [
      ["Ana Gomez", "ana.gomez@estudiante.com", "STUDENT", "999888777", "Ingenieria de Sistemas", "Ciclo V", "EST-101", "padre.gomez@correo.com"],
      ["Carlos Ruiz", "carlos.ruiz@profesor.com", "TEACHER", "987654321", "", "", "", ""],
      ["Pedro Gomez", "padre.gomez@correo.com", "PARENT", "911222333", "", "", "", ""],
      ["Soporte Tecnico", "soporte@sistema.com", "SUPPORT", "900000001", "", "", "", ""],
      ["Admin Auxiliar", "admin.aux@sistema.com", "ADMIN", "900000002", "", "", "", ""]
    ]

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla_importacion_usuarios.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults(null)
    }
  }

  // Process and upload data
  const handleImport = () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setResults({ imported: 0, updated: 0, errors: [], credentials: [] })

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data as ImportUserRow[]

        if (rows.length === 0) {
          setResults({
            imported: 0,
            updated: 0,
            errors: [{ row: 1, error: "El archivo CSV está vacío." }],
            credentials: []
          })
          setImporting(false)
          return
        }

        const chunkSize = 50
        let currentImported = 0
        let currentUpdated = 0
        const allErrors: RowError[] = []
        const allCredentials: UserCredential[] = []

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize)
          
          try {
            const res = await fetch("/api/usuarios/importar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ users: chunk }),
            })

            if (!res.ok) {
              const errorData = await res.json() as ImportResponse
              throw new Error(errorData.error || `Error del servidor (${res.status})`)
            }

            const data = await res.json() as ImportResponse
            currentImported += data.imported
            currentUpdated += data.updated
            
            // Adjust row numbers for chunk errors to match overall CSV rows
            if (data.errors && data.errors.length > 0) {
              const mappedErrors = data.errors.map((e: RowError) => ({
                ...e,
                row: e.row + i
              }))
              allErrors.push(...mappedErrors)
            }

            if (data.credentials && data.credentials.length > 0) {
              allCredentials.push(...data.credentials)
            }

          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al enviar el lote"
            chunk.forEach((user, index) => {
              allErrors.push({
                row: i + index + 1,
                email: user.email || "Desconocido",
                error: message
              })
            })
          }

          const pct = Math.min(Math.round(((i + chunk.length) / rows.length) * 100), 100)
          setProgress(pct)
        }

        setResults({
          imported: currentImported,
          updated: currentUpdated,
          errors: allErrors,
          credentials: allCredentials
        })
        setImporting(false)
        onSuccess() // Refresh user list
      },
      error: (err) => {
        setResults({
          imported: 0,
          updated: 0,
          errors: [{ row: 0, error: `Error al leer CSV: ${err.message}` }],
          credentials: []
        })
        setImporting(false)
      }
    })
  }

  // Download credentials file
  const downloadCredentialsCSV = () => {
    if (!results || results.credentials.length === 0) return

    const headers = ["Nombre", "Email", "Rol", "Contraseña Temporal"]
    const rows = results.credentials.map(c => [
      c.name,
      c.email,
      c.role,
      c.tempPassword || "(Sin cambios - Usuario existente)"
    ])

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "credenciales_nuevas_importacion.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy credentials to clipboard
  const copyCredentialsToClipboard = () => {
    if (!results || results.credentials.length === 0) return

    const text = results.credentials
      .map(c => `${c.name} (${c.role}): ${c.email} / Clave: ${c.tempPassword || "Existente"}`)
      .join("\n")

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Carga Masiva de Usuarios</h2>
            <p className="text-gray-500 text-xs mt-0.5">Agrega o actualiza profesores, alumnos, padres y personal administrativo mediante CSV</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructions and Template Download */}
          {!importing && !results && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-900">¿No tienes el formato correcto?</h4>
                <p className="text-xs text-blue-700">Descarga la plantilla CSV con la estructura exacta para evitar errores de importación.</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
              >
                <Download size={14} /> Descargar Plantilla
              </button>
            </div>
          )}

          {/* Upload Box */}
          {!importing && !results && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition bg-gray-50/50">
              <Upload className="mx-auto text-gray-400 mb-3" size={36} />
              <label className="block text-sm font-semibold text-gray-700 mb-1 cursor-pointer">
                <span className="text-blue-600 hover:underline">Selecciona un archivo CSV</span> o arrástralo aquí
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-400">Solo archivos .csv de hasta 10MB</p>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                  <button onClick={() => setFile(null)} className="hover:text-red-600 ml-1">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Importing progress */}
          {importing && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">Procesando archivo...</p>
                <p className="text-xs text-gray-500">Subiendo y validando registros en bloques de 50</p>
              </div>
              <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-600 h-2.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-gray-700">{progress}% completado</span>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <span className="block text-2xl font-bold text-green-700">{results.imported}</span>
                  <span className="text-xs text-green-600 font-medium">Importados</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <span className="block text-2xl font-bold text-blue-700">{results.updated}</span>
                  <span className="text-xs text-blue-600 font-medium">Actualizados</span>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <span className="block text-2xl font-bold text-red-700">{results.errors.length}</span>
                  <span className="text-xs text-red-600 font-medium">Errores</span>
                </div>
              </div>

              {/* Created User Credentials */}
              {results.credentials.filter(c => c.tempPassword).length > 0 && (
                <div className="border rounded-xl overflow-hidden bg-gray-50">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-100/50">
                    <span className="text-sm font-bold text-gray-800">Nuevas Credenciales Generadas</span>
                    <div className="flex gap-2">
                      <button
                        onClick={copyCredentialsToClipboard}
                        className="flex items-center gap-1 bg-white hover:bg-gray-50 border px-2.5 py-1 rounded text-xs font-semibold text-gray-700 transition"
                      >
                        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        {copied ? "Copiado" : "Copiar todo"}
                      </button>
                      <button
                        onClick={downloadCredentialsCSV}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                      >
                        <Download size={12} /> Descargar CSV
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y">
                    {results.credentials
                      .filter(c => c.tempPassword)
                      .map((c, i) => (
                        <div key={i} className="px-4 py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{c.name}</p>
                            <p className="text-gray-500">{c.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-medium text-[10px] uppercase mb-1">{c.role}</span>
                            <p className="font-mono bg-white px-2 py-0.5 rounded border text-gray-700 text-xs font-semibold select-all">
                              {c.tempPassword}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Errors List */}
              {results.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/20">
                  <div className="px-4 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={16} />
                    <span className="text-sm font-bold text-red-900">Listado de Errores ({results.errors.length})</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
                    {results.errors.map((err, i) => (
                      <div key={i} className="px-4 py-2.5 text-xs text-red-800 flex justify-between">
                        <div>
                          <span className="font-semibold mr-1.5">Fila {err.row}:</span>
                          <span className="font-mono text-gray-600">{err.email}</span>
                        </div>
                        <span className="text-red-700 font-medium text-right max-w-xs">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          {results ? (
            <button
              onClick={() => {
                setResults(null)
                setFile(null)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
            >
              Cargar Otro Archivo
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
            >
              Iniciar Importación
            </button>
          )}
          <button
            onClick={onClose}
            disabled={importing}
            className="border hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
