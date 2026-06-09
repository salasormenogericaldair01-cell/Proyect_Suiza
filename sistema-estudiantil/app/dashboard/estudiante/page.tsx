import { auth } from "@/auth"

export default async function EstudiantePage() {
  const session = await auth()

  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel del estudiante</h1>
      <p className="mt-2 text-gray-600">
        Bienvenido, {session?.user?.name ?? "estudiante"}.
      </p>
    </section>
  )
}
