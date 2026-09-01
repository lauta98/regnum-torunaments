'use client'
import { useSearchParams } from 'next/navigation'

/** Separado en su propio client component a propósito: leer
 * `searchParams` en el Server Component de la página (aunque sea para
 * este único caso raro) le impide a Next.js cachear el resto de la
 * home, que no tiene nada personalizado. Así el aviso de error sigue
 * funcionando pero no le cuesta el cache a toda la página. */
export default function ErrorBanner() {
  const params = useSearchParams()
  if (params.get('error') !== 'organizador') return null
  return (
    <div style={{
      background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
      borderRadius: 'var(--radius-sm)', padding: '12px 18px', marginBottom: 20,
      color: '#f87171', fontSize: 13, fontFamily: 'var(--font-display)',
    }}>
      Todavía no tenés permisos de organizador para crear torneos — pedile a un admin que te los otorgue.
    </div>
  )
}
