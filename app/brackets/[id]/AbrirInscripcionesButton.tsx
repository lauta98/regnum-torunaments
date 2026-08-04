'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AbrirInscripcionesButton({ torneoId }: { torneoId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const abrir = async () => {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('tournaments')
      .update({ estado: 'inscripciones' })
      .eq('id', torneoId)

    if (err) { setError(err.message); setLoading(false); return }
    window.location.reload()
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Este torneo todavía es un borrador
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Los jugadores no pueden inscribirse hasta que abras las inscripciones.
        </div>
      </div>
      <button onClick={abrir} disabled={loading} style={{
        background: 'var(--gold)', color: '#000', padding: '10px 20px', borderRadius: 8, border: 'none',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', flexShrink: 0,
      }}>
        {loading ? 'Abriendo...' : '🔓 Abrir inscripciones'}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 12, width: '100%' }}>{error}</p>}
    </div>
  )
}
