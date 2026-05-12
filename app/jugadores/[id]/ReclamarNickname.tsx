'use client'
import { useState } from 'react'

export default function ReclamarNickname({ personajeId, nickname }: { personajeId: string; nickname: string }) {
  const [open, setOpen]       = useState(false)
  const [motivo, setMotivo]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/personajes/reclamar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personajeId, motivo: motivo.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setMotivo('') }, 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al enviar el reclamo.')
    }
  }

  const close = () => { setOpen(false); setMotivo(''); setError('') }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Reclamar este personaje como mío"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,165,0,0.4)', fontSize: 14, padding: 4, display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#FFA500')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,165,0,0.4)')}
      >
        ⚑
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={close}
        >
          <div
            style={{ background: '#141414', border: '1px solid rgba(255,165,0,0.3)', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚑</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#4CAF50', letterSpacing: 0.5 }}>
                  Reclamo enviado. Un administrador lo revisará pronto.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#FFA500', marginBottom: 6, letterSpacing: 1 }}>
                  Reclamar personaje
                </h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                  ¿El personaje <strong style={{ color: 'var(--text-secondary)' }}>{nickname}</strong> te pertenece?
                  Explicá por qué y un admin lo verificará para transferirte la titularidad.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <textarea
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej: Es mi personaje principal desde hace 3 años, mi Discord es el mismo que uso en el foro del juego..."
                    rows={4}
                    maxLength={500}
                    style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 13px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical' }}
                  />
                  {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={close} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading || !motivo.trim()} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: motivo.trim() ? '#FFA500' : 'rgba(255,165,0,0.3)', color: motivo.trim() ? '#000' : 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, cursor: motivo.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                      {loading ? 'Enviando...' : 'RECLAMAR'}
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
