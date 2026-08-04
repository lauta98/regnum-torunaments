'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Header from '@/components/Header'

// Limpia el username de Discord para que cumpla el formato del marketplace
function sanitizeDiscordUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '_')       // espacios → guión bajo
    .replace(/[^a-z0-9_.]/g, '') // quitar chars inválidos
    .slice(0, 20)                // máximo 20 chars
}

export default function ElegirNombrePage() {
  const [username, setUsername]         = useState('')
  const [discordContact, setDiscordContact] = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [checking, setChecking]         = useState(false)
  const [available, setAvailable]       = useState<boolean | null>(null)
  const [preloaded, setPreloaded]       = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Cargar usuario de Discord si viene de OAuth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }

      const meta = data.user.user_metadata || {}
      // Discord OAuth manda el username en alguno de estos campos
      const discordRaw = meta.user_name || meta.preferred_username || meta.full_name || ''
      const discordTag  = meta.user_name || meta.preferred_username || ''

      if (discordRaw) {
        const cleaned = sanitizeDiscordUsername(discordRaw)
        if (cleaned.length >= 3) {
          setUsername(cleaned)
          setPreloaded(true)
        }
      }
      // Pre-guardar el username de Discord como contacto
      if (discordTag) setDiscordContact(discordTag)
    })
  }, [])

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) { setAvailable(null); return }
    const timer = setTimeout(async () => {
      setChecking(true)
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle()
      setAvailable(!data)
      setChecking(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const isValidFormat = (u: string) => /^[a-zA-Z0-9_.]{3,20}$/.test(u)

  const handleSubmit = async () => {
    setError('')
    const trimmed = username.trim()

    if (!trimmed) { setError('Escribí un nombre de guerrero'); return }
    if (!isValidFormat(trimmed)) {
      setError('Solo letras, números, puntos y guiones bajos. Entre 3 y 20 caracteres.')
      return
    }
    if (available === false) { setError('Ese nombre ya está en uso'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check one more time before saving
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle()

    if (existing) {
      setError('Ese nombre ya está en uso, elegí otro')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: trimmed,
        ...(discordContact ? { discord: discordContact } : {}),
      })

    if (updateError) {
      setError(updateError.message.includes('duplicate') ? 'Ese nombre ya está en uso' : updateError.message)
      setLoading(false)
      return
    }

    router.push('/market')
    router.refresh()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const formatHint = username.length > 0 && !isValidFormat(username)
  const statusColor = checking ? '#888' : available === true ? '#22C55E' : available === false ? '#E24B4A' : '#888'
  const statusText = checking ? 'Verificando...' : available === true ? '✓ Disponible' : available === false ? '✗ En uso' : ''

  return (
    <>
    <Header />
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '40px 20px' }}>
      <div style={{
        background: 'var(--dark-card)', border: '1px solid var(--dark-border-gold)',
        borderRadius: 12, padding: 36, width: '100%', maxWidth: 380, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚔</div>
        <h1 className="cinzel" style={{ fontSize: 22, color: 'var(--gold)', marginBottom: 8 }}>
          Elegí tu nombre
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: preloaded ? 12 : 28, lineHeight: 1.5 }}>
          Con este nombre te verán los demás mercaderes del reino.
          No podrás cambiarlo después.
        </p>

        {preloaded && (
          <div style={{
            background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.3)',
            borderRadius: 8, padding: '8px 14px', marginBottom: 20,
            fontSize: 12, color: 'rgba(88,101,242,0.9)',
          }}>
            💬 Pre-cargado desde tu usuario de Discord. Podés cambiarlo si querés.
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: 6 }}>
          <input
            style={{
              width: '100%', background: 'var(--dark-surface)',
              border: `1px solid ${available === true ? '#22C55E55' : available === false ? '#E24B4A55' : 'var(--dark-border)'}`,
              borderRadius: 8, padding: '12px 16px', color: 'var(--text-primary)',
              fontFamily: "'Cinzel', serif", fontSize: 16, outline: 'none',
              boxSizing: 'border-box', textAlign: 'center', letterSpacing: 1,
              transition: 'border-color 0.2s',
            }}
            placeholder="nombre_de_guerrero"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Status / format hint */}
        <div style={{ height: 20, marginBottom: 12, fontSize: 12 }}>
          {statusText && (
            <span style={{ color: statusColor }}>{statusText}</span>
          )}
          {formatHint && !statusText && (
            <span style={{ color: '#888' }}>Solo letras, números, . y _  (3–20 chars)</span>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.4)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ color: '#E24B4A', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || available === false || username.length < 3}
          style={{
            width: '100%',
            background: loading || available === false || username.length < 3
              ? 'rgba(201,168,76,0.3)'
              : 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: 'var(--dark-bg)', border: 'none', padding: '13px 20px', borderRadius: 8,
            fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 1,
            cursor: loading || available === false || username.length < 3 ? 'not-allowed' : 'pointer',
            fontWeight: 700, transition: 'all 0.2s',
          }}
        >
          {loading ? 'Guardando...' : '✦ UNIRSE AL REINO'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, opacity: 0.6 }}>
          Solo letras, números, puntos y guiones bajos
        </p>
      </div>
    </div>
    </>
  )
}
