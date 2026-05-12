'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'

/* ─────────────────────────────────────────────────────────────
   Configuración de contenido — agregá tus VODs/streams acá
   ───────────────────────────────────────────────────────────── */
type HighlightType = 'youtube' | 'twitch_vod' | 'twitch_live'

interface Highlight {
  id: string
  tipo: HighlightType
  titulo: string
  descripcion?: string
  videoId: string          // YouTube video ID | Twitch VOD ID | Twitch channel name
  torneo?: string
  fecha?: string
  thumbnail?: string       // URL custom thumbnail (opcional, se usa la auto de YT/Twitch)
}

const HIGHLIGHTS: Highlight[] = [
  // ── Ejemplos — reemplazá con IDs reales ───────────────────
  // {
  //   id: '1',
  //   tipo: 'twitch_live',
  //   titulo: 'CoR Tournaments EN VIVO',
  //   descripcion: 'Stream oficial de la temporada',
  //   videoId: 'cor_tournaments',   // nombre del canal Twitch
  //   torneo: 'Temporada 1',
  // },
  // {
  //   id: '2',
  //   tipo: 'twitch_vod',
  //   titulo: 'Torneo de Bárbaros — Final',
  //   descripcion: 'VOD completo del torneo flash cup',
  //   videoId: '2345678901',         // ID del VOD en Twitch
  //   torneo: 'TORNEO DE BÁRBAROS',
  //   fecha: '2026-05-10',
  // },
  // {
  //   id: '3',
  //   tipo: 'youtube',
  //   titulo: 'Highlights — Winter Cup 2026',
  //   descripcion: 'Los mejores momentos de la Winter Cup',
  //   videoId: 'dQw4w9WgXcQ',        // ID del video de YouTube
  //   torneo: 'WINTER CUP 2026',
  //   fecha: '2026-03-13',
  // },
]

/* ─── Embed player ──────────────────────────────────────────── */
function VideoEmbed({ highlight }: { highlight: Highlight }) {
  const [parent, setParent] = useState('localhost')

  useEffect(() => {
    setParent(window.location.hostname)
  }, [])

  let src = ''
  if (highlight.tipo === 'youtube') {
    src = `https://www.youtube.com/embed/${highlight.videoId}?rel=0&modestbranding=1`
  } else if (highlight.tipo === 'twitch_vod') {
    src = `https://player.twitch.tv/?video=${highlight.videoId}&parent=${parent}&autoplay=false`
  } else if (highlight.tipo === 'twitch_live') {
    src = `https://player.twitch.tv/?channel=${highlight.videoId}&parent=${parent}&autoplay=false`
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
      <iframe
        src={src}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}

/* ─── Thumbnail placeholder para cuando no hay embed ────────── */
function ThumbnailCard({ h, onClick }: { h: Highlight; onClick: () => void }) {
  const isLive = h.tipo === 'twitch_live'
  const isTwitch = h.tipo === 'twitch_live' || h.tipo === 'twitch_vod'

  // Auto-thumbnail de YouTube
  const ytThumb = h.tipo === 'youtube'
    ? `https://img.youtube.com/vi/${h.videoId}/maxresdefault.jpg`
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: '#0a0a0a',
        border: `1px solid ${isLive ? 'rgba(244,67,54,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isLive ? '0 0 20px rgba(244,67,54,0.1)' : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = isLive ? 'rgba(244,67,54,0.7)' : 'rgba(212,175,55,0.35)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isLive ? 'rgba(244,67,54,0.4)' : 'rgba(255,255,255,0.08)' }}
    >
      {/* Thumbnail area */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
        {ytThumb && (
          <img src={ytThumb} alt={h.titulo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: isLive ? 'rgba(244,67,54,0.9)' : 'rgba(212,175,55,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${isLive ? 'rgba(244,67,54,0.5)' : 'rgba(212,175,55,0.4)'}` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        {/* Live badge */}
        {isLive && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#F44336', color: '#fff', padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse-red 1.2s ease-in-out infinite' }} />
            EN VIVO
          </div>
        )}
        {/* Platform badge */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: isTwitch ? 'rgba(100,65,165,0.9)' : 'rgba(255,0,0,0.85)', color: '#fff', padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
          {isTwitch ? 'TWITCH' : 'YOUTUBE'}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        {h.torneo && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 4 }}>{h.torneo}</div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>{h.titulo}</div>
        {h.descripcion && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{h.descripcion}</div>
        )}
        {h.fecha && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            📅 {new Date(h.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Modal player ──────────────────────────────────────────── */
function PlayerModal({ highlight, onClose }: { highlight: Highlight; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 900, background: '#0a0a0a', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            {highlight.torneo && <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--gold)', letterSpacing: 1.5 }}>{highlight.torneo}</div>}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{highlight.titulo}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <VideoEmbed highlight={highlight} />
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export function HighlightsPage() {
  const [selected, setSelected] = useState<Highlight | null>(null)

  const lives = HIGHLIGHTS.filter(h => h.tipo === 'twitch_live')
  const vods = HIGHLIGHTS.filter(h => h.tipo !== 'twitch_live')

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1 }}>
            Highlights
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            VODs de Twitch, YouTube y streams en vivo de los torneos CoR
          </p>
        </div>
        <div className="divider-gold" style={{ marginBottom: 32 }} />

        {/* ── EN VIVO ──────────────────────────────────────────── */}
        {lives.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F44336', display: 'inline-block', animation: 'pulse-red 1.2s ease-in-out infinite' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#F44336', letterSpacing: 2 }}>EN VIVO</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
              {lives.map(h => (
                <ThumbnailCard key={h.id} h={h} onClick={() => setSelected(h)} />
              ))}
            </div>
          </section>
        )}

        {/* ── VODs & Grabaciones ───────────────────────────────── */}
        {vods.length > 0 ? (
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', letterSpacing: 2, marginBottom: 20 }}>
              GRABACIONES
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {vods.map(h => (
                <ThumbnailCard key={h.id} h={h} onClick={() => setSelected(h)} />
              ))}
            </div>
          </section>
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: '#0a0a0a' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: 1 }}>
              Highlights próximamente
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', fontStyle: 'italic', lineHeight: 1.7 }}>
              Acá aparecerán los VODs de Twitch y los videos de YouTube de los torneos CoR.
              Los streams en vivo también se mostrarán en esta página.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              <a href="https://www.twitch.tv" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: 'rgba(100,65,165,0.15)', border: '1px solid rgba(100,65,165,0.4)', color: '#9147FF', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 0.5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
                Twitch
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', color: '#FF4444', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 0.5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                YouTube
              </a>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>

      {/* Modal */}
      {selected && <PlayerModal highlight={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

import dynamic from 'next/dynamic'
export default dynamic(() => Promise.resolve(HighlightsPage), { ssr: false })
