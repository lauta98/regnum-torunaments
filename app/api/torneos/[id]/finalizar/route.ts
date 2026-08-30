import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { detectarCampeones, detectarSegundoPuesto } from '@/lib/campeonatos'
import { esOrganizadorDelTorneo } from '@/lib/roles'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!me) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  const { data: torneo } = await supabase.from('tournaments').select('creator_id').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  // Service role: `tournament_organizers` no tiene policy de RLS para el
  // cliente autenticado normal.
  const svc = createServiceSupabase()
  const puede = await esOrganizadorDelTorneo(svc, torneoId, torneo.creator_id, me)
  if (!puede) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { error: updateErr } = await svc.from('tournaments').update({ estado: 'finalizado' }).eq('id', torneoId)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // El torneo ya quedó marcado `finalizado` arriba — si el insert de acá
  // abajo falla y no se corta la respuesta, el organizador ve "listo" y
  // nadie se entera de que el campeón/subcampeón nunca se coronó (pasó
  // de verdad: el torneo quedó finalizado con `campeonatos` vacío y sin
  // ningún error visible en ningún lado). Por eso ahora se revisa el
  // `error` de cada upsert igual que ya se hacía con `updateErr`.
  const campeones = await detectarCampeones(svc, torneoId)
  if (campeones.length > 0) {
    const { error: campeonesErr } = await svc.from('campeonatos').upsert(
      campeones.map(c => ({
        torneo_id: torneoId, personaje_id: c.personaje_id, player_id: c.player_id,
        tipo: c.equipo ? 'equipo' : 'individual', equipo_nombre: c.equipo_nombre, puesto: 1,
      })),
      { onConflict: 'torneo_id,personaje_id', ignoreDuplicates: true }
    )
    if (campeonesErr) return NextResponse.json({ error: `Torneo finalizado, pero no se pudo coronar al campeón: ${campeonesErr.message}` }, { status: 500 })
  }

  const subcampeones = await detectarSegundoPuesto(svc, torneoId)
  if (subcampeones.length > 0) {
    const { error: subcampeonesErr } = await svc.from('campeonatos').upsert(
      subcampeones.map(c => ({
        torneo_id: torneoId, personaje_id: c.personaje_id, player_id: c.player_id,
        tipo: c.equipo ? 'equipo' : 'individual', equipo_nombre: c.equipo_nombre, puesto: 2,
      })),
      { onConflict: 'torneo_id,personaje_id', ignoreDuplicates: true }
    )
    if (subcampeonesErr) return NextResponse.json({ error: `Torneo finalizado, pero no se pudo coronar al subcampeón: ${subcampeonesErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, campeones: campeones.length, subcampeones: subcampeones.length })
}
