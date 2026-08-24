import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { canAdmin } from '@/lib/roles'
import EditarTorneoForm from './EditarTorneoForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Editar Torneo' }

export default async function EditarTorneoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('players').select('role').eq('user_id', user.id).single()
  if (!me || !canAdmin(me.role)) redirect('/')

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!torneo) notFound()

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2, color: 'var(--gold)', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, padding: '2px 8px' }}>
            ADMINISTRADOR
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2, marginTop: 8 }}>
            EDITAR TORNEO
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {torneo.nombre}
          </p>
        </div>

        <EditarTorneoForm torneo={torneo} />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
