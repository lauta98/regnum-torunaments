import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { canAdmin } from '@/lib/roles'
import BuscadorPersonajes from './BuscadorPersonajes'
import PersonajeRow from './PersonajeRow'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Gestionar Personajes' }

export default async function AdminPersonajesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('players').select('role').eq('user_id', user.id).single()
  if (!me || !canAdmin(me.role)) redirect('/')

  let personajes: any[] = []
  if (q && q.trim().length >= 2) {
    const { data } = await supabase
      .from('personajes')
      .select('id, nickname_juego, reino, clase, mmr, partidas_jugadas, partidas_ganadas, winstreak, verificado, player_id')
      .ilike('nickname_juego', `%${q.trim()}%`)
      .order('nickname_juego')
      .limit(50)
    personajes = data ?? []
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2, color: 'var(--gold)', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, padding: '2px 8px' }}>
            ADMINISTRADOR
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2, marginTop: 8 }}>
            GESTIONAR PERSONAJES
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buscá por nickname para editar clase, reino, mmr o estadísticas. Solo se pueden borrar personajes sin partidas jugadas.
          </p>
        </div>

        <BuscadorPersonajes initialQuery={q ?? ''} />

        {q && q.trim().length >= 2 && personajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
            No se encontraron personajes con "{q}".
          </div>
        )}

        {personajes.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden', marginTop: 20 }}>
            {personajes.map((p, i) => (
              <PersonajeRow key={p.id} personaje={p} borderBottom={i < personajes.length - 1} />
            ))}
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
