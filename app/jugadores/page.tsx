import { Suspense } from 'react'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import TierLegend from '@/components/TierLegend'
import RankingContent from './RankingContent'

// Cáscara 100% estática a propósito: no lee searchParams acá (eso es
// justo lo que le impedía a Next.js cachear esta página — el filtrado
// ahora corre en el cliente, contra /api/jugadores, que sí cachea por
// combinación de query string). Ver ese route para el detalle.
export const metadata: Metadata = { title: 'Ranking — CoR Tournament Stats' }

export default function JugadoresPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1.5 }}>
                Ranking
              </h1>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
              Champions of Regnum — Rankings y estadísticas
            </p>
          </div>
          <TierLegend />
        </div>

        <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Cargando...</div>}>
          <RankingContent />
        </Suspense>

      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
