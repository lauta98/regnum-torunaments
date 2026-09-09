import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { notifyDiscord, siteUrl } from '@/lib/discord-webhook'

// No confía en nombre/formato mandados por el cliente — los vuelve a leer
// de la base con service role, así un aviso no puede quedar con datos
// falsos aunque alguien llame la ruta a mano con otro body.
export async function POST(req: NextRequest) {
  const { torneoId } = await req.json()
  if (!torneoId) return NextResponse.json({ error: 'Falta torneoId' }, { status: 400 })

  const svc = createServiceSupabase()
  const { data: torneo } = await svc
    .from('tournaments')
    .select('nombre, formato, bracket_type, estado')
    .eq('id', torneoId)
    .single()

  if (!torneo || torneo.estado !== 'inscripciones') {
    return NextResponse.json({ ok: false })
  }

  await notifyDiscord({
    title: `🏆 Inscripciones abiertas: ${torneo.nombre}`,
    description: `Ya podés anotarte — formato ${torneo.formato}.`,
    url: siteUrl(`/brackets/${torneoId}`),
    footer: 'CoR Tournaments',
  })

  return NextResponse.json({ ok: true })
}
