import { createServerSupabase } from '@/lib/supabase-server'

// GET: mensajes de una transacción
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const transaction_id = searchParams.get('transaction_id')
    if (!transaction_id) return Response.json({ error: 'Falta transaction_id' }, { status: 400 })

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    // Verificar que el user es parte de la transacción
    const { data: tx } = await supabase
      .from('transactions')
      .select('seller_id, buyer_id')
      .eq('id', transaction_id)
      .single()

    if (!tx || (tx.seller_id !== user.id && tx.buyer_id !== user.id)) {
      return Response.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:profiles(username)')
      .eq('transaction_id', transaction_id)
      .order('created_at', { ascending: true })
      .limit(100)

    // Marcar como leídos los mensajes del otro
    await supabase
      .from('messages')
      .update({ read_by_other: true })
      .eq('transaction_id', transaction_id)
      .neq('sender_id', user.id)
      .eq('read_by_other', false)

    return Response.json({ messages: messages ?? [] })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST: enviar mensaje
export async function POST(req: Request) {
  try {
    const { transaction_id, content } = await req.json()
    if (!transaction_id || !content?.trim()) {
      return Response.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (content.length > 500) {
      return Response.json({ error: 'Mensaje muy largo (máx. 500 caracteres)' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    // Verificar que el user es parte de la transacción
    const { data: tx } = await supabase
      .from('transactions')
      .select('seller_id, buyer_id, listings(item_name)')
      .eq('id', transaction_id)
      .single()

    if (!tx || (tx.seller_id !== user.id && tx.buyer_id !== user.id)) {
      return Response.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ transaction_id, sender_id: user.id, content: content.trim() })
      .select('*, sender:profiles(username)')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Notificar al otro participante
    const otherId = tx.seller_id === user.id ? tx.buyer_id : tx.seller_id
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const listing = tx.listings as { item_name?: string } | null
    await supabase.from('notifications').insert({
      user_id: otherId,
      type: 'message',
      title: `💬 ${senderProfile?.username ?? 'Alguien'} te escribió`,
      body: listing?.item_name ? `Sobre "${listing.item_name}": ${content.slice(0, 60)}${content.length > 60 ? '…' : ''}` : content.slice(0, 80),
      listing_id: null,
    })

    return Response.json({ message })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
