"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      router.push(`/login?view=reset&token=${encodeURIComponent(token)}`)
    } else {
      router.push("/login?view=forgot")
    }
  }, [router, token])

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Redirigiendo a la pantalla de restablecimiento...</p>
    </div>
  )
}

export default function ResetPasswordRedirect() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      }>
        <ResetPasswordRedirectContent />
      </Suspense>
    </div>
  )
}
