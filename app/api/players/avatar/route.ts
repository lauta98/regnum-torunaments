import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

// El archivo ya se subió a Storage del lado del cliente (mismo patrón que
// SubirFoto.tsx) — esta ruta guarda la URL resultante en la propia fila
// del caller. Se muestra apenas se sube (no hay aprobación previa); si
// alguien la reporta después, la moderación pasa por
// /api/players/reportar-avatar y el panel de admin.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!caller) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const { avatarUrl } = await req.json()
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Falta la foto' }, { status: 400 })
    }

    // Subir una foto nueva limpia cualquier reporte viejo — es una imagen
    // distinta, no tiene sentido que arrastre el reporte de la anterior.
    const { error } = await createServiceSupabase()
      .from('players')
      .update({ avatar_url: avatarUrl, avatar_reportado: false, avatar_reporte_motivo: null })
      .eq('id', caller.id)

    if (error) {
      console.error('players/avatar error:', error)
      return NextResponse.json({ error: 'Error al guardar la foto' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('players/avatar unexpected error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
