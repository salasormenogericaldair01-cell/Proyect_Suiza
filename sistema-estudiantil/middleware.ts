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

  if (isLoggedIn && pathname === "/dashboard" && role !== "ADMIN" && role !== "SUPPORT") {
    return redirectByRole(role, req.url)
  }

  // Proteger rutas de admin: solo ADMIN y SUPPORT
  const isAdminRoute =
    pathname.startsWith("/dashboard/usuarios") ||
    pathname.startsWith("/dashboard/estudiantes") ||
    pathname.startsWith("/dashboard/profesores") ||
    pathname.startsWith("/dashboard/materias") ||
    pathname.startsWith("/dashboard/notas") ||
    pathname.startsWith("/dashboard/asistencia") ||
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

  const isParentRoute = pathname.startsWith("/dashboard/familia")
  if (isParentRoute && role !== "PARENT" && role !== "ADMIN") {
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
    case "PARENT":
      return NextResponse.redirect(new URL("/dashboard/familia", url))
    default:
      return NextResponse.redirect(new URL("/api/auth/signout", url))
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
