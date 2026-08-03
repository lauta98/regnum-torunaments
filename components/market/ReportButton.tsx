'use client'
import { useState } from 'react'

const MOTIVOS = [
  'Precio irreal o engañoso',
  'Ítem inexistente o falso',
  'Vendedor no responde',
  'Publicación duplicada',
  'Contenido inapropiado',
  'Otro',
]

export default function ReportButton({ listingId, currentUserId, sellerId }: { listingId: string; currentUserId: string | null; sellerId: string }) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  if (!currentUserId || currentUserId === sellerId) return null

  const handleSubmit = async () => {
    if (!reason) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/reportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, reason, details }),
      })
      const json = await res.json()
      if (json.ok) {
        setSent(true)
      } else {
        setErr(json.error || 'Error al enviar el reporte')
      }
    } catch {
      setErr('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--text-muted)', padding: '4px 0',
          fontFamily: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted',
        }}
      >
        Reportar publicación
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
            borderRadius: 12, padding: 24, maxWidth: 380, width: '100%',
          }} onClick={e => e.stopPropagation()}>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <p className="cinzel" style={{ color: 'var(--gold)', marginBottom: 8 }}>Reporte enviado</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gracias por ayudar a mantener el mercado limpio.</p>
                <button onClick={() => setOpen(false)} style={{ marginTop: 16, fontSize: 12, padding: '6px 20px', borderRadius: 8, background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
              </div>
            ) : (
              <>
                <h3 className="cinzel" style={{ fontSize: 14, color: '#E24B4A', marginBottom: 16 }}>⚑ Reportar publicación</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Seleccioná el motivo del reporte:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {MOTIVOS.map(m => (
                    <button key={m} onClick={() => setReason(m)} style={{
                      padding: '8px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                      fontSize: 13, fontFamily: 'inherit',
                      background: reason === m ? 'rgba(226,75,74,0.12)' : 'var(--dark-surface)',
                      border: `1px solid ${reason === m ? 'rgba(226,75,74,0.5)' : 'var(--dark-border)'}`,
                      color: reason === m ? '#E24B4A' : 'var(--text-muted)',
                    }}>
                      {reason === m ? '● ' : '○ '}{m}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Detalles adicionales (opcional)"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={2}
                  style={{ width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
                />

                {err && (
                  <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.4)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                    <p style={{ color: '#E24B4A', fontSize: 12, margin: 0 }}>⚠ {err}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'none', border: '1px solid var(--dark-border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={!reason || loading} style={{ flex: 2, padding: '9px 0', borderRadius: 8, background: reason ? 'rgba(226,75,74,0.85)' : 'var(--dark-surface)', border: 'none', color: 'white', cursor: reason ? 'pointer' : 'default', fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Enviando...' : 'ENVIAR REPORTE'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
