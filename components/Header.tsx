'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signInWithDiscord, signOut } from '@/lib/auth'
import { REINO_COLOR } from '@/lib/constants'
import type { Reino, UserRole } from '@/lib/types'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG, canOrganize, canAdmin } from '@/lib/roles'
import { avatarSrc } from '@/lib/avatar'

/* ── Icons ─────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconTrophy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const IconSwords = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="11" y2="5"/>
    <line x1="8" y1="8" x2="4" y2="4"/>
  </svg>
)
const IconChart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconPerson = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconDiscord = () => (
  <svg width="16" height="13" viewBox="0 0 71 55" fill="currentColor">
    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/>
  </svg>
)
const IconMedal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="6"/><path d="M12 10v2l1.5 1.5"/>
    <path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3"/>
  </svg>
)
const IconVideo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const NAV = [
  { label: 'Inicio',      href: '/',          icon: <IconHome /> },
  { label: 'Torneos',     href: '/torneos',   icon: <IconTrophy /> },
  { label: 'Comercio',    href: '/market',    icon: <IconSwords /> },
  { label: 'Ranking',     href: '/jugadores', icon: <IconChart /> },
  { label: 'Multimedia',  href: '/multimedia', icon: <IconVideo /> },
  { label: 'Salón de la Fama', href: '/salon-de-la-fama', icon: <IconMedal /> },
]

export default function Header() {
  const pathname = usePathname()
  const [player, setPlayer] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isActive = (href: string) => {
    const hrefPath = href.split('?')[0]
    return pathname === hrefPath || (hrefPath !== '/' && pathname.startsWith(hrefPath + '/'))
  }

  useEffect(() => { setMobileNavOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('players')
        .select('id, nickname_juego, reino, role, discord_avatar, avatar_url')
        .eq('user_id', user.id).single()
        .then(({ data }) => setPlayer(data))
    })
  }, [])

  const rc = player?.reino ? REINO_COLOR[player.reino as Reino] : 'var(--gold)'

  return (
    <header style={{
      background: 'rgba(6,6,6,0.98)',
      borderBottom: 'none',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <style>{`
        .cor-hamburger { display: none; }
        @media (max-width: 780px) {
          .cor-nav-links { display: none !important; }
          .cor-hamburger { display: flex !important; }
        }
      `}</style>
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
        gap: 12,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', fontSize: 16,
          }}>⚔️</div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: 0.5 }}>CoR</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>COMMUNITY</div>
          </div>
        </Link>

        {/* Nav (desktop) */}
        <nav className="cor-nav-links" style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 11px', borderRadius: 7,
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
              >
                <span style={{ color: active ? 'var(--gold)' : 'inherit', display: 'flex' }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Hamburger (mobile) */}
        <button
          className="cor-hamburger"
          onClick={() => setMobileNavOpen(o => !o)}
          aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileNavOpen}
          style={{
            alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, flexShrink: 0,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8,
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          {mobileNavOpen ? <IconClose /> : <IconMenu />}
        </button>

        {/* Auth */}
        {player ? (
          <div style={{ position: 'relative', flexShrink: 0, minWidth: 0 }}>
            <button onClick={() => setDropdownOpen(o => !o)} aria-haspopup="true" aria-expanded={dropdownOpen} style={{
              display: 'flex', alignItems: 'center', gap: 8, maxWidth: 160,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${rc}33`, borderRadius: 8, padding: '5px 11px',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${rc}22`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {avatarSrc(player)
                  ? <img src={avatarSrc(player)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Avatar de ${player.nickname_juego}`} />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: rc }}>{player.nickname_juego?.[0]?.toUpperCase()}</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{player.nickname_juego}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>▾</span>
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, minWidth: 200, zIndex: 200, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                onMouseLeave={() => setDropdownOpen(false)}>

                {/* Rol badge */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: ROLE_BG[player.role as UserRole] ?? 'rgba(255,255,255,0.05)',
                    color: ROLE_COLOR[player.role as UserRole] ?? 'var(--text-muted)',
                    border: `1px solid ${ROLE_COLOR[player.role as UserRole] ?? 'transparent'}55`,
                    padding: '2px 8px', borderRadius: 4,
                    fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5,
                  }}>
                    {ROLE_LABEL[player.role as UserRole] ?? player.role}
                  </span>
                </div>

                {/* Mi perfil */}
                <Link href={`/jugadores/${player.id}`} onClick={() => setDropdownOpen(false)}
                  style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  Mi perfil
                </Link>

                {/* Panel Organizador (organizer + admin) */}
                {canOrganize(player.role) && (
                  <Link href="/organizador" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2196F3')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    Panel Organizador
                  </Link>
                )}

                {/* Panel Administrador (solo admin) */}
                {canAdmin(player.role) && (
                  <Link href="/admin" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    ⚙ Panel Administrador
                  </Link>
                )}

                <button onClick={() => { signOut(); setDropdownOpen(false) }}
                  style={{ width: '100%', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: '#f87171', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={signInWithDiscord} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent',
            color: '#fff', padding: '7px 14px', borderRadius: 8,
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 11, letterSpacing: 0.5,
            border: '1px solid rgba(88,101,242,0.6)',
            cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88,101,242,0.15)'; e.currentTarget.style.borderColor = '#5865F2' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.6)' }}
          >
            <IconDiscord />
            Discord
          </button>
        )}
      </div>

      {/* Nav (mobile panel) */}
      {mobileNavOpen && (
        <nav style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} onClick={() => setMobileNavOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 12px', borderRadius: 8,
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
              }}>
                <span style={{ color: active ? 'var(--gold)' : 'inherit', display: 'flex' }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
      )}

      {/* Ornamental golden divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.15) 15%, rgba(212,175,55,0.45) 40%, rgba(212,175,55,0.45) 60%, rgba(212,175,55,0.15) 85%, transparent 100%)' }} />
    </header>
  )
}
