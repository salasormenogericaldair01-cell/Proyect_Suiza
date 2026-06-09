import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ImportUserSchema } from "@/lib/validators/userImport";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { auth } from "@/auth";

export async function POST(req: Request) {
  // Check authorization
  const session = await auth();
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPPORT")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { users } = await req.json();
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 });
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as { row: number; email?: string; error: string }[],
      credentials: [] as { name: string; email: string; role: string; tempPassword?: string }[],
    };

    for (const [index, userData] of users.entries()) {
      const rowNum = index + 1;
      try {
        // Validate user data with Zod
        const validated = ImportUserSchema.parse(userData);

        // Check if user exists
        const exists = await prisma.user.findUnique({
          where: { email: validated.email },
        });

        let tempPassword = "";
        let hashedPassword = "";
        if (!exists) {
          // Generate temporary password only for new users
          tempPassword = crypto.randomBytes(8).toString("hex");
          hashedPassword = await bcrypt.hash(tempPassword, 10);
        }

        await prisma.$transaction(async (tx) => {
          // Upsert User
          const user = await tx.user.upsert({
            where: { email: validated.email },
            update: {
              name: validated.name,
              phone: validated.phone || null,
            },
            create: {
              name: validated.name,
              email: validated.email,
              password: hashedPassword,
              role: validated.role,
              phone: validated.phone || null,
            },
          });

          // Role-specific upsert
          if (validated.role === "STUDENT") {
            let parentDbId: string | null = null;
            if (validated.parentEmail) {
              const parentUser = await tx.user.findUnique({
                where: { email: validated.parentEmail },
                include: { parent: true },
              });
              if (parentUser && parentUser.role === "PARENT" && parentUser.parent) {
                parentDbId = parentUser.parent.id;
              }
            }

            await tx.student.upsert({
              where: { userId: user.id },
              update: {
                career: validated.career,
                cycle: validated.cycle,
                studentCode: validated.studentCode || null,
                ...(parentDbId && { parentId: parentDbId }),
              },
              create: {
                userId: user.id,
                career: validated.career,
                cycle: validated.cycle,
                studentCode: validated.studentCode || null,
                parentId: parentDbId,
              },
            });
          } else if (validated.role === "TEACHER") {
            await tx.teacher.upsert({
              where: { userId: user.id },
              update: {},
              create: {
                userId: user.id,
              },
            });
          } else if (validated.role === "PARENT") {
            await tx.parent.upsert({
              where: { userId: user.id },
              update: {},
              create: {
                userId: user.id,
              },
            });
          }

          if (exists) {
            results.updated++;
            results.credentials.push({
              name: user.name,
              email: user.email,
              role: user.role,
            });
          } else {
            results.imported++;
            results.credentials.push({
              name: user.name,
              email: user.email,
              role: user.role,
              tempPassword,
            });
          }
        });
      } catch (err: any) {
        let errorMsg = "Error desconocido";
        if (err instanceof Error) {
          errorMsg = err.message;
        } else if (err.errors && Array.isArray(err.errors)) {
          // Zod error formatting
          errorMsg = err.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
        }

        results.errors.push({
          row: rowNum,
          email: userData?.email || "Sin email",
          error: errorMsg,
        });
      }
    }

    return NextResponse.json(results);
  } catch (globalErr: any) {
    return NextResponse.json(
      { error: globalErr.message || "Error al procesar la petición" },
      { status: 500 }
    );
  }
}
