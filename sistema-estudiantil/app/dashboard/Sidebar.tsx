"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  FileText, CheckSquare, Megaphone, Calendar, BarChart2, LogOut
} from "lucide-react"

// Menú para ADMIN y SUPPORT
const menuAdmin = [
  {
    label: "GENERAL",
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    ]
  },
  {
    label: "GESTIÓN",
    items: [
      { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
      { href: "/dashboard/estudiantes", label: "Estudiantes", icon: GraduationCap },
      { href: "/dashboard/profesores", label: "Profesores", icon: BookOpen },
      { href: "/dashboard/materias", label: "Materias", icon: ClipboardList },
      { href: "/dashboard/notas", label: "Notas", icon: FileText },
    ]
  },
  {
    label: "ACADÉMICO",
    items: [
      { href: "/dashboard/asistencia", label: "Asistencia", icon: CheckSquare },
      { href: "/dashboard/anuncios", label: "Anuncios", icon: Megaphone },
      { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
    ]
  },
  {
    label: "REPORTES",
    items: [
      { href: "/dashboard/reportes", label: "Reportes", icon: BarChart2 },
    ]
  },
]

// Menú para TEACHER
const menuProfesor = [
  {
    label: "PANEL PROFESOR",
    items: [
      { href: "/dashboard/profesor", label: "Inicio", icon: LayoutDashboard },
      { href: "/dashboard/profesor/materias", label: "Mis Materias", icon: ClipboardList },
      { href: "/dashboard/profesor/estudiantes", label: "Mis Estudiantes", icon: GraduationCap },
      { href: "/dashboard/profesor/notas", label: "Notas", icon: FileText },
      { href: "/dashboard/profesor/asistencia", label: "Asistencia", icon: CheckSquare },
      { href: "/dashboard/profesor/anuncios", label: "Anuncios", icon: Megaphone },
    ]
  },
]

// Menú para STUDENT
const menuEstudiante = [
  {
    label: "PANEL ESTUDIANTE",
    items: [
      { href: "/dashboard/estudiante", label: "Inicio", icon: LayoutDashboard },
      { href: "/dashboard/estudiante/notas", label: "Mis Notas", icon: FileText },
      { href: "/dashboard/estudiante/asistencia", label: "Mi Asistencia", icon: CheckSquare },
      { href: "/dashboard/estudiante/anuncios", label: "Anuncios", icon: Megaphone },
      { href: "/dashboard/estudiante/calendario", label: "Calendario", icon: Calendar },
    ]
  },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  const secciones =
    role === "TEACHER" ? menuProfesor :
    role === "STUDENT" ? menuEstudiante :
    menuAdmin

  return (
    <aside className="w-64 min-h-screen bg-[#1e3a5f] text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full object-cover border-2 border-blue-400 shadow"
          />
          <div>
            <p className="text-[10px] text-blue-300 font-medium uppercase tracking-widest">IESTP</p>
            <h1 className="text-xs font-bold leading-tight text-white">Suiza — Pucallpa</h1>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {secciones.map((seccion) => (
          <div key={seccion.label}>
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest px-3 mb-1">
              {seccion.label}
            </p>
            <div className="space-y-0.5">
              {seccion.items.map((item) => {
                const activo = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      activo
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={17} className={activo ? "text-white" : "text-blue-300"} />
                    <span>{item.label}</span>
                    {activo && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium text-blue-200"
        >
          <LogOut size={17} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}