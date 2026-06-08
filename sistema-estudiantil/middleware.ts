import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const role = (req.auth?.user as unknown as { role: string })?.role
  const pathname = req.nextUrl.pathname

  const isAuthPage = pathname.startsWith("/login")
  const isDashboard = pathname.startsWith("/dashboard")

  // Si no está logueado e intenta entrar al dashboard → login
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Si está logueado e intenta ir al login → redirigir según rol
  if (isAuthPage && isLoggedIn) {
    return redirectByRole(role, req.url)
  }

  // Redirigir profesor y estudiante fuera del dashboard de admin
  if (isLoggedIn && pathname === "/dashboard" && role === "TEACHER") {
    return NextResponse.redirect(new URL("/dashboard/profesor", req.url))
  }
  if (isLoggedIn && pathname === "/dashboard" && role === "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard/estudiante", req.url))
  }

  // Proteger rutas de admin: solo ADMIN y SUPPORT
  const isAdminRoute =
    pathname.startsWith("/dashboard/usuarios") ||
    pathname.startsWith("/dashboard/estudiantes") ||
    pathname.startsWith("/dashboard/profesores") ||
    pathname.startsWith("/dashboard/materias") ||
    pathname.startsWith("/dashboard/reportes")

  if (isAdminRoute && role !== "ADMIN" && role !== "SUPPORT") {
    return redirectByRole(role, req.url)
  }

  // Proteger rutas de profesor: solo TEACHER y ADMIN
  const isTeacherRoute = pathname.startsWith("/dashboard/profesor")
  if (isTeacherRoute && role !== "TEACHER" && role !== "ADMIN") {
    return redirectByRole(role, req.url)
  }

  // Proteger rutas de estudiante: solo STUDENT y ADMIN
  const isStudentRoute = pathname.startsWith("/dashboard/estudiante")
  if (isStudentRoute && role !== "STUDENT" && role !== "ADMIN") {
    return redirectByRole(role, req.url)
  }

  return NextResponse.next()
})

function redirectByRole(role: string | undefined, url: string) {
  switch (role) {
    case "ADMIN":
    case "SUPPORT":
      return NextResponse.redirect(new URL("/dashboard", url))
    case "TEACHER":
      return NextResponse.redirect(new URL("/dashboard/profesor", url))
    case "STUDENT":
      return NextResponse.redirect(new URL("/dashboard/estudiante", url))
    default:
      return NextResponse.redirect(new URL("/login", url))
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}