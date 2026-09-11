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
import EditarPerfil from './EditarPerfil'

/* ── Icons ─────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const IconSwords = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="11" y2="5"/>
    <line x1="8" y1="8" x2="4" y2="4"/>
  </svg>
)
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconDiscord = () => (
  <svg width="16" height="13" viewBox="0 0 71 55" fill="currentColor">
    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/>
  </svg>
)
const IconMedal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="6"/><path d="M12 10v2l1.5 1.5"/>
    <path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3"/>
  </svg>
)
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false)

  const isActive = (href: string) => {
    const hrefPath = href.split('?')[0]
    return pathname === hrefPath || (hrefPath !== '/' && pathname.startsWith(hrefPath + '/'))
  }

  useEffect(() => { setMobileNavOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // select('*') a propósito: es la propia fila del usuario (no un
      // query pesado), y así esta consulta global (se ejecuta en TODAS
      // las páginas) nunca se rompe por una columna nueva que todavía
      // no corrió su migración — a diferencia de un select con nombres
      // explícitos, que tira error 42703 y tumba el dropdown entero.
      supabase.from('players')
        .select('*')
        .eq('user_id', user.id).single()
        .then(({ data }) => setPlayer(data))
    })
  }, [])

  const rc = player?.reino ? REINO_COLOR[player.reino as Reino] : 'var(--gold)'

  return (
    <header style={{
      background: 'color-mix(in srgb, var(--bg-base) 98%, transparent)',
      borderBottom: '1px solid var(--border)',
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
        maxWidth: 1360, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72,
        gap: 16,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, flexShrink: 0,
            border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)',
          }}><IconSwords size={19} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-display-v2)', fontWeight: 700, fontSize: 20, color: 'var(--gold)', lineHeight: 1.1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>CoR</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Community</div>
          </div>
        </Link>

        {/* Nav (desktop) */}
        <nav className="cor-nav-links" style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 12px', borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <span style={{ display: 'flex' }}>{icon}</span>
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
            width: 34, height: 34, flexShrink: 0,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          {mobileNavOpen ? <IconClose /> : <IconMenu />}
        </button>

        {/* Auth */}
        {player ? (
          <div style={{ position: 'relative', flexShrink: 0, minWidth: 0 }}>
            <button onClick={() => setDropdownOpen(o => !o)} aria-haspopup="true" aria-expanded={dropdownOpen} style={{
              display: 'flex', alignItems: 'center', gap: 10, maxWidth: 240,
              background: 'var(--bg-card)',
              border: `1px solid color-mix(in srgb, ${rc} 35%, transparent)`, padding: '6px 12px 6px 6px',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}>
              <div style={{ width: 38, height: 38, background: `color-mix(in srgb, ${rc} 13%, transparent)`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {avatarSrc(player)
                  ? <img src={avatarSrc(player)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Avatar de ${player.nickname_juego}`} />
                  : <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 700, color: rc }}>{player.nickname_juego?.[0]?.toUpperCase()}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, lineHeight: 1.25 }}>
                <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: 140 }}>{player.nickname_juego}</span>
                {player.reino && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: rc, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, background: rc, flexShrink: 0 }} /> {player.reino}{player.clase_principal ? ` · ${player.clase_principal}` : ''}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>▾</span>
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: 220, zIndex: 200, overflow: 'hidden' }}
                onMouseLeave={() => setDropdownOpen(false)}>

                {/* Rol badge */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: ROLE_BG[player.role as UserRole] ?? 'var(--bg-surface)',
                    color: ROLE_COLOR[player.role as UserRole] ?? 'var(--text-muted)',
                    border: `1px solid color-mix(in srgb, ${ROLE_COLOR[player.role as UserRole] ?? 'var(--text-muted)'} 35%, transparent)`,
                    padding: '3px 9px',
                    fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
                  }}>
                    {ROLE_LABEL[player.role as UserRole] ?? player.role}
                  </span>
                </div>

                {/* Mi perfil */}
                <Link href={`/jugadores/${player.id}`} onClick={() => setDropdownOpen(false)}
                  style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  Mi perfil
                </Link>

                {/* Editar perfil — el modal en sí vive fuera de este dropdown
                    (ver más abajo), porque se desmonta apenas se cierra */}
                <button
                  onClick={() => { setEditarPerfilOpen(true); setDropdownOpen(false) }}
                  style={{ display: 'block', width: '100%', padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-secondary)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Editar perfil
                </button>

                {/* Panel Organizador (organizer + admin) */}
                {canOrganize(player.role) && (
                  <Link href="/organizador" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--purple)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    Panel Organizador
                  </Link>
                )}

                {/* Panel Administrador (solo admin) */}
                {canAdmin(player.role) && (
                  <Link href="/admin" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    Panel Administrador
                  </Link>
                )}

                <button onClick={() => { signOut(); setDropdownOpen(false) }}
                  style={{ width: '100%', padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--error)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
            <EditarPerfil player={player} open={editarPerfilOpen} onClose={() => setEditarPerfilOpen(false)} />
          </div>
        ) : (
          <button onClick={signInWithDiscord} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent',
            color: 'var(--text-primary)', padding: '7px 14px',
            fontFamily: 'var(--font-mono)', fontWeight: 600,
            fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase',
            border: '1px solid color-mix(in srgb, #5865F2 60%, transparent)',
            cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, #5865F2 15%, transparent)'; e.currentTarget.style.borderColor = '#5865F2' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'color-mix(in srgb, #5865F2 60%, transparent)' }}
          >
            <IconDiscord />
            Discord
          </button>
        )}
      </div>

      {/* Nav (mobile panel) */}
      {mobileNavOpen && (
        <nav style={{ borderTop: '1px solid var(--border)', padding: '4px 8px' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} onClick={() => setMobileNavOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 12px',
                background: active ? 'var(--bg-card)' : 'transparent',
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: active ? 'var(--gold)' : 'var(--text-secondary)',
                textDecoration: 'none',
              }}>
                <span style={{ display: 'flex' }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
