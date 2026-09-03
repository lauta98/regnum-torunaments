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
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1 }}>
            Torneos
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Todos los torneos de Champions of Regnum
          </p>
        </div>

        <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Cargando...</div>}>
          <TorneosContent />
        </Suspense>

      </main>
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
      CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
    </footer>
  )
}
