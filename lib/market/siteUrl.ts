/**
 * Devuelve el origin base del sitio con la siguiente prioridad:
 *
 * 1. window.location.origin  → siempre disponible en el cliente, soporta
 *    cualquier URL de preview de Vercel sin configuración extra.
 * 2. NEXT_PUBLIC_VERCEL_URL  → variable inyectada automáticamente por Vercel
 *    en cada deployment (sin el `https://`).
 * 3. NEXT_PUBLIC_SITE_URL    → override manual para producción.
 * 4. Hardcode de producción  → último fallback.
 */
export function getSiteOrigin(): string {
  // Cliente: usar el origin real de la pestaña actual
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // Servidor / build: usar la variable de Vercel (sin protocolo → añadir https)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Override manual (ej. variable en .env.local o en Vercel dashboard)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  return 'https://regnum-market.vercel.app'
}

/**
 * Construye la URL completa del callback de Supabase Auth.
 * @param next  Ruta interna a la que redirigir tras el callback (default: "/")
 */
export function getAuthCallbackUrl(next = '/'): string {
  const base = getSiteOrigin()
  const params = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
  return `${base}/auth/callback${params}`
}
