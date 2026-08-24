'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ImageCropModal from '@/components/ImageCropModal'

/** Botón para subir/reemplazar una foto (de torneo o de campeón) a Supabase
 * Storage y guardar la URL pública en la fila correspondiente. Antes de
 * subir se abre un recortador (arrastrar + zoom) para elegir qué parte de
 * la imagen se usa. Solo se muestra donde el caller ya verificó permisos
 * (organizador/admin); la escritura en la tabla igual queda protegida
 * por RLS.
 *
 * variant="icon": botón circular chico pensado para superponer en una
 * esquina de la foto (banner de torneo, avatar de campeón).
 * variant="label": botón con texto, para cuando todavía no hay foto y el
 * ícono solo quedaría flotando sin contexto. */
export default function SubirFoto({ tabla, id, campo, label, variant = 'label', aspectRatio = 1 }: { tabla: 'tournaments' | 'campeonatos'; id: string; campo: string; label: string; variant?: 'icon' | 'label'; aspectRatio?: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Tiene que ser una imagen.'); return }
    if (file.size > 8 * 1024 * 1024) { setError('Máximo 8MB.'); return }
    setError('')
    setPendingFile(file)
  }

  const subirBlob = async (blob: Blob) => {
    setPendingFile(null)
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Iniciá sesión primero.'); setLoading(false); return }

    const path = `${tabla}/${id}-${Date.now()}.jpg`
    const { error: uploadErr } = await supabase.storage.from('tournament-photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (uploadErr) { setError(uploadErr.message); setLoading(false); return }

    const { data: pub } = supabase.storage.from('tournament-photos').getPublicUrl(path)
    const { error: dbErr } = await supabase.from(tabla).update({ [campo]: pub.publicUrl }).eq('id', id)
    if (dbErr) { setError(dbErr.message); setLoading(false); return }

    window.location.reload()
  }

  const boton = variant === 'icon' ? (
    <label
      title={label}
      // Este botón suele quedar superpuesto sobre una tarjeta que en sí
      // misma es un <Link> (ej. la foto del campeón dentro del link a
      // su perfil) — sin el stopPropagation, tocarlo también dispararía
      // la navegación del link de abajo. OJO: no usar preventDefault
      // acá, porque el <label> necesita su comportamiento por defecto
      // (abrir el selector de archivos del input asociado).
      onClick={e => e.stopPropagation()}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: '50%', cursor: loading ? 'not-allowed' : 'pointer',
        background: 'rgba(10,10,10,0.72)', border: '1px solid rgba(212,175,55,0.5)',
        color: 'var(--gold)', fontSize: 12, backdropFilter: 'blur(2px)',
      }}
    >
      {loading ? '…' : '📷'}
      <input type="file" accept="image/*" onChange={pickFile} disabled={loading} style={{ display: 'none' }} />
      {error && (
        <span style={{ position: 'absolute', top: '110%', right: 0, background: '#1a0a0a', border: '1px solid #f87171', color: '#f87171', fontSize: 9, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 5 }}>
          {error}
        </span>
      )}
    </label>
  ) : (
    <label className="btn btn-ghost-gold" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: loading ? 'not-allowed' : 'pointer',
      padding: '5px 12px', fontSize: 10,
    }}>
      {loading ? 'Subiendo…' : `📷 ${label}`}
      <input type="file" accept="image/*" onChange={pickFile} disabled={loading} style={{ display: 'none' }} />
      {error && <span style={{ color: '#f87171', marginLeft: 6 }}>{error}</span>}
    </label>
  )

  return (
    <>
      {boton}
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          aspectRatio={aspectRatio}
          onCancel={() => setPendingFile(null)}
          onConfirm={subirBlob}
        />
      )}
    </>
  )
}
