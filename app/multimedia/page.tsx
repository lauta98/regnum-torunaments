import type { Metadata } from 'next'
import { createPublicSupabase } from '@/lib/supabase-server'
import { streamsEnVivo } from '@/lib/twitch'
import Header from '@/components/Header'
import CompartirContenido from '@/components/CompartirContenido'
import HighlightsGrid from '@/components/HighlightsGrid'

export const metadata: Metadata = { title: 'Multimedia' }

// Página pública, nada personalizado por usuario en el Server Component
// (el botón "Compartir" resuelve su propia sesión aparte, en un client
// component) — cachear 60s en vez de pegarle a Twitch + Supabase en
// cada visita.
export const revalidate = 60

export default async function MultimediaPage() {
  const supabase = createPublicSupabase()

  const [{ data: streamers, error: streamersErr }, { data: highlights, count, error: highlightsErr }] = await Promise.all([
    supabase.from('players').select('id, discord_username, nickname_juego, avatar_url, twitch_username').not('twitch_username', 'is', null),
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

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1.5 }}>
              Multimedia
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Videos, streams y canales de la comunidad
            </p>
          </div>
          <CompartirContenido />
        </div>

        {streamersEnVivo.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F44336', boxShadow: '0 0 8px #F44336' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>EN VIVO AHORA</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {streamersEnVivo.map(s => (
                <a key={s.username} href={`https://twitch.tv/${s.username}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textDecoration: 'none', background: 'var(--bg-card)',
                  border: '1px solid rgba(244,67,54,0.4)', borderRadius: 'var(--radius-md)',
                  boxShadow: '0 0 20px rgba(244,67,54,0.12)', overflow: 'hidden',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-surface)' }}>
                    <img src={s.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#F44336', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 4 }}>
                      🔴 EN VIVO
                    </span>
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(10,10,10,0.75)', color: 'var(--text-primary)', fontSize: 10, padding: '2px 7px', borderRadius: 4 }}>
                      👁 {s.espectadores}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {s.jugador?.discord_username ?? s.jugador?.nickname_juego ?? s.username}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.titulo}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>
            ÚLTIMOS COMPARTIDOS
          </div>
          <HighlightsGrid inicial={highlights ?? []} total={count ?? 0} />
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
