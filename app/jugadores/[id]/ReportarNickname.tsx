'use client'
import { useState } from 'react'

export default function ReportarNickname({ personajeId, nickname }: { personajeId: string; nickname: string }) {
  const [open, setOpen]       = useState(false)
  const [motivo, setMotivo]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim()) return
    setLoading(true)
    const res = await fetch('/api/personajes/reportar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personajeId, motivo: motivo.trim() }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); setTimeout(() => { setOpen(false); setDone(false); setMotivo('') }, 2000) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Reportar nickname" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(244,67,54,0.4)', fontSize: 14, padding: 4, display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F44336')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,67,54,0.4)')}>
        🚩
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#4CAF50' }}>Reporte enviado. Un administrador lo revisará.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#F44336', marginBottom: 6, letterSpacing: 1 }}>Reportar nickname</h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                  Reportás que <strong style={{ color: 'var(--text-secondary)' }}>{nickname}</strong> no le pertenece a quien lo registró.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Explicá por qué este nickname fue apropiado indebidamente..." rows={3}
                    className="field" style={{ resize: 'vertical', borderColor: 'rgba(244,67,54,0.3)' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                    <button type="submit" disabled={loading || !motivo.trim()} className="btn" style={{ flex: 1, background: '#F44336', color: '#fff' }}>
                      {loading ? 'Enviando...' : 'REPORTAR'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
