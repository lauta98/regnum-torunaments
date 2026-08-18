'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

/** Botón para subir/reemplazar una foto (de torneo o de campeón) a Supabase
 * Storage y guardar la URL pública en la fila correspondiente. Solo se
 * muestra donde el caller ya verificó permisos (organizador/admin); la
 * escritura en la tabla igual queda protegida por RLS.
 *
 * variant="icon": botón circular chico pensado para superponer en una
 * esquina de la foto (banner de torneo, avatar de campeón).
 * variant="label": botón con texto, para cuando todavía no hay foto y el
 * ícono solo quedaría flotando sin contexto. */
export default function SubirFoto({ tabla, id, campo, label, variant = 'label' }: { tabla: 'tournaments' | 'campeonatos'; id: string; campo: string; label: string; variant?: 'icon' | 'label' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Tiene que ser una imagen.'); return }
    if (file.size > 8 * 1024 * 1024) { setError('Máximo 8MB.'); return }

    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Iniciá sesión primero.'); setLoading(false); return }

    const ext = file.name.split('.').pop() || 'png'
    const path = `${tabla}/${id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('tournament-photos').upload(path, file)
    if (uploadErr) { setError(uploadErr.message); setLoading(false); return }

    const { data: pub } = supabase.storage.from('tournament-photos').getPublicUrl(path)
    const { error: dbErr } = await supabase.from(tabla).update({ [campo]: pub.publicUrl }).eq('id', id)
    if (dbErr) { setError(dbErr.message); setLoading(false); return }

    window.location.reload()
  }

  if (variant === 'icon') {
    return (
      <label
        title={label}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: '50%', cursor: loading ? 'not-allowed' : 'pointer',
          background: 'rgba(10,10,10,0.72)', border: '1px solid rgba(212,175,55,0.5)',
          color: 'var(--gold)', fontSize: 12, backdropFilter: 'blur(2px)',
        }}
      >
        {loading ? '…' : '📷'}
        <input type="file" accept="image/*" onChange={handleFile} disabled={loading} style={{ display: 'none' }} />
        {error && (
          <span style={{ position: 'absolute', top: '110%', right: 0, background: '#1a0a0a', border: '1px solid #f87171', color: '#f87171', fontSize: 9, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 5 }}>
            {error}
          </span>
        )}
      </label>
    )
  }

  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: loading ? 'not-allowed' : 'pointer',
      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6,
      color: 'var(--gold)', padding: '5px 12px', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5,
    }}>
      {loading ? 'Subiendo…' : `📷 ${label}`}
      <input type="file" accept="image/*" onChange={handleFile} disabled={loading} style={{ display: 'none' }} />
      {error && <span style={{ color: '#f87171', marginLeft: 6 }}>{error}</span>}
    </label>
  )
}
