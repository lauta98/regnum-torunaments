import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { nextPow2, roundName, buildSingleElimination, buildDoubleElimination, buildRoundRobin } from '@/lib/bracketGen'
import { esOrganizadorDelTorneo } from '@/lib/roles'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!player) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  const esOrganizador = await esOrganizadorDelTorneo(supabase, torneoId, torneo.creator_id, player)
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  // No pisar un cuadro que ya tiene resultados REALES cargados — un BYE no
  // cuenta, se marca 'jugado' automáticamente al generar pero es
  // estructural (sin impacto en mmr), no algo que el organizador cargó.
  const { data: existentes } = await supabase.from('matches').select('id, estado, resultado').eq('torneo_id', torneoId)
  if (existentes && existentes.some(m => m.estado === 'jugado' && m.resultado !== 'BYE')) {
    return NextResponse.json({ error: 'Ya hay resultados cargados — no se puede regenerar el cuadro.' }, { status: 409 })
  }
  // Pasada la guardia, se borra el cuadro viejo (si había) antes de
  // insertar el nuevo — nada de esto tiene mmr que revertir.
  if (existentes && existentes.length > 0) {
    await supabase.from('matches').delete().eq('torneo_id', torneoId)
  }

  const { data: registros } = await supabase
    .from('tournament_registrations')
    .select('team_id')
    .eq('tournament_id', torneoId)
    .eq('estado', 'activo')

  const teamIds = (registros ?? []).map(r => r.team_id)
  if (teamIds.length < 2) {
    return NextResponse.json({ error: 'Hacen falta al menos 2 equipos inscriptos.' }, { status: 400 })
  }

  // Orden ya determinado por el sorteo en vivo (opcional) — se valida que
  // sea exactamente el mismo conjunto de equipos inscriptos, ni más ni menos.
  let orden: string[] | undefined
  try {
    const body = await request.json()
    if (Array.isArray(body?.orden)) orden = body.orden
  } catch { /* sin body o body vacío, sorteo rápido normal */ }

  if (orden) {
    const setEnviado = new Set(orden)
    const setReal = new Set(teamIds)
    const mismosEquipos = setEnviado.size === setReal.size && [...setEnviado].every(t => setReal.has(t))
    if (!mismosEquipos) {
      return NextResponse.json({ error: 'El orden enviado no coincide con los equipos inscriptos.' }, { status: 400 })
    }
  }

  if (torneo.bracket_type === 'double_elimination') {
    const size = nextPow2(teamIds.length)
    if (size !== teamIds.length) {
      return NextResponse.json({
        error: `Eliminación doble solo admite una cantidad de equipos que sea potencia de 2 (4, 8, 16, 32...). Hoy hay ${teamIds.length} inscriptos.`,
      }, { status: 400 })
    }
  }

  // Liga + Copa: acá solo se genera la fase de liga (round robin). La copa
  // se genera aparte, cuando la liga termina, con /generar-copa.
  if (torneo.bracket_type === 'league_cup') {
    if (!torneo.playoff_cupo || torneo.playoff_cupo < 2) {
      return NextResponse.json({ error: 'El torneo no tiene configurado un cupo de copa válido.' }, { status: 400 })
    }
    if (torneo.playoff_cupo > teamIds.length) {
      return NextResponse.json({
        error: `El cupo de copa (${torneo.playoff_cupo}) es mayor a la cantidad de equipos inscriptos (${teamIds.length}).`,
      }, { status: 400 })
    }
  }

  // Limpiar matches vacíos de un intento anterior (ninguno jugado, ya lo validamos arriba)
  if (existentes && existentes.length > 0) {
    await supabase.from('matches').delete().eq('torneo_id', torneoId)
  }

  const rows: any[] = []

  if (torneo.bracket_type === 'double_elimination') {
    const { main, losers } = buildDoubleElimination(teamIds, orden)

    main.forEach((roundMatches, idx) => {
      const isFinal = idx === main.length - 1
      const ronda = (isFinal ? 'Final Llave Principal' : roundName(roundMatches.length, false))
      roundMatches.forEach(m => {
        const esBye = !!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA)
        rows.push({
          torneo_id: torneoId, bracket: 'main', ronda, ronda_numero: m.round, posicion: m.posicion,
          equipo_a_id: m.equipoA, equipo_b_id: m.equipoB,
          estado: esBye ? 'jugado' : 'pendiente',
          ganador_id: esBye ? (m.equipoA ?? m.equipoB) : null,
          resultado: esBye ? 'BYE' : null,
        })
      })
    })

    losers.forEach(spec => {
      for (let p = 1; p <= spec.matches; p++) {
        rows.push({
          torneo_id: torneoId, bracket: 'losers', ronda: `Perdedores — Ronda ${spec.round}`,
          ronda_numero: spec.round, posicion: p,
          equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
        })
      }
    })

    rows.push({
      torneo_id: torneoId, bracket: 'grand_final', ronda: 'Gran Final',
      ronda_numero: 1, posicion: 1, equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
    })
  } else {
    // round_robin y league_cup arrancan igual: se genera la fase de liga.
    // La diferencia es el nombre de la ronda y, para league_cup, que estos
    // partidos quedan marcados bracket='league' (la copa se agrega después,
    // aparte, como bracket='main').
    const esLiga = torneo.bracket_type === 'round_robin' || torneo.bracket_type === 'league_cup'
    const rounds = esLiga ? buildRoundRobin(teamIds) : buildSingleElimination(teamIds, orden)
    const bracketField = torneo.bracket_type === 'league_cup' ? 'league' : 'main'

    rounds.forEach((roundMatches, idx) => {
      const isFinal = !esLiga && idx === rounds.length - 1
      const ronda = esLiga ? `Fecha ${idx + 1}` : roundName(roundMatches.length, isFinal)
      roundMatches.forEach(m => {
        const esBye = !!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA)
        rows.push({
          torneo_id: torneoId, bracket: bracketField, ronda, ronda_numero: m.round, posicion: m.posicion,
          equipo_a_id: m.equipoA, equipo_b_id: m.equipoB,
          estado: esBye ? 'jugado' : 'pendiente',
          ganador_id: esBye ? (m.equipoA ?? m.equipoB) : null,
          resultado: esBye ? 'BYE' : null,
        })
      })
    })
  }

  const { error: insertError } = await supabase.from('matches').insert(rows)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await supabase.from('tournaments').update({ estado: 'live' }).eq('id', torneoId)

  return NextResponse.json({ ok: true, partidos: rows.length })
}
