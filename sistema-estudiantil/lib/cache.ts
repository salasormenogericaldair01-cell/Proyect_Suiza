type CacheEntry = {
  value: any
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry>()

/**
 * Obtiene un valor de la caché si no ha expirado.
 */
export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key) // Eliminar si ya expiró
    return null
  }

  return entry.value as T
}

/**
 * Guarda un valor en la caché con un tiempo de vida (TTL) en segundos.
 */
export function setCache(key: string, value: any, ttlSeconds: number = 60): void {
  const expiresAt = Date.now() + ttlSeconds * 1000
  cacheStore.set(key, { value, expiresAt })
}

/**
 * Elimina una clave de la caché.
 */
export function deleteCache(key: string): void {
  cacheStore.delete(key)
}

/**
 * Limpia toda la caché.
 */
export function clearCache(): void {
  cacheStore.clear()
}

/**
 * Función de conveniencia para envolver consultas y cachearlas.
 */
export async function wrapCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = getCache<T>(key)
  if (cached !== null) {
    console.log(`[CACHE HIT] Retornando datos cacheados para la clave: ${key}`)
    return cached
  }

  console.log(`[CACHE MISS] Consultando base de datos para la clave: ${key}`)
  const value = await fn()
  setCache(key, value, ttlSeconds)
  return value
}
