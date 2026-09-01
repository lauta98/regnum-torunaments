import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { crearOrden } from '@/lib/paypal'

export async function POST() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: me } = await supabase.from('players').select('id, es_premium').eq('user_id', user.id).single()
    if (!me) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    if (me.es_premium) return NextResponse.json({ error: 'Ya tenés premium' }, { status: 400 })

    const id = await crearOrden(me.id)
    return NextResponse.json({ id })
  } catch (err) {
    console.error('premium/paypal/crear-orden error:', err)
    return NextResponse.json({ error: 'Error al crear el pago' }, { status: 500 })
  }
}
