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
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, background: 'var(--gold)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                  Ranking Oficial
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Tabla de Honor &amp; Registro de Guerra
              </h1>
              <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
                Champions of Regnum — Clasificación competitiva de combatientes.
              </p>
            </div>
            <TierLegend />
          </div>
        </div>

        <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>Cargando...</div>}>
          <RankingContent />
        </Suspense>

      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 40 }}>
        CoR Tournament Stats © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
