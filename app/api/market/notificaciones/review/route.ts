import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { reviewed_id, score, item_name } = await req.json()
    if (!reviewed_id || !score) return Response.json({ ok: false }, { status: 400 })

    const supabase = await createServerSupabase()

    const emoji = score >= 4 ? '⭐' : score === 3 ? '🌟' : '⚠️'
    const label = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][score] ?? ''

    await supabase.from('notifications').insert({
      user_id: reviewed_id,
      type: 'review',
      title: `${emoji} Recibiste una calificación: ${label} (${score}/5)`,
      body: item_name ? `Por la transacción de "${item_name}"` : null,
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
