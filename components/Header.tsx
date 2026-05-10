'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signInWithDiscord, signOut } from '@/lib/auth'
import { REINO_COLOR } from '@/lib/constants'
import type { Reino } from '@/lib/types'

const NAV = [
  { label: 'INICIO',                href: '/' },
  { label: 'TORNEOS',               href: '/torneos' },
  { label: 'ENFRENTAMIENTOS & BRACKETS', href: '/brackets' },
  { label: 'RANKINGS',              href: '/rankings' },
  { label: 'JUGADORES',             href: '/jugadores' },
  { label: 'EVENTOS ESPECIALES',    href: '/eventos' },
  { label: 'IA STATS',              href: '/ia-stats' },
]

export default function Header() {
  const [player, setPlayer] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('players').select('id, nickname_juego, reino, role, discord_avatar').eq('user_id', user.id).single()
        .then(({ data }) => setPlayer(data))
    })
  }, [])

  const rc = player?.reino ? REINO_COLOR[player.reino as Reino] : 'var(--gold)'

  return (
    <header style={{
      background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid var(--border-gold)',
      backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, background: 'var(--gold-muted)', border: '2px solid var(--border-gold-strong)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--gold)' }}>R</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gold)', letterSpacing: 1 }}>CoR</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Tournament Stats</div>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, letterSpacing: 0.5, transition: 'color 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >{label}</Link>
          ))}
        </nav>

        {/* Auth area */}
        {player ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)',
              border: `1px solid ${rc}44`, borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${rc}22`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {player.discord_avatar
                  ? <img src={player.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <span style={{ fontSize: 12, color: rc }}>{player.nickname_juego?.[0]}</span>
                }
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{player.nickname_juego}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▾</span>
            </button>

            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 10, minWidth: 180, zIndex: 200, overflow: 'hidden' }}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <Link href={`/jugadores/${player.id}`} onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Mi perfil
                </Link>
                {['organizer', 'admin'].includes(player.role) && (
                  <Link href="/organizador" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    Panel Organizador
                  </Link>
                )}
                <button onClick={() => { signOut(); setDropdownOpen(false) }} style={{ width: '100%', padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 11, color: '#f87171', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={signInWithDiscord} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#5865F2', color: '#fff',
            padding: '8px 16px', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 12, letterSpacing: 1, border: '1px solid rgba(88,101,242,0.5)', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="16" height="13" viewBox="0 0 71 55" fill="currentColor"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/></svg>
            ENTRAR CON DISCORD
          </button>
        )}
      </div>
    </header>
  )
}
