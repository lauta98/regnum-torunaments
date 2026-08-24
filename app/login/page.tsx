'use client'
import { signInWithDiscord } from '@/lib/auth'
import dynamic from 'next/dynamic'

function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(138,43,226,0.12) 0%, transparent 60%)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, margin: '0 auto 16px',
          background: 'var(--gold-muted)',
          border: '2px solid var(--border-gold-strong)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--gold)',
        }}>R</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--gold)', letterSpacing: 3 }}>CoR</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 4, marginTop: 4 }}>TOURNAMENT STATS</div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '40px 48px',
        width: '100%', maxWidth: 420,
        textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Acceder a la plataforma
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          Conectá tu cuenta de Discord para ver tu ranking, participar en torneos y más.
        </p>

        <button
          onClick={signInWithDiscord}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#5865F2', color: '#fff',
            padding: '14px 24px', borderRadius: 10,
            border: '1px solid rgba(88,101,242,0.6)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: 1,
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="22" height="17" viewBox="0 0 71 55" fill="currentColor">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/>
          </svg>
          Continuar con Discord
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.6 }}>
          Al ingresar aceptás los términos del servidor. Solo se usa tu nombre de Discord.
        </p>
      </div>

      <a href="/" style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← Volver sin iniciar sesión
      </a>
    </div>
  )
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false })
