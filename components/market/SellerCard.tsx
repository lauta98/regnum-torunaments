'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface Props {
  profile: any
  listingId: string
  sellerId: string
}

export default function SellerCard({ profile, listingId, sellerId }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [discordCopied, setDiscordCopied] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  const trackContactClick = () => {
    fetch('/api/contact-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId }),
    }).catch(() => {})
  }

  const handleDiscord = () => {
    if (!profile?.discord) return
    trackContactClick()
    if (profile.discord_id) {
      window.open(`discord://discordapp.com/users/${profile.discord_id}`, '_blank')
    } else {
      navigator.clipboard.writeText(profile.discord).catch(() => {})
      window.open('discord://discord.com/channels/@me', '_blank')
      setDiscordCopied(true)
      setTimeout(() => setDiscordCopied(false), 2500)
    }
  }

  const getLastSeen = (lastSignIn: string | null): string => {
    if (!lastSignIn) return ''
    const diff = Date.now() - new Date(lastSignIn).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 5)    return 'Activo ahora'
    if (mins < 60)   return `Activo hace ${mins} min`
    if (hours < 24)  return `Activo hace ${hours}h`
    if (days < 7)    return `Activo hace ${days}d`
    if (days < 30)   return `Activo hace ${Math.floor(days / 7)} sem`
    return `Activo hace más de un mes`
  }
  const lastSeenText = getLastSeen(profile?.last_sign_in_at || null)

  const initials = profile?.username?.slice(0, 2).toUpperCase() || '??'

  // Badges
  const badges: { label: string; color: string; bg: string }[] = []
  if ((profile?.total_reviews || 0) >= 10 && (profile?.avg_rating || 0) >= 4.0) {
    badges.push({ label: '⭐ Top vendedor', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' })
  } else if ((profile?.total_reviews || 0) >= 5 && (profile?.avg_rating || 0) >= 3.5) {
    badges.push({ label: '✓ Confiable', color: '#5BC98B', bg: 'rgba(91,201,139,0.12)' })
  }
  if (profile?.last_sign_in_at) {
    const daysSince = (Date.now() - new Date(profile.last_sign_in_at).getTime()) / 86400000
    if (daysSince < 1) badges.push({ label: '🔥 Muy activo', color: '#FB923C', bg: 'rgba(251,146,60,0.12)' })
    else if (daysSince < 7) badges.push({ label: '🟢 Activo esta semana', color: '#5BC98B', bg: 'rgba(91,201,139,0.10)' })
  }

  return (
    <div style={{
      background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
      borderRadius: 10, padding: 16,
    }}>
      <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>
        PUBLICADO POR
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--burgundy)',
          border: '2px solid var(--dark-border-gold)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: "'Cinzel',serif", fontSize: 16, color: 'var(--gold-light)',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <Link href={`/perfil/${profile?.username}`} style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: 'var(--text-primary)', textDecoration: 'none' }}>
            {profile?.username}
          </Link>
          {profile?.regnum_nick && (
            <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 1, letterSpacing: 0.3 }}>
              ⚔ {profile.regnum_nick}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ⭐ {profile?.avg_rating?.toFixed(1) || '—'} · {profile?.total_reviews} reseñas
          </div>
          {lastSeenText && (
            <div style={{ fontSize: 11, color: lastSeenText === 'Activo ahora' ? '#5BC98B' : 'var(--text-muted)', marginTop: 2 }}>
              🟢 {lastSeenText}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { val: profile?.avg_rating?.toFixed(1) || '—', lbl: 'Rating' },
          { val: profile?.total_reviews || 0, lbl: 'Reseñas' },
        ].map(s => (
          <div key={s.lbl} style={{ flex: 1, textAlign: 'center', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 8, padding: '8px 0' }}>
            <div className="cinzel" style={{ fontSize: 16, color: 'var(--gold)' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {badges.map(b => (
            <span key={b.label} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12,
              background: b.bg, color: b.color,
              border: `1px solid ${b.color}44`,
              fontFamily: "'Cinzel',serif", letterSpacing: 0.5,
            }}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Contacto — solo para logueados */}
      {user ? (
        <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border-gold)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>CONTACTO</div>

          {profile?.discord && (
            <button
              onClick={handleDiscord}
              title="Abre Discord y copia el usuario al portapapeles"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                borderRadius: 6, textDecoration: 'none', color: 'var(--text-primary)',
                background: discordCopied ? 'rgba(88,101,242,0.25)' : 'rgba(88,101,242,0.12)',
                border: `1px solid ${discordCopied ? 'rgba(88,101,242,0.7)' : 'rgba(88,101,242,0.3)'}`,
                marginBottom: 6, fontSize: 14, cursor: 'pointer', width: '100%',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0 }}>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{profile.discord}</span>
              <span style={{ fontSize: 11, color: 'rgba(88,101,242,0.9)', whiteSpace: 'nowrap' }}>
                {profile.discord_id ? '↗ Mensaje' : discordCopied ? '✓ ¡Copiado!' : '📋 Copiar'}
              </span>
            </button>
          )}

          {profile?.whatsapp && (() => {
            const raw = profile.whatsapp.replace(/\s/g, '').replace(/-/g, '')
            const waNumber = raw.startsWith('+') ? raw.slice(1) : raw
            const waUrl = `https://wa.me/${waNumber}`
            return (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackContactClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 6, textDecoration: 'none', color: 'var(--text-primary)',
                  background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)',
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <span style={{ flex: 1 }}>{profile.whatsapp}</span>
                <span style={{ fontSize: 11, color: 'rgba(37,211,102,0.8)' }}>↗</span>
              </a>
            )
          })()}

          {!profile?.discord && !profile?.whatsapp && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin contacto registrado</div>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 8, padding: 12, marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Iniciá sesión para ver el contacto</p>
          <Link href="/login" style={{
            display: 'inline-block', background: 'transparent', border: '1px solid var(--dark-border-gold)',
            color: 'var(--gold)', padding: '6px 16px', borderRadius: 8, fontSize: 11,
            fontFamily: "'Cinzel',serif", textDecoration: 'none',
          }}>
            ENTRAR
          </Link>
        </div>
      )}

      {/* El botón de acción (comprar / iniciar trato) está en BotonComprar */}
    </div>
  )
}