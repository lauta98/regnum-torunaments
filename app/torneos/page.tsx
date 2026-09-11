import { Suspense } from 'react'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import TorneosContent from './TorneosContent'

// Cáscara estática — no lee searchParams (ver app/api/jugadores/route.ts
// para el porqué). El filtrado corre en TorneosContent, contra
// /api/torneos.
export const metadata: Metadata = { title: 'Torneos' }

export default function TorneosPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* El título y el conteo viven dentro de TorneosContent, junto a los
            filtros — evita mostrar "Torneos" dos veces en la misma pantalla. */}
        <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>Cargando...</div>}>
          <TorneosContent />
        </Suspense>

      </main>
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      CoR Tournament Stats © 2026 — Champions of Regnum Community
    </footer>
  )
}
