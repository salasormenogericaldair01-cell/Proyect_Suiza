import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "./Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const userName = session.user?.name ?? "Usuario"
  const userRole = (session.user as { role?: string })?.role ?? ""

  const rolLabel: Record<string, string> = {
    ADMIN: "Administrador",
    TEACHER: "Profesor",
    STUDENT: "Estudiante",
    SUPPORT: "Soporte",
  }

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
    <Sidebar role={userRole} />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm sticky top-0 z-10">
          <div />
          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {/* Usuario */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
                <p className="text-xs text-gray-400">{rolLabel[userRole] ?? userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}