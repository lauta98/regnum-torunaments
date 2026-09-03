'use client'
import { useState } from 'react'
import { YoutubeIcon, TwitchIcon, KickIcon } from '@/components/PlatformIcons'

type Streamer = {
  id: string
  discord_username: string | null
  nickname_juego: string | null
  avatar_url: string | null
  twitch_username: string | null
  youtube_channel: string | null
  kick_username: string | null
}

const PAGE_SIZE = 24

/** Recibe la lista COMPLETA ya ordenada (en vivo primero) del server
 *  component — no hace falta volver a pedirle nada al servidor para
 *  "cargar más", los canales de la comunidad son un conjunto acotado
 *  (a diferencia de "Últimos compartidos", que sí puede crecer sin
 *  límite con el tiempo y necesita paginar de verdad contra la base).
 *  Esto evita además volver a golpear la API de Twitch por cada tanda. */
export default function CanalesComunidad({ streamers, enVivoUsernames }: { streamers: Streamer[]; enVivoUsernames: Set<string> }) {
  const [visibles, setVisibles] = useState(PAGE_SIZE)
  const mostrados = streamers.slice(0, visibles)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {mostrados.map(s => {
          const enVivo = s.twitch_username ? enVivoUsernames.has(s.twitch_username) : false
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: 'var(--bg-card)', border: `1px solid ${enVivo ? 'rgba(244,67,54,0.4)' : 'var(--border-gold)'}`,
              borderRadius: 'var(--radius-md)', boxShadow: enVivo ? '0 0 16px rgba(244,67,54,0.12)' : 'var(--shadow-card)',
            }}>
              <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.avatar_url
                  ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>{(s.discord_username ?? s.nickname_juego ?? '?')[0]?.toUpperCase()}</span>}
                {enVivo && (
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#F44336', border: '2px solid var(--bg-card)' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.discord_username ?? s.nickname_juego ?? 'Jugador'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  {s.twitch_username && (
                    <a href={`https://twitch.tv/${s.twitch_username}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex' }}><TwitchIcon size={14} /></a>
                  )}
                  {s.youtube_channel && (
                    <a href={s.youtube_channel} target="_blank" rel="noopener noreferrer" style={{ display: 'flex' }}><YoutubeIcon size={14} /></a>
                  )}
                  {s.kick_username && (
                    <a href={`https://kick.com/${s.kick_username}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex' }}><KickIcon size={14} /></a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {visibles < streamers.length && (
        <button onClick={() => setVisibles(v => v + PAGE_SIZE)} className="btn btn-ghost-gold" style={{ margin: '16px auto 0', display: 'block' }}>
          Cargar más ({streamers.length - visibles} restantes)
        </button>
      )}
    </>
  )
}
