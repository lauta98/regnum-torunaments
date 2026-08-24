import { createServerSupabase } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import SorteoEnVivo from './SorteoEnVivo'
import { esOrganizadorDelTorneo } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export default async function SorteoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!torneo) notFound()

  const esOrganizador = !!player && await esOrganizadorDelTorneo(supabase, id, torneo.creator_id, player)
  if (!esOrganizador) redirect(`/brackets/${id}`)

  if (torneo.bracket_type === 'double_elimination') {
    redirect(`/brackets/${id}`)
  }

  const { data: existentes } = await supabase.from('matches').select('id').eq('torneo_id', id).limit(1)
  if (existentes && existentes.length > 0) {
    redirect(`/brackets/${id}`)
  }

  const { data: registros } = await supabase
    .from('tournament_registrations')
    .select('team_id, team:teams(id, nombre)')
    .eq('tournament_id', id)
    .eq('estado', 'activo')

  const equipos = (registros ?? [])
    .map((r: any) => r.team)
    .filter(Boolean)

  return (
    <>
      <Header />
      <SorteoEnVivo torneoId={id} torneoNombre={torneo.nombre} bracketType={torneo.bracket_type} equipos={equipos} />
    </>
  )
}
