import { prisma } from "@/lib/prisma"

export async function logActivity(userId: string, action: string, entity?: string, entityId?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
      },
    })
  } catch (error) {
    console.error("Error writing activity log:", error)
  }
}
