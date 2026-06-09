import { auth } from "@/auth"

const USER_ADMIN_ROLES = new Set(["ADMIN", "SUPPORT"])

export async function canManageUsers() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role

  return Boolean(session && role && USER_ADMIN_ROLES.has(role))
}
