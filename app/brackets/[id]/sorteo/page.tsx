import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import SorteoEnVivo from './SorteoEnVivo'
import { esOrganizadorDelTorneo } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export default async function SorteoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  // Bypass SOLO en dev local (next dev siempre corre con
  // NODE_ENV=development; Vercel — producción y previews — siempre
  // compila con NODE_ENV=production, así que esto nunca se activa
  // fuera de la máquina del desarrollador). Existe porque el login de
  // Discord contra el Supabase compartido con Market no acepta el
  // redirect de localhost — permite probar la ruleta del sorteo sin
  // loguearse. TODO: sacar esto una vez que localhost esté habilitado
  // en la lista de Redirect URLs de Supabase.
  const devBypass = process.env.NODE_ENV === 'development'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !devBypass) redirect('/login')

  const { data: player } = user
    ? await supabase.from('players').select('id, role').eq('user_id', user.id).single()
    : { data: null }

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', id).single()
  if (!torneo) notFound()

  // Service role: `tournament_organizers` no tiene policy de RLS para
  // el cliente autenticado normal.
  const esOrganizador = devBypass || (!!player && await esOrganizadorDelTorneo(createServiceSupabase(), id, torneo.creator_id, player))
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
    .select('team_id, team:teams(id, nombre, miembros:team_members(personaje:personajes(clase)))')
    .eq('tournament_id', id)
    .eq('estado', 'activo')

  // Para el ícono de la ruleta alcanza con la clase del primer
  // integrante — en 2v2/7v7 un equipo puede mezclar clases, pero mostrar
  // "alguna" sigue siendo más informativo que nada.
  const equipos = (registros ?? [])
    .map((r: any) => r.team && { id: r.team.id, nombre: r.team.nombre, clase: r.team.miembros?.[0]?.personaje?.clase ?? null })
    .filter(Boolean)

  return (
    <>
      <Header />
      <SorteoEnVivo torneoId={id} torneoNombre={torneo.nombre} bracketType={torneo.bracket_type} equipos={equipos} />
    </>
  )
}
