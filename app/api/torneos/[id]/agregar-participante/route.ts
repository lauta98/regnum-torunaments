import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { esOrganizadorDelTorneo } from '@/lib/roles'
import { FORMAT_TEAM_SIZE } from '@/lib/constants'
import type { TournamentFormat } from '@/lib/types'

/** Carga manual de un equipo/participante por el organizador — mismo
 *  camino que la inscripción self-service (crear equipo + team_members +
 *  tournament_registrations), pero disparado por el organizador sobre
 *  personajes que elige él, no sobre su propia cuenta. Útil para cargar
 *  a mano jugadores que se anotaron por fuera del sitio (Discord, etc.)
 *  o para armar torneos de prueba sin depender del flujo self-service. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!player) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  // Service role de acá en más: `tournament_organizers` no tiene policy
  // de RLS para el cliente autenticado normal, y las escrituras de este
  // flujo (teams/team_members/tournament_registrations) están gateadas
  // por este mismo check, no por RLS propia.
  const svc = createServiceSupabase()
  const esOrganizador = await esOrganizadorDelTorneo(svc, torneoId, torneo.creator_id, player)
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const personajeIds: string[] = Array.isArray(body?.personajeIds) ? body.personajeIds : []
  const nombreEquipo: string | undefined = typeof body?.nombreEquipo === 'string' ? body.nombreEquipo.trim() : undefined

  const teamSize = FORMAT_TEAM_SIZE[torneo.formato as TournamentFormat]

  if (personajeIds.length === 0) {
    return NextResponse.json({ error: 'Elegí al menos un personaje' }, { status: 400 })
  }
  if (personajeIds.length !== teamSize) {
    return NextResponse.json({ error: `Este torneo es ${torneo.formato} — hacen falta exactamente ${teamSize} personaje(s), elegiste ${personajeIds.length}.` }, { status: 400 })
  }
  if (new Set(personajeIds).size !== personajeIds.length) {
    return NextResponse.json({ error: 'No podés repetir el mismo personaje' }, { status: 400 })
  }
  if (teamSize > 1 && !nombreEquipo) {
    return NextResponse.json({ error: 'Ponele un nombre al equipo' }, { status: 400 })
  }

  const { data: personajes } = await svc
    .from('personajes')
    .select('id, nickname_juego, clase, player_id')
    .in('id', personajeIds)
  if (!personajes || personajes.length !== personajeIds.length) {
    return NextResponse.json({ error: 'Alguno de los personajes elegidos ya no existe' }, { status: 400 })
  }

  const permitidas: string[] | null = torneo.subclases_permitidas
  if (permitidas && permitidas.length > 0) {
    const noElegible = personajes.find(p => !permitidas.includes(p.clase))
    if (noElegible) {
      return NextResponse.json({ error: `${noElegible.nickname_juego} (${noElegible.clase}) no cumple la restricción de clase de este torneo.` }, { status: 400 })
    }
  }

  // Ninguno de los personajes elegidos puede estar ya inscripto (activo)
  // en este torneo con otro equipo.
  const { data: registrosActivos } = await svc
    .from('tournament_registrations')
    .select('team_id')
    .eq('tournament_id', torneoId)
    .eq('estado', 'activo')
  const teamIdsEnTorneo = (registrosActivos ?? []).map(r => r.team_id)
  if (teamIdsEnTorneo.length > 0) {
    const { data: miembrosExistentes } = await svc
      .from('team_members')
      .select('personaje_id, personaje:personajes(nickname_juego)')
      .in('team_id', teamIdsEnTorneo)
      .in('personaje_id', personajeIds)
    if (miembrosExistentes && miembrosExistentes.length > 0) {
      const nombres = miembrosExistentes.map((m: any) => m.personaje?.nickname_juego).filter(Boolean).join(', ')
      return NextResponse.json({ error: `Ya inscripto en este torneo: ${nombres || 'uno de los personajes elegidos'}.` }, { status: 409 })
    }
  }

  const nombre = teamSize === 1 ? personajes[0].nickname_juego : nombreEquipo!
  const { data: team, error: teamErr } = await svc
    .from('teams')
    .insert({ nombre, capitan_id: personajes[0].player_id, tipo: torneo.formato })
    .select('id')
    .single()
  if (teamErr || !team) return NextResponse.json({ error: teamErr?.message ?? 'Error al crear el equipo' }, { status: 500 })

  const { error: memberErr } = await svc
    .from('team_members')
    .insert(personajes.map(p => ({ team_id: team.id, player_id: p.player_id, personaje_id: p.id })))
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  const { error: regErr } = await svc
    .from('tournament_registrations')
    .insert({ tournament_id: torneoId, team_id: team.id })
  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, teamId: team.id })
}
