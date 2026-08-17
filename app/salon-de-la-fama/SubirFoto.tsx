'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

/** Botón chico para subir/reemplazar una foto (de torneo o de campeón) a
 * Supabase Storage y guardar la URL pública en la fila correspondiente.
 * Solo se muestra donde el caller ya verificó permisos (organizador/admin);
 * la escritura en la tabla igual queda protegida por RLS. */
export default function SubirFoto({ tabla, id, campo, label }: { tabla: 'tournaments' | 'campeonatos'; id: string; campo: string; label: string }) {
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

  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: loading ? 'not-allowed' : 'pointer',
      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6,
      color: 'var(--gold)', padding: '4px 10px', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5,
    }}>
      {loading ? 'Subiendo…' : `📷 ${label}`}
      <input type="file" accept="image/*" onChange={handleFile} disabled={loading} style={{ display: 'none' }} />
      {error && <span style={{ color: '#f87171', marginLeft: 6 }}>{error}</span>}
    </label>
  )
}
