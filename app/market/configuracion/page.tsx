'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import ImageCropModal from '@/components/ImageCropModal'

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'inherit',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=900&h=200&fit=crop', // espacio
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&h=200&fit=crop', // castillo
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=200&fit=crop', // bosque oscuro
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&h=200&fit=crop', // montañas
  'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=900&h=200&fit=crop', // pergamino
]

export default function ConfiguracionPage() {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [username, setUsername]       = useState('')
  const [avatarUrl, setAvatarUrl]     = useState('')
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null)
  const [premiumCredits, setPremiumCredits] = useState(0)
  const [isPremium, setIsPremium]     = useState(false)
  const [premiumStep, setPremiumStep] = useState<'idle' | 'waiting' | 'sent'>('idle')
  const [matecitos, setMatecitos]     = useState(0)
  const [regnumNick, setRegnumNick] = useState('')
  const [discord, setDiscord]       = useState('')
  const [whatsapp, setWhatsapp]     = useState('')
  const [servidor, setServidor]     = useState('Ra')
  const [bio, setBio]               = useState('')
  const [bannerUrl, setBannerUrl]   = useState('')
  const [nameColor, setNameColor]   = useState('')
  const [error, setError]           = useState('')
  const [cropAvatarFile, setCropAvatarFile] = useState<File | null>(null)
  const [cropBannerFile, setCropBannerFile] = useState<File | null>(null)
  const fileRef       = useRef<HTMLInputElement>(null)
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, regnum_nick, discord, whatsapp, bio, banner_url, avatar_url, name_color, is_premium, matecitos_count, servidor, premium_until, premium_credits')
        .eq('id', data.user.id)
        .single()
      if (profile) {
        setUsername(profile.username || '')
        setRegnumNick(profile.regnum_nick || '')
        setDiscord(profile.discord || '')
        setWhatsapp(profile.whatsapp || '')
        setServidor(profile.servidor || 'Ra')
        setBio(profile.bio || '')
        setBannerUrl(profile.banner_url || '')
        setAvatarUrl(profile.avatar_url || '')
        setNameColor(profile.name_color || '')
        setIsPremium(profile.is_premium || false)
        setMatecitos(profile.matecitos_count || 0)
        setPremiumUntil(profile.premium_until || null)
        setPremiumCredits(profile.premium_credits || 0)
      }
      setLoading(false)
    })
  }, [])

  const uploadAvatar = async (blob: Blob) => {
    setCropAvatarFile(null)
    setUploadingAvatar(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingAvatar(false); return }
    const path = `${user.id}/avatar.jpg`
    const { error: uploadError } = await supabase.storage
      .from('profile-banners')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (uploadError) { setError('Error al subir avatar: ' + uploadError.message); setUploadingAvatar(false); return }
    const { data: urlData } = supabase.storage.from('profile-banners').getPublicUrl(path)
    const bustedUrl = `${urlData.publicUrl}?t=${Date.now()}`
    setAvatarUrl(bustedUrl)
    await fetch('/api/market/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: urlData.publicUrl }),
    })
    setUploadingAvatar(false)
  }

  const uploadBanner = async (blob: Blob) => {
    setCropBannerFile(null)
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const path = `${user.id}/banner.jpg`

    const { error: uploadError } = await supabase.storage
      .from('profile-banners')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) {
      setError('Error al subir imagen: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('profile-banners')
      .getPublicUrl(path)

    setBannerUrl(`${urlData.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  const save = async () => {
    setError('')
    setSaving(true)
    const res = await fetch('/api/market/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regnum_nick: regnumNick.trim() || null,
        discord: discord.trim() || null,
        whatsapp: whatsapp.trim() || null,
        bio: bio.trim() || null,
        banner_url: bannerUrl.trim() || null,
        name_color: nameColor || null,
        servidor: servidor || 'Ra',
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Error al guardar'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div style={{ padding: '40px 20px', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ height: 400, background: 'var(--dark-card)', borderRadius: 12 }} />
    </div>
  )

  return (
    <div style={{ padding: '24px 20px 48px', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/market" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Volver</Link>
        <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>⚙ Configuración</h1>
        {matecitos > 0 && (
          <span style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 10px', borderRadius: 12 }}>
            🧉 ×{matecitos}
          </span>
        )}
      </div>

      {/* ── PERFIL ── */}
      <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 20 }}>DATOS DEL PERFIL</div>

        {/* Username (read-only) */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Usuario en Regnum Market</label>
          <input style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} value={username} readOnly />
        </div>

        {/* Regnum Nick */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nick en Regnum Online</label>
          <input style={inp} placeholder="Ej: Daenerys, Xzavier..." value={regnumNick} onChange={e => setRegnumNick(e.target.value)} maxLength={40} />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Bio / Descripción del mercader</label>
          <textarea
            style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
            placeholder="Contá algo sobre vos o tus artículos..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={300}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{bio.length}/300 caracteres</p>
        </div>
      </div>

      {/* ── PREMIUM ── */}
      <div style={{
        background: isPremium ? 'rgba(245,158,11,0.05)' : 'var(--dark-card)',
        border: `1px solid ${isPremium ? 'rgba(245,158,11,0.4)' : 'var(--dark-border)'}`,
        borderRadius: 12, padding: 24, marginBottom: 16,
      }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: isPremium ? '#F59E0B' : 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>
          🧉 MERCADER ELITE
        </div>

        {isPremium && premiumUntil ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                ✓ Premium activo hasta <strong>{new Date(premiumUntil).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--dark-surface)', borderRadius: 8, padding: '12px 16px' }}>
              <span style={{ fontSize: 22 }}>★</span>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {premiumCredits} crédito{premiumCredits !== 1 ? 's' : ''} restante{premiumCredits !== 1 ? 's' : ''} este mes
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Máximo 6 por semana. El contador semanal se reinicia cada lunes.</p>
              </div>
            </div>

            {/* Avatar upload — solo premium */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Foto de perfil
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'var(--burgundy)', border: '2px solid rgba(245,158,11,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Cinzel',serif", fontSize: 20, color: 'var(--gold-light)',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropAvatarFile(f) }} />
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      fontSize: 12, padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                      background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                      color: 'var(--text-muted)', fontFamily: 'inherit',
                    }}>
                    {uploadingAvatar ? 'Subiendo...' : '📁 Cambiar foto'}
                  </button>
                  {avatarUrl && (
                    <button onClick={async () => {
                      setAvatarUrl('')
                      await fetch('/api/market/configuracion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: null }) })
                    }} style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
              Con <strong style={{ color: '#F59E0B' }}>Mercader Elite</strong> obtenés 6 destacados semanales incluidos,
              foto de perfil personalizada y prioridad en el carrusel del mercado.
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>$3.000</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ARS · 30 días</span>
            </div>
            {premiumStep === 'idle' && (
              <>
                <a
                  href="https://cafecito.app/lautarey"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    await fetch('/api/market/premium/solicitar', { method: 'POST' })
                    setPremiumStep('waiting')
                  }}
                  style={{
                    display: 'inline-block', fontSize: 12, padding: '8px 18px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #b45309, #F59E0B)', color: '#000',
                    fontFamily: "'Cinzel',serif", fontWeight: 700, letterSpacing: 1, textDecoration: 'none',
                  }}>
                  🧉 ACTIVAR PREMIUM
                </a>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                  Pagá $3.000 ARS en Cafecito · Activamos en minutos
                </p>
              </>
            )}

            {premiumStep === 'waiting' && (
              <div style={{ background: 'var(--dark-surface)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  ☕ Se abrió Cafecito. Una vez que completaste el pago, avisanos:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPremiumStep('sent')}
                    style={{
                      fontSize: 12, padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                      background: 'rgba(91,201,139,0.12)', border: '1px solid rgba(91,201,139,0.4)',
                      color: '#5BC98B', fontFamily: "'Cinzel',serif", fontWeight: 700,
                    }}>
                    ✓ Ya pagué en Cafecito
                  </button>
                  <button
                    onClick={() => setPremiumStep('idle')}
                    style={{
                      fontSize: 12, padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                      background: 'none', border: '1px solid var(--dark-border)',
                      color: 'var(--text-muted)', fontFamily: 'inherit',
                    }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {premiumStep === 'sent' && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>
                  🧉 ¡Solicitud recibida!
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Verificamos tu pago en Cafecito y activamos el Premium en minutos.
                  Si tardamos más de 30 min, escribinos por Discord.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── APARIENCIA ── */}
      <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 20 }}>APARIENCIA DEL PERFIL</div>

        {/* Banner */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Banner del perfil</label>

          {/* Preview */}
          {bannerUrl && (
            <div style={{ width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
              <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setBannerUrl('')} style={{
                position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none',
                color: 'white', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11,
              }}>✕ Quitar</button>
            </div>
          )}

          {/* Subir imagen */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropBannerFile(f) }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: 12, padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
              background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
              color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 10, marginRight: 8,
            }}
          >
            {uploading ? 'Subiendo...' : '📁 Subir imagen'}
          </button>

          {/* Presets */}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>O elegí uno:</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BANNER_PRESETS.map((url, i) => (
              <div
                key={i}
                onClick={() => setBannerUrl(url)}
                style={{
                  width: 72, height: 36, borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                  border: bannerUrl === url ? '2px solid var(--gold)' : '2px solid transparent',
                  flexShrink: 0,
                }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Color del nombre */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Color del nombre</label>
            {!isPremium && (
              <span style={{ fontSize: 10, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 8px', borderRadius: 10 }}>
                🧉 Premium
              </span>
            )}
          </div>
          {isPremium ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={nameColor || '#C9A84C'}
                onChange={e => setNameColor(e.target.value)}
                style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--dark-border)', cursor: 'pointer', background: 'none', padding: 2 }}
              />
              <span className="cinzel" style={{ fontSize: 16, color: nameColor || 'var(--gold)', fontWeight: 700 }}>
                {username}
              </span>
              <button onClick={() => setNameColor('')} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Restablecer
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Destacá una publicación con un 🧉 Matecito para desbloquear esta función.
            </div>
          )}
        </div>
      </div>

      {/* ── CONTACTO ── */}
      <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 20 }}>CONTACTO</div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Discord</label>
          <input style={inp} placeholder="Ej: usuario#1234 o discord.gg/mi-server" value={discord} onChange={e => setDiscord(e.target.value)} maxLength={100} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>WhatsApp (con código de país)</label>
          <input style={inp} placeholder="Ej: +549111234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} maxLength={20} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E24B4A', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#22C55E', marginBottom: 16 }}>
          ✓ Cambios guardados correctamente
        </div>
      )}

      <button
        onClick={save}
        disabled={saving || uploading}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 8, cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
          color: 'var(--dark-bg)', border: 'none',
          fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: 1,
          opacity: saving || uploading ? 0.7 : 1,
        }}
      >
        {saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
      </button>

      {cropAvatarFile && (
        <ImageCropModal
          file={cropAvatarFile}
          aspectRatio={1}
          onCancel={() => setCropAvatarFile(null)}
          onConfirm={uploadAvatar}
        />
      )}
      {cropBannerFile && (
        <ImageCropModal
          file={cropBannerFile}
          aspectRatio={4.5}
          onCancel={() => setCropBannerFile(null)}
          onConfirm={uploadBanner}
        />
      )}
    </div>
  )
}
