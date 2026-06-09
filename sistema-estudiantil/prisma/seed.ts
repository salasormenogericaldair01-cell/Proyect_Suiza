import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@sistema.com").trim().toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres")
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      isActive: true,
      role: "ADMIN",
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log("Usuario admin creado correctamente")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
