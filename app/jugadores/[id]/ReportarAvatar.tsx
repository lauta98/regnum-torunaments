'use client'
import { useState } from 'react'

export default function ReportarAvatar({ targetId }: { targetId: string }) {
  const [open, setOpen]       = useState(false)
  const [motivo, setMotivo]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/players/reportar-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, motivo: motivo.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setMotivo('') }, 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al enviar el reporte.')
    }
  }

  const close = () => { setOpen(false); setMotivo(''); setError('') }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Reportar esta foto de perfil"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(244,67,54,0.4)', fontSize: 13, padding: 3, display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F44336')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,67,54,0.4)')}
      >
        🚩
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={close}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 400 }}
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#4CAF50' }}>Reporte enviado. Un administrador lo revisará.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#F44336', marginBottom: 6, letterSpacing: 1 }}>
                  Reportar foto de perfil
                </h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                  Contá por qué esta foto no cumple las normas (contenido NSFW, ofensivo, etc.) — un admin la revisa antes de tomar una decisión.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <textarea
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej: la foto tiene contenido sexual explícito..."
                    rows={4}
                    maxLength={500}
                    className="field"
                    style={{ resize: 'vertical', borderColor: 'rgba(244,67,54,0.3)' }}
                  />
                  {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={close} className="btn btn-ghost" style={{ flex: 1 }}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading || !motivo.trim()} className="btn" style={{ flex: 1, background: motivo.trim() ? '#F44336' : 'rgba(244,67,54,0.3)', color: '#fff' }}>
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
