'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { thumbnailYoutube } from '@/lib/youtube'

/** Botón + modal para compartir un video de YouTube o el link de tu
 * canal de Kick. El estado de sesión se resuelve acá adentro, en un
 * client component aparte de la página — así /multimedia (Server
 * Component) se puede cachear sin que la sesión del usuario se lo
 * impida (mismo motivo por el que se cayó el cache de /jugadores). */
export default function CompartirContenido() {
  const router = useRouter()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<'youtube' | 'kick'>('youtube')
  const [titulo, setTitulo] = useState('')
  const [url, setUrl] = useState('')
  const [torneoId, setTorneoId] = useState('')
  const [torneos, setTorneos] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('players').select('id').eq('user_id', user.id).single()
      if (data) setPlayerId(data.id)
    })
  }, [])

  const abrir = async () => {
    setOpen(true)
    if (torneos.length === 0) {
      const supabase = createClient()
      const { data } = await supabase.from('tournaments').select('id, nombre').order('created_at', { ascending: false }).limit(50)
      setTorneos(data ?? [])
    }
  }

  const compartir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerId || !url.trim() || !titulo.trim()) return
    setLoading(true); setError('')

    const supabase = createClient()
    const { error: insErr } = await supabase.from('highlights').insert({
      titulo: titulo.trim(),
      video_url: url.trim(),
      thumbnail_url: tipo === 'youtube' ? thumbnailYoutube(url.trim()) : null,
      tipo,
      jugador_id: playerId,
      torneo_id: torneoId || null,
    })

    setLoading(false)
    if (insErr) { setError('No se pudo compartir. Revisá el link.'); return }
    setOpen(false); setTitulo(''); setUrl(''); setTorneoId('')
    router.refresh()
  }

  if (!playerId) return null

  return (
    <>
      <button type="button" onClick={abrir} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 12 }}>
        + Compartir
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 18, letterSpacing: 1 }}>Compartir contenido</h2>

            <form onSubmit={compartir} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="segmented">
                <button type="button" onClick={() => setTipo('youtube')} className={`segmented-btn${tipo === 'youtube' ? ' is-active' : ''}`}>▶ YouTube</button>
                <button type="button" onClick={() => setTipo('kick')} className={`segmented-btn${tipo === 'kick' ? ' is-active' : ''}`}>🟢 Kick</button>
              </div>

              <input
                value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder={tipo === 'youtube' ? 'Título del video' : 'Título (ej. "Mi canal de Kick")'}
                maxLength={100} className="field"
              />
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder={tipo === 'youtube' ? 'Link del video de YouTube' : 'Link de tu canal de Kick'}
                className="field"
              />
              {torneos.length > 0 && (
                <select value={torneoId} onChange={e => setTorneoId(e.target.value)} className="field">
                  <option value="">Sin torneo asociado (opcional)</option>
                  {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}

              {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={loading || !url.trim() || !titulo.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? 'Compartiendo...' : 'COMPARTIR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
