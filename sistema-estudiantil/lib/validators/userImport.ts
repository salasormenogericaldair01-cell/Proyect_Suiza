import { z } from "zod";
import { Role } from "@prisma/client";

// Helper to transform empty strings to undefined
const emptyToUndefined = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() === "") {
    return undefined;
  }
  return val;
}, z.string().optional());

const BaseUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").transform(val => val.trim()),
  email: z.string().email("El formato del correo es inválido").transform(val => val.trim().toLowerCase()),
  phone: emptyToUndefined,
});

export const ImportUserSchema = z.discriminatedUnion("role", [
  BaseUserSchema.extend({
    role: z.literal(Role.STUDENT),
    career: z.string().min(1, "La carrera es requerida para estudiantes").transform(val => val.trim()),
    cycle: z.string().min(1, "El ciclo es requerido para estudiantes").transform(val => val.trim()),
    studentCode: emptyToUndefined,
    parentEmail: emptyToUndefined, // Optional parent link by email
  }),
  BaseUserSchema.extend({
    role: z.literal(Role.TEACHER),
  }),
  BaseUserSchema.extend({
    role: z.literal(Role.ADMIN),
  }),
  BaseUserSchema.extend({
    role: z.literal(Role.PARENT),
  }),
  BaseUserSchema.extend({
    role: z.literal(Role.SUPPORT),
  }),
]);

export type ImportUserType = z.infer<typeof ImportUserSchema>;
