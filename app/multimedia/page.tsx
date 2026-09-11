import type { Metadata } from 'next'
import { createPublicSupabase } from '@/lib/supabase-server'
import { streamsEnVivo } from '@/lib/twitch'
import Header from '@/components/Header'
import CompartirContenido from '@/components/CompartirContenido'
import HighlightsGrid from '@/components/HighlightsGrid'
import CanalesComunidad from './CanalesComunidad'

export const metadata: Metadata = { title: 'Multimedia' }

function IconEye({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Página pública, nada personalizado por usuario en el Server Component
// (el botón "Compartir" resuelve su propia sesión aparte, en un client
// component) — cachear 60s en vez de pegarle a Twitch + Supabase en
// cada visita.
export const revalidate = 60

export default async function MultimediaPage() {
  const supabase = createPublicSupabase()

  const [{ data: streamers, error: streamersErr }, { data: highlights, count, error: highlightsErr }] = await Promise.all([
    supabase.from('players').select('id, discord_username, nickname_juego, avatar_url, twitch_username, youtube_channel, kick_username')
      .or('twitch_username.not.is.null,youtube_channel.not.is.null,kick_username.not.is.null'),
    supabase
      .from('highlights')
      .select('*, jugador:players!highlights_jugador_id_fkey(id, discord_username, nickname_juego, avatar_url), torneo:tournaments(id, nombre)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 23),
  ])
  if (streamersErr) console.error('multimedia: query players.twitch_username falló', streamersErr)
  if (highlightsErr) console.error('multimedia: query highlights falló', highlightsErr)

  // Si Twitch todavía no tiene credenciales cargadas (o la API falla),
  // la sección "en vivo" simplemente no aparece — no debe tumbar el
  // resto de la página, que sigue teniendo el feed de contenido.
  let enVivo: Awaited<ReturnType<typeof streamsEnVivo>> = []
  const usernames = (streamers ?? []).map(s => s.twitch_username).filter(Boolean) as string[]
  if (usernames.length > 0) {
    try { enVivo = await streamsEnVivo(usernames) } catch (err) { console.error('multimedia: streamsEnVivo falló', err) }
  }
  const streamersEnVivo = enVivo.map(s => ({ ...s, jugador: streamers?.find(p => p.twitch_username === s.username) }))

  // "Canales de la comunidad" no tenía orden propio (el que devolvía la
  // consulta, sin criterio) — los que están en vivo ahora mismo van primero.
  const usernamesEnVivo = new Set(streamersEnVivo.map(s => s.username))
  const streamersOrdenados = (streamers ?? []).slice().sort((a, b) => {
    const aVivo = a.twitch_username ? usernamesEnVivo.has(a.twitch_username) : false
    const bVivo = b.twitch_username ? usernamesEnVivo.has(b.twitch_username) : false
    return Number(bVivo) - Number(aVivo)
  })

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, background: 'var(--gold)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>Multimedia</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Streams y clips de la comunidad
            </h1>
            <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>
              Videos, streams en vivo y canales de la comunidad
            </p>
          </div>
          <CompartirContenido />
        </div>

        {streamersEnVivo.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, background: '#F44336' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>En vivo ahora</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {streamersEnVivo.map(s => (
                <a key={s.username} href={`https://twitch.tv/${s.username}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textDecoration: 'none', background: 'var(--bg-card)',
                  border: '1px solid rgba(244,67,54,0.4)', overflow: 'hidden',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-surface)' }}>
                    <img src={s.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, background: '#F44336', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', padding: '3px 8px' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> EN VIVO
                    </span>
                    <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(10,10,10,0.8)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 7px' }}>
                      <IconEye size={11} /> {s.espectadores}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {s.jugador?.discord_username ?? s.jugador?.nickname_juego ?? s.username}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.titulo}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {(streamers?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Canales de la comunidad
            </div>
            <CanalesComunidad streamers={streamersOrdenados} enVivoUsernames={usernamesEnVivo} />
          </div>
        )}

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Últimos compartidos
          </div>
          <HighlightsGrid inicial={highlights ?? []} total={count ?? 0} />
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 40 }}>
        CoR Tournament Stats © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
