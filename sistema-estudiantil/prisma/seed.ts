import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  await prisma.user.upsert({
    where: { email: "admin@sistema.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@sistema.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log("Usuario admin creado correctamente")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())