import { auth } from "@/auth"
import { Role } from "@prisma/client"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

const ADMIN_SUPPORT = new Set<Role>(["ADMIN", "SUPPORT"])
const ADMIN_TEACHER = new Set<Role>(["ADMIN", "TEACHER"])
const ADMIN_SUPPORT_TEACHER = new Set<Role>(["ADMIN", "SUPPORT", "TEACHER"])

export async function canManageUsers(): Promise<boolean> {
  const user = await getSessionUser()
  return Boolean(user && ADMIN_SUPPORT.has(user.role))
}

export async function canDeleteUser(): Promise<boolean> {
  const user = await getSessionUser()
  return Boolean(user && user.role === "ADMIN")
}

export async function canManageStudents(): Promise<boolean> {
  const user = await getSessionUser()
  // Only ADMIN can edit/create/delete students. SUPPORT can view.
  return Boolean(user && user.role === "ADMIN")
}

export async function canManageTeachers(): Promise<boolean> {
  const user = await getSessionUser()
  // Only ADMIN can edit/create/delete teachers. SUPPORT can view.
  return Boolean(user && user.role === "ADMIN")
}

export async function canManageSubjects(): Promise<boolean> {
  const user = await getSessionUser()
  // Only ADMIN can edit/create/delete subjects. SUPPORT can view.
  return Boolean(user && user.role === "ADMIN")
}

export async function canManageGrades(): Promise<boolean> {
  const user = await getSessionUser()
  return Boolean(user && ADMIN_TEACHER.has(user.role))
}

export async function canManageAttendance(): Promise<boolean> {
  const user = await getSessionUser()
  return Boolean(user && ADMIN_TEACHER.has(user.role))
}

export async function canManageAnnouncements(): Promise<boolean> {
  const user = await getSessionUser()
  return Boolean(user && ADMIN_SUPPORT_TEACHER.has(user.role))
}

export async function canManageEvents(): Promise<boolean> {
  const user = await getSessionUser()
  // Only ADMIN can create/edit/delete events on the calendar
  return Boolean(user && user.role === "ADMIN")
}
