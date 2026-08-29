import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { canAdmin, esOrganizadorDelTorneo } from '@/lib/roles'
import EditarTorneoForm from '@/app/admin/torneos/[id]/EditarTorneoForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Editar Torneo' }

export default async function EditarTorneoOrganizadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!me) redirect('/')

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!torneo) notFound()

  const esAdmin = canAdmin(me.role)
  // Service role: `tournament_organizers` no tiene policy de RLS para
  // el cliente autenticado normal — con el cliente de sesión, un
  // co-organizador nunca pasaba este check.
  const puedeEditar = await esOrganizadorDelTorneo(createServiceSupabase(), id, torneo.creator_id, me)
  if (!puedeEditar) redirect('/organizador')

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/organizador" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← Panel organizador</Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2, marginTop: 8 }}>
            EDITAR TORNEO
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {torneo.nombre}
          </p>
        </div>

        <EditarTorneoForm torneo={torneo} isAdmin={esAdmin} />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
