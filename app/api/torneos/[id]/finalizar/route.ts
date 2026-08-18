import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { detectarCampeones } from '@/lib/campeonatos'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  const { data: torneo } = await supabase.from('tournaments').select('creator_id').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  const puede = me && (me.id === torneo.creator_id || me.role === 'admin')
  if (!puede) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const svc = createServiceSupabase()
  const { error: updateErr } = await svc.from('tournaments').update({ estado: 'finalizado' }).eq('id', torneoId)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const campeones = await detectarCampeones(svc, torneoId)
  if (campeones.length > 0) {
    await svc.from('campeonatos').upsert(
      campeones.map(c => ({
        torneo_id: torneoId, personaje_id: c.personaje_id, player_id: c.player_id,
        tipo: c.equipo ? 'equipo' : 'individual', equipo_nombre: c.equipo_nombre,
      })),
      { onConflict: 'torneo_id,personaje_id', ignoreDuplicates: true }
    )
  }

  return NextResponse.json({ ok: true, campeones: campeones.length })
}
