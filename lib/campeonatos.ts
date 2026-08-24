export type TrofeoInfo = { nombre: string; icono: string; color: string } | null

export type CampeonatoRaw = {
  personaje_id: string
  tipo: string | null
  equipo_nombre: string | null
  puesto: number | null
  torneo: { nombre: string; trofeo: TrofeoInfo } | null
}

export type TrofeoGrupo = { trofeo: TrofeoInfo; tipoClan: boolean; puesto: 1 | 2; count: number; nombres: string[] }

/** Agrupa los campeonatos/subcampeonatos de cada personaje por copa (misma
 *  copa personalizada → un solo badge con contador; sin copa asignada → cae
 *  en un grupo "genérico" por tipo+puesto, también contado). Así se puede
 *  distinguir cuántos títulos tiene alguien y de cuáles copas, en vez de un
 *  ícono suelto que no cambia entre 1 y 10 campeonatos — mismo criterio en
 *  el ranking y el perfil. El segundo puesto SIEMPRE cae en el grupo
 *  genérico (medalla de plata) — la copa personalizada es un premio de
 *  campeón, no se le asigna a quien salió subcampeón. */
export function agruparTrofeos(raw: CampeonatoRaw[] | null | undefined): Map<string, TrofeoGrupo[]> {
  const porPersonaje = new Map<string, Map<string, TrofeoGrupo>>()
  raw?.forEach(c => {
    if (!c.torneo) return
    const tipoClan = c.tipo === 'equipo'
    const puesto: 1 | 2 = c.puesto === 2 ? 2 : 1
    const trofeo = puesto === 1 ? (c.torneo.trofeo ?? null) : null
    const key = `${tipoClan ? 'clan' : 'ind'}:${puesto}:${trofeo?.nombre ?? '__generico'}`
    const grupos = porPersonaje.get(c.personaje_id) ?? new Map<string, TrofeoGrupo>()
    const nombre = tipoClan ? `${c.torneo.nombre} (${c.equipo_nombre})` : c.torneo.nombre
    const existente = grupos.get(key)
    if (existente) { existente.count++; existente.nombres.push(nombre) }
    else grupos.set(key, { trofeo, tipoClan, puesto, count: 1, nombres: [nombre] })
    porPersonaje.set(c.personaje_id, grupos)
  })
  const resultado = new Map<string, TrofeoGrupo[]>()
  porPersonaje.forEach((grupos, personajeId) => {
    resultado.set(personajeId, [...grupos.values()].sort((a, b) => a.puesto - b.puesto || b.count - a.count))
  })
  return resultado
}

/** Campeón (puesto 1) o subcampeón (puesto 2) de un torneo ya jugado. */
export type Campeon = { personaje_id: string; player_id: string | null; equipo: boolean; equipo_nombre: string | null }

