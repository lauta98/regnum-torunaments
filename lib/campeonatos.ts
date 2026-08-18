/** Detecta el/los campeón/es de un torneo ya jugado.
 *
 * "Campeón" = integrante del equipo ganador de la ronda con mayor
 * ronda_numero entre los partidos jugados. Si esa ronda tiene más de un
 * partido (torneos con final por clase, ej. Cazador/Tirador separados en
 * vez de una final cruzada única) se cuentan todos los ganadores de esa
 * ronda como co-campeones.
 *
 * Para 2v2 el equipo tiene team_members con personaje_id ya cargado. Para
 * 1v1 cargados retroactivamente (MACUCAP, Brujos#1, Arqueros1v1) el equipo
 * es "de una persona" y solo tiene capitan_id — ahí se resuelve el
 * personaje por player_id (y si el jugador tiene más de un personaje, por
 * coincidencia de nombre con el nombre del equipo).
 */
export type Campeon = { personaje_id: string; player_id: string | null }

function normalizar(s: string) {
  return s.normalize('NFC').replace(/[‘’ʼ´`]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Para torneos round_robin no hay "final": el campeón es quien queda
 *  primero en la tabla de posiciones (más victorias, después diferencia
 *  de puntos a favor/contra, después puntos a favor). Si dos o más
 *  equipos quedan exactamente empatados en los tres criterios, se
 *  devuelven todos como co-campeones. */
function tablaDePosiciones(matches: { equipo_a_id: string | null; equipo_b_id: string | null; ganador_id: string | null; resultado: string | null }[]): string[] {
  const stats: Record<string, { w: number; d: number; for: number; against: number }> = {}
  const ensure = (id: string) => (stats[id] ??= { w: 0, d: 0, for: 0, against: 0 })

  for (const m of matches) {
    if (!m.equipo_a_id || !m.equipo_b_id) continue
    const a = ensure(m.equipo_a_id), b = ensure(m.equipo_b_id)
    const parsed = m.resultado?.match(/(\d+)\s*-\s*(\d+)/)
    const scores = parsed ? [Number(parsed[1]), Number(parsed[2])] : null
    if (m.ganador_id) {
      const aGana = m.ganador_id === m.equipo_a_id
      const ganador = aGana ? a : b, perdedor = aGana ? b : a
      ganador.w++
      if (scores) {
        const [sGanador, sPerdedor] = aGana ? scores : [scores[1], scores[0]]
        ganador.for += sGanador; ganador.against += sPerdedor
        perdedor.for += sPerdedor; perdedor.against += sGanador
      }
    } else {
      a.d++; b.d++
      if (scores) { a.for += scores[0]; a.against += scores[1]; b.for += scores[1]; b.against += scores[0] }
    }
  }

  const entries = Object.entries(stats)
  if (entries.length === 0) return []
  entries.sort(([, x], [, y]) => y.w - x.w || (y.for - y.against) - (x.for - x.against) || y.for - x.for)
  const [, top] = entries[0]
  return entries
    .filter(([, s]) => s.w === top.w && s.for - s.against === top.for - top.against && s.for === top.for)
    .map(([id]) => id)
}

export async function detectarCampeones(supabase: any, torneoId: string): Promise<Campeon[]> {
  const { data: torneo } = await supabase.from('tournaments').select('bracket_type').eq('id', torneoId).single()
  const { data: matches } = await supabase
    .from('matches')
    .select('ronda_numero, ganador_id, equipo_a_id, equipo_b_id, resultado')
    .eq('torneo_id', torneoId)
    .eq('estado', 'jugado')
  if (!matches || matches.length === 0) return []

  let teamIds: string[]
  if (torneo?.bracket_type === 'round_robin') {
    teamIds = tablaDePosiciones(matches)
  } else {
    const maxRonda = Math.max(...matches.map((m: any) => m.ronda_numero))
    teamIds = [...new Set(matches.filter((m: any) => m.ronda_numero === maxRonda && m.ganador_id).map((m: any) => m.ganador_id))] as string[]
  }
  if (teamIds.length === 0) return []

  const { data: members } = await supabase
    .from('team_members')
    .select('team_id, player_id, personaje_id')
    .in('team_id', teamIds)

  const campeones: Campeon[] = []
  const equiposSinMembers = teamIds.filter(id => !members?.some((m: any) => m.team_id === id))

  members?.forEach((m: any) => { if (m.personaje_id) campeones.push({ personaje_id: m.personaje_id, player_id: m.player_id }) })

  if (equiposSinMembers.length > 0) {
    const { data: teams } = await supabase.from('teams').select('id, nombre, capitan_id').in('id', equiposSinMembers)
    for (const team of teams ?? []) {
      let personajes: any[] | null = null
      if (team.capitan_id) {
        const res = await supabase.from('personajes').select('id, nickname_juego, player_id').eq('player_id', team.capitan_id)
        personajes = res.data
      }
      // Si el capitan_id no resuelve a ningun personaje (ej. el personaje se
      // reasigno a otra cuenta despues de jugado el torneo, quedando el
      // capitan_id viejo huerfano) o directamente no hay capitan_id (equipos
      // de clan en formatos grandes, sin roster individual) se intenta por
      // coincidencia exacta de nombre de equipo == nickname del personaje.
      if (!personajes || personajes.length === 0) {
        const res = await supabase.from('personajes').select('id, nickname_juego, player_id').ilike('nickname_juego', team.nombre)
        personajes = res.data
      }
      if (!personajes || personajes.length === 0) continue
      const match = personajes.length === 1 ? personajes[0] : personajes.find((p: any) => normalizar(p.nickname_juego) === normalizar(team.nombre))
      const elegido = match ?? personajes[0]
      campeones.push({ personaje_id: elegido.id, player_id: elegido.player_id })
    }
  }

  // dedup por personaje_id (por si el mismo personaje aparece 2 veces por algún dato inconsistente)
  const vistos = new Set<string>()
  return campeones.filter(c => { if (vistos.has(c.personaje_id)) return false; vistos.add(c.personaje_id); return true })
}
