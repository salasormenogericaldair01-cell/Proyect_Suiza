"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<"login" | "forgot" | "reset">("login")
  
  // Login fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Forgot fields
  const [forgotEmail, setForgotEmail] = useState("")
  
  // Reset fields
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Status messages
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  // Listen for view and token from URL params
  useEffect(() => {
    const viewParam = searchParams.get("view")
    const tokenParam = searchParams.get("token")

    if (viewParam === "reset" || tokenParam) {
      setView("reset")
      if (tokenParam) {
        setResetToken(tokenParam)
      }
    } else if (viewParam === "forgot") {
      setView("forgot")
    }
  }, [searchParams])

  // Clear messages when view changes
  const handleViewChange = (newView: "login" | "forgot" | "reset") => {
    setView(newView)
    setError("")
    setSuccess("")
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("Si tu correo está registrado, recibirás un código para restablecer tu contraseña.")
        // Limpiamos el input
        setForgotEmail("")
        // Transicionamos a la pantalla de reset después de 3 segundos
        setTimeout(() => {
          setView("reset")
          setSuccess("")
        }, 3000)
      } else {
        setError(data.message || "Ocurrió un error")
      }
    } catch (err) {
      setError("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("Contraseña actualizada correctamente")
        setResetToken("")
        setNewPassword("")
        setConfirmPassword("")
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          setView("login")
          setSuccess("")
        }, 3000)
      } else {
        setError(data.message || "Código inválido o expirado")
      }
    } catch (err) {
      setError("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
        Sistema de Gestión Estudiantil
      </h1>
      
      {view === "login" && (
        <>
          <p className="text-center text-gray-500 mb-6">Inicia sesión para continuar</p>
          
          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => handleViewChange("forgot")}
                  className="text-xs text-blue-600 hover:underline hover:text-blue-700 transition font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </>
      )}

      {view === "forgot" && (
        <>
          <p className="text-center text-gray-500 mb-6">Recupera tu acceso</p>
          
          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>

            <div className="flex justify-between items-center text-sm pt-2">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-blue-600 hover:underline hover:text-blue-700 transition font-medium cursor-pointer"
              >
                Volver al inicio
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("reset")}
                className="text-gray-500 hover:underline hover:text-gray-700 transition font-medium cursor-pointer"
              >
                Ya tengo un código
              </button>
            </div>
          </form>
        </>
      )}

      {view === "reset" && (
        <>
          <p className="text-center text-gray-500 mb-6">Restablece tu contraseña</p>
          
          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de recuperación</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg tracking-wider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>

            <div className="text-center text-sm pt-2">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-blue-600 hover:underline hover:text-blue-700 transition font-medium cursor-pointer"
              >
                Cancelar y volver
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center border border-gray-100">
          <p className="text-gray-500">Cargando...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  )
}