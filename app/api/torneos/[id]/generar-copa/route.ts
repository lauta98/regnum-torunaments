import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { roundName, buildSingleElimination, buildDoubleElimination, standingsFromMatches, nextPow2 } from '@/lib/bracketGen'
import { esOrganizadorDelTorneo } from '@/lib/roles'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (torneo.bracket_type !== 'league_cup') {
    return NextResponse.json({ error: 'Este torneo no es de tipo Liga + Copa.' }, { status: 400 })
  }
  if (!torneo.playoff_cupo || torneo.playoff_cupo < 2) {
    return NextResponse.json({ error: 'El torneo no tiene un cupo de copa configurado.' }, { status: 400 })
  }

  const { data: ligaMatches } = await supabase.from('matches').select('*').eq('torneo_id', torneoId).eq('bracket', 'league')
  if (!ligaMatches || ligaMatches.length === 0) {
    return NextResponse.json({ error: 'Todavía no se generó la fase de liga.' }, { status: 400 })
  }
  const pendientes = ligaMatches.filter(m => m.estado !== 'jugado')
  if (pendientes.length > 0) {
    return NextResponse.json({
      error: `Todavía faltan ${pendientes.length} partido(s) de la fase de liga por jugarse.`,
    }, { status: 409 })
  }

  const { count: yaExiste } = await supabase
    .from('matches').select('id', { count: 'exact', head: true })
    .eq('torneo_id', torneoId).neq('bracket', 'league')
  if ((yaExiste ?? 0) > 0) {
    return NextResponse.json({ error: 'La copa ya fue generada para este torneo.' }, { status: 409 })
  }

  const standings = standingsFromMatches(ligaMatches)
  if (standings.length < torneo.playoff_cupo) {
    return NextResponse.json({
      error: `Solo ${standings.length} equipo(s) jugaron partidos de liga — hacen falta ${torneo.playoff_cupo} para armar la copa.`,
    }, { status: 400 })
  }

  const clasificados = standings.slice(0, torneo.playoff_cupo).map(s => s.teamId)
  const size = nextPow2(clasificados.length)

  const rows: any[] = []

  if (torneo.playoff_bracket_type === 'double_elimination') {
    if (size !== clasificados.length) {
      return NextResponse.json({
        error: `Eliminación doble solo admite un cupo de copa que sea potencia de 2 (4, 8, 16...). El cupo configurado es ${clasificados.length}.`,
      }, { status: 400 })
    }
    // clasificados ya está en orden de posiciones de liga (1º, 2º, 3º...) —
    // buildDoubleElimination se encarga de repartirlo por el cuadro con
    // seedOrder para que los primeros puestos no se crucen en la primera
    // ronda.
    const { main, losers } = buildDoubleElimination(clasificados, clasificados)
    main.forEach((roundMatches, idx) => {
      const isFinal = idx === main.length - 1
      const ronda = isFinal ? 'Final Llave Principal' : roundName(roundMatches.length, false)
      roundMatches.forEach(m => {
        // Un bye real solo existe en la Ronda 1 de la copa — ver
        // comentario en buildSingleElimination (lib/bracketGen.ts).
        const esBye = idx === 0 && (!!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA))
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
          ronda_numero: spec.round, posicion: p, equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
        })
      }
    })
    rows.push({
      torneo_id: torneoId, bracket: 'grand_final', ronda: 'Gran Final',
      ronda_numero: 1, posicion: 1, equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
    })
  } else {
    const rounds = buildSingleElimination(clasificados, clasificados)
    rounds.forEach((roundMatches, idx) => {
      const isFinal = idx === rounds.length - 1
      const ronda = roundName(roundMatches.length, isFinal)
      roundMatches.forEach(m => {
        // Un bye real solo existe en la Ronda 1 de la copa — ver
        // comentario en buildSingleElimination (lib/bracketGen.ts).
        const esBye = idx === 0 && (!!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA))
        rows.push({
          torneo_id: torneoId, bracket: 'main', ronda, ronda_numero: m.round, posicion: m.posicion,
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

  return NextResponse.json({ ok: true, clasificados: clasificados.length, partidos: rows.length })
}
