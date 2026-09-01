'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ImageCropModal from '@/components/ImageCropModal'

/** Foto de perfil propia — misma mecánica de subida+recorte que SubirFoto
 *  (Salón de la Fama), pero la URL resultante se manda a /api/players/avatar
 *  en vez de escribirse directo a la tabla, para que quede en un solo lugar
 *  la lógica de qué se guarda. Se muestra apenas se sube, sin aprobación
 *  previa; la moderación es a posteriori vía reporte (ver ReportarAvatar). */
export default function SubirAvatar({ playerId }: { playerId: string }) {
  const router = useRouter()
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

    const path = `avatars/${playerId}-${Date.now()}.jpg`
    const { error: uploadErr } = await supabase.storage.from('tournament-photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (uploadErr) { setError(uploadErr.message); setLoading(false); return }

    const { data: pub } = supabase.storage.from('tournament-photos').getPublicUrl(path)
    const res = await fetch('/api/players/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: pub.publicUrl }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al guardar la foto.')
      return
    }
    router.refresh()
  }

  return (
    <>
      <label
        title="Subir foto de perfil"
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
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          aspectRatio={1}
          onCancel={() => setPendingFile(null)}
          onConfirm={subirBlob}
        />
      )}
    </>
  )
}
