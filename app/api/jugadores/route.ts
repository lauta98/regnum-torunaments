import { NextRequest } from 'next/server'
import { createPublicSupabase } from '@/lib/supabase-server'
import { getTier, MMR_TIERS, REINOS } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'
import { agruparTrofeos } from '@/lib/campeonatos'

// Misma lógica que tenía app/jugadores/page.tsx cuando era 100%
// server-rendered — se porta acá sin cambios de comportamiento, solo
// de dónde corre. Ver esa página para el porqué: leer searchParams en
// el Server Component de una página le impide a Next.js cachearla
// (mismo motivo documentado en /, /brackets, /multimedia). Esta ruta
// sí puede cachearse por combinación de query string (revalidate más
// abajo), que es lo que en el fondo se buscaba.
export const revalidate = 30

const PAGE = 50

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const q = params.get('q') ?? undefined
  const reino = params.get('reino') ?? undefined
  const clase = params.get('clase') ?? undefined
  const vista = params.get('vista') ?? 'personajes'
  const multiclase = params.get('multiclase') ?? undefined
  const page = parseInt(params.get('page') || '1')
  const from = (page - 1) * PAGE

  const supabase = createPublicSupabase()

  let query = supabase
    .from('personajes')
    .select('*, player:players!personajes_player_id_fkey(id, discord_username, discord_avatar, avatar_url, role, es_premium, premium_color, premium_bg)', { count: 'exact' })
    .order('mmr', { ascending: false })

  if (reino) query = query.eq('reino', reino as Reino)
  if (clase) query = query.eq('clase', clase as Clase)
  if (q)     query = query.ilike('nickname_juego', `%${q}%`)

  const { data: personajes, count } = await (
    vista === 'cuentas' ? query.limit(1000) : query.range(from, from + PAGE - 1)
  )

  const personajeIds = (personajes ?? []).map((p: any) => p.id)
  const { data: campeonatosData } = personajeIds.length ? await supabase
    .from('campeonatos').select('personaje_id, tipo, equipo_nombre, puesto, torneo:tournaments(nombre, formato, trofeo:trofeos!tournaments_trofeo_id_fkey(nombre, icono, color, forma), trofeo_subcampeon:trofeos!tournaments_trofeo_subcampeon_id_fkey(nombre, icono, color, forma))').in('personaje_id', personajeIds)
    : { data: null }
  const trofeosPorPersonaje = Object.fromEntries(agruparTrofeos(campeonatosData as any))

  let cuentas: any[] = []
  if (vista === 'cuentas') {
    const map = new Map<string, any>()
    for (const p of personajes ?? []) {
      const pid = p.player?.id ?? p.player_id
      if (!map.has(pid)) {
        map.set(pid, { ...p.player, best_personaje: p, personajes: [p] })
      } else {
        const entry = map.get(pid)
        entry.personajes.push(p)
        if (p.mmr > entry.best_personaje.mmr) entry.best_personaje = p
      }
    }
    cuentas = Array.from(map.values())

    cuentas.forEach(c => {
      c.clasesDistintas = [...new Set(c.personajes.map((p: any) => p.clase).filter(Boolean))] as Clase[]
      c.esMulticlase = c.clasesDistintas.length >= 2
    })

    if (multiclase) cuentas = cuentas.filter(c => c.esMulticlase)
    cuentas.sort((a, b) => b.best_personaje.mmr - a.best_personaje.mmr)

    const { data: principales } = await supabase.from('players').select('id, personaje_principal_id').in('id', cuentas.map(c => c.id))
    const principalPorCuenta = new Map<string, string>()
    principales?.forEach((p: any) => { if (p.personaje_principal_id) principalPorCuenta.set(p.id, p.personaje_principal_id) })
    cuentas.forEach(c => {
      const principalId = principalPorCuenta.get(c.id)
      const principal = c.personajes.find((p: any) => p.id === principalId)
      c.nombre_mostrado = principal?.nickname_juego ?? c.discord_username ?? null
    })
  }

  let todosPersonajes: any[] = []
  if (vista === 'reinos' || vista === 'rachas') {
    const { data } = await supabase
      .from('personajes')
      .select('*, player:players!personajes_player_id_fkey(id, discord_username)')
      .order('mmr', { ascending: false })
      .limit(1000)
    todosPersonajes = data ?? []
  }

  const promedio = (lista: any[], campo: string) =>
    lista.length ? Math.round(lista.reduce((s, p) => s + (p[campo] ?? 0), 0) / lista.length) : 0

  const distribucionTiers = (lista: any[]) => {
    const conteo = new Map<string, { tier: typeof MMR_TIERS[number]; n: number }>()
    MMR_TIERS.forEach(t => conteo.set(t.name, { tier: t, n: 0 }))
    lista.forEach(p => { const t = getTier(p.mmr); conteo.get(t.name)!.n++ })
    return [...conteo.values()].filter(x => x.n > 0)
  }

  const porReino = vista === 'reinos'
    ? REINOS.map(r => {
        const lista = todosPersonajes.filter(p => p.reino === r)
        return { reino: r, lista, count: lista.length, avgWr: promedio(lista, 'winrate'), topMmr: lista[0]?.mmr ?? 0, tiers: distribucionTiers(lista), top5: lista.slice(0, 5) }
      })
    : []

  const rachas = vista === 'rachas'
    ? todosPersonajes.filter(p => (p.winstreak ?? 0) > 0).sort((a, b) => b.winstreak - a.winstreak).slice(0, 25)
    : []

  return Response.json({ personajes: personajes ?? [], count: count ?? 0, trofeosPorPersonaje, cuentas, porReino, rachas })
}