function normalizar(s: string) {
  return s.normalize('NFC').replace(/[‘’ʼ´`]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase()
}

type StatsPorEquipo = Record<string, { w: number; d: number; for: number; against: number }>

function calcularStats(matches: { equipo_a_id: string | null; equipo_b_id: string | null; ganador_id: string | null; resultado: string | null }[]): StatsPorEquipo {
  const stats: StatsPorEquipo = {}
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
  return stats
}

/** Devuelve los ids del mejor "escalón" entre los candidatos que no están ya
 *  en `excluir` — mismo criterio de desempate que el resto: más victorias,
 *  después diferencia de puntos, después puntos a favor. Empate exacto en
 *  los tres criterios = co-campeones/co-subcampeones. */
function mejorEscalon(stats: StatsPorEquipo, excluir: Set<string>): string[] {
  const entries = Object.entries(stats).filter(([id]) => !excluir.has(id))
  if (entries.length === 0) return []
  entries.sort(([, x], [, y]) => y.w - x.w || (y.for - y.against) - (x.for - x.against) || y.for - x.for)
  const [, top] = entries[0]
  return entries
    .filter(([, s]) => s.w === top.w && s.for - s.against === top.for - top.against && s.for === top.for)
    .map(([id]) => id)
}

/** Resuelve team_id -> Campeon[] para un conjunto de equipos ganadores,
 *  compartido entre la detección de campeón y de subcampeón. Para 2v2+ el
 *  equipo tiene team_members con personaje_id ya cargado. Para 1v1 cargados
 *  retroactivamente (MACUCAP, Brujos#1, Arqueros1v1) el equipo es "de una
 *  persona" y solo tiene capitan_id — ahí se resuelve el personaje por
 *  player_id (y si el jugador tiene más de un personaje, por coincidencia
 *  de nombre con el nombre del equipo). */
async function resolverCampeonesDeEquipos(supabase: any, teamIds: string[]): Promise<Campeon[]> {
  if (teamIds.length === 0) return []

  const { data: members } = await supabase
    .from('team_members')
    .select('team_id, player_id, personaje_id')
    .in('team_id', teamIds)

  const porTeam: { personaje_id: string; player_id: string | null; team_id: string }[] = []
  const equiposSinMembers = teamIds.filter(id => !members?.some((m: any) => m.team_id === id))

  members?.forEach((m: any) => { if (m.personaje_id) porTeam.push({ personaje_id: m.personaje_id, player_id: m.player_id, team_id: m.team_id }) })

  const { data: teamsInfo } = await supabase.from('teams').select('id, nombre, capitan_id').in('id', teamIds)
  const nombrePorTeam = new Map((teamsInfo ?? []).map((t: any) => [t.id, t.nombre]))

  if (equiposSinMembers.length > 0) {
    for (const team of (teamsInfo ?? []).filter((t: any) => equiposSinMembers.includes(t.id))) {
      let personajes: any[] | null = null
      if (team.capitan_id) {
        const res = await supabase.from('personajes').select('id, nickname_juego, player_id').eq('player_id', team.capitan_id)
        personajes = res.data
      }
      if (!personajes || personajes.length === 0) {
        const res = await supabase.from('personajes').select('id, nickname_juego, player_id').ilike('nickname_juego', team.nombre)
        personajes = res.data
      }
      if (!personajes || personajes.length === 0) continue
      const match = personajes.length === 1 ? personajes[0] : personajes.find((p: any) => normalizar(p.nickname_juego) === normalizar(team.nombre))
      const elegido = match ?? personajes[0]
      porTeam.push({ personaje_id: elegido.id, player_id: elegido.player_id, team_id: team.id })
    }
  }

  const countPorTeam = new Map<string, number>()
  porTeam.forEach(c => countPorTeam.set(c.team_id, (countPorTeam.get(c.team_id) ?? 0) + 1))

  const campeones: Campeon[] = porTeam.map(c => ({
    personaje_id: c.personaje_id,
    player_id: c.player_id,
    equipo: (countPorTeam.get(c.team_id) ?? 0) > 1,
    equipo_nombre: (countPorTeam.get(c.team_id) ?? 0) > 1 ? ((nombrePorTeam.get(c.team_id) as string) ?? null) : null,
  }))

  const vistos = new Set<string>()
  return campeones.filter(c => { if (vistos.has(c.personaje_id)) return false; vistos.add(c.personaje_id); return true })
}

async function equiposFinalYPenultimos(supabase: any, torneoId: string) {
  const { data: torneo } = await supabase.from('tournaments').select('bracket_type').eq('id', torneoId).single()
  const { data: matches } = await supabase
    .from('matches')
    .select('ronda_numero, ganador_id, equipo_a_id, equipo_b_id, resultado')
    .eq('torneo_id', torneoId)
    .eq('estado', 'jugado')
  if (!matches || matches.length === 0) return { primeros: [] as string[], segundos: [] as string[] }

  if (torneo?.bracket_type === 'round_robin') {
    const stats = calcularStats(matches)
    const primeros = mejorEscalon(stats, new Set())
    const segundos = mejorEscalon(stats, new Set(primeros))
    return { primeros, segundos }
  }

  // Eliminación simple/doble/liga+copa: el campeón es quien ganó la ronda
  // con mayor ronda_numero; el subcampeón es quien perdió esa(s) misma(s)
  // final(es) — el rival directo de cada ganador en esa ronda.
  const maxRonda = Math.max(...matches.map((m: any) => m.ronda_numero))
  const finales = matches.filter((m: any) => m.ronda_numero === maxRonda && m.ganador_id)
  const primeros = [...new Set(finales.map((m: any) => m.ganador_id))] as string[]
  const segundos = [...new Set(finales.map((m: any) => m.ganador_id === m.equipo_a_id ? m.equipo_b_id : m.equipo_a_id).filter(Boolean))] as string[]
  return { primeros, segundos: segundos.filter(id => !primeros.includes(id)) }
}

export async function detectarCampeones(supabase: any, torneoId: string): Promise<Campeon[]> {
  const { primeros } = await equiposFinalYPenultimos(supabase, torneoId)
  return resolverCampeonesDeEquipos(supabase, primeros)
}

/** Subcampeón(es) — puesto 2. En eliminación es quien pierde la final (o
 *  las finales, si el torneo tiene varias en simultáneo); en round robin es
 *  el escalón inmediatamente debajo del primero en la tabla de posiciones. */
export async function detectarSegundoPuesto(supabase: any, torneoId: string): Promise<Campeon[]> {
  const { segundos } = await equiposFinalYPenultimos(supabase, torneoId)
  return resolverCampeonesDeEquipos(supabase, segundos)
}
