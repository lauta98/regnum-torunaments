'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TX_ESTADO_STYLE, RAREZA_COLOR, formatPrecio, listingHref } from '@/lib/market/constants'
import ChatBox from '@/components/market/ChatBox'

function SkeletonTrato() {
  return (
    <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ height: 20, width: 80, background: 'var(--dark-surface)', borderRadius: 4 }} />
        <div style={{ height: 20, width: 120, background: 'var(--dark-surface)', borderRadius: 4 }} />
      </div>
      <div style={{ height: 18, width: '60%', background: 'var(--dark-surface)', borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 14, width: '40%', background: 'var(--dark-surface)', borderRadius: 4 }} />
    </div>
  )
}

export default function TransaccionesPage() {
  const [tratos, setTratos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const POR_PAGINA = 8
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings(id, item_name, item_category, subcategoria, rareza, type, price_money, price_gold, currency_label),
          seller:profiles!transactions_seller_id_fkey(id, username, avg_rating),
          buyer:profiles!transactions_buyer_id_fkey(id, username, avg_rating)
        `)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      setTratos(data || [])

      // Contar mensajes no leídos por transacción
      if (data?.length) {
        const txIds = data.map((t: any) => t.id)
        const { data: unread } = await supabase
          .from('messages')
          .select('transaction_id')
          .in('transaction_id', txIds)
          .neq('sender_id', user.id)
          .eq('read_by_other', false)

        const map: Record<string, number> = {}
        for (const m of unread ?? []) {
          map[m.transaction_id] = (map[m.transaction_id] || 0) + 1
        }
        setUnreadMap(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: '24px 20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ height: 24, width: 120, background: 'var(--dark-card)', borderRadius: 6, marginBottom: 24 }} />
      <SkeletonTrato /><SkeletonTrato /><SkeletonTrato />
    </div>
  )

  const totalPags = Math.ceil(tratos.length / POR_PAGINA)
  const tratosPag = tratos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div style={{ padding: '24px 20px', maxWidth: 700, margin: '0 auto' }}>
      <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)', marginBottom: 24 }}>Mis Tratos</h1>

      {/* Instrucciones del flujo */}
      <div style={{
        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
        fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7,
      }}>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>¿Cómo funciona?</span>
        {'  '}1. El comprador inicia el trato.{'  '}
        2. Coordinan por Discord o WhatsApp.{'  '}
        3. Ambos confirman acá cuando se realiza el intercambio.{'  '}
        4. Se califican mutuamente. ⭐
      </div>

      {!tratos.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
          <p className="cinzel" style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Sin tratos aún</p>
          <p>Tus compras y ventas aparecerán acá</p>
        </div>
      ) : tratosPag.map(t => {
        const esSeller = t.seller_id === userId
        const otroUsuario = esSeller ? t.buyer : t.seller
        const rareza = t.listing?.rareza
        const rarezaColor = rareza ? RAREZA_COLOR[rareza] : 'var(--text-primary)'

        const estado = t.confirmed_by_seller && t.confirmed_by_buyer
          ? 'completado'
          : t.confirmed_by_seller || t.confirmed_by_buyer
          ? 'pendiente'
          : 'iniciado'

        const s = TX_ESTADO_STYLE[estado]

        return (
          <div key={t.id} style={{
            background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    fontFamily: "'Cinzel',serif", letterSpacing: 1, fontWeight: 700,
                    background: esSeller ? 'rgba(46,125,82,0.2)' : 'rgba(30,74,122,0.2)',
                    color: esSeller ? '#5BC98B' : '#5B9BDF',
                    border: `1px solid ${esSeller ? 'rgba(46,125,82,0.4)' : 'rgba(30,74,122,0.4)'}`,
                  }}>
                    {esSeller ? '🗡 VENDIENDO' : '🛡 COMPRANDO'}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    fontFamily: "'Cinzel',serif", letterSpacing: 1,
                    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                  }}>
                    {s.label}
                  </span>
                </div>
                <Link href={t.listing ? listingHref(t.listing.item_name, t.listing.id, t.listing.short_id) : '#'} className="cinzel" style={{
                  fontSize: 15, color: rarezaColor, textDecoration: 'none',
                }}>
                  {t.listing?.item_name || 'Ítem eliminado'}
                </Link>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gold)' }}>
                {t.listing && formatPrecio(t.listing.price_gold, t.listing.price_money, t.listing.currency_label)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {esSeller ? '👤 Comprador: ' : '👤 Vendedor: '}
                <Link href={`/perfil/${otroUsuario?.username}`} style={{ color: 'var(--gold-light)', textDecoration: 'none' }}>
                  {otroUsuario?.username || 'Usuario desconocido'}
                </Link>
                {otroUsuario?.avg_rating && (
                  <span style={{ marginLeft: 6, color: 'var(--gold)' }}>⭐ {otroUsuario.avg_rating.toFixed(1)}</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {(() => { const d = new Date(t.created_at); const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}` })()}
              </div>
            </div>

            {/* Confirmaciones */}
            {estado !== 'completado' && (
  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--dark-border)' }}>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
      {t.confirmed_by_seller ? '✅ Vendedor confirmó' : '⏳ Vendedor pendiente'}
      {' · '}
      {t.confirmed_by_buyer ? '✅ Comprador confirmó' : '⏳ Comprador pendiente'}
    </div>
    {/* Mensaje orientativo para el usuario actual */}
    {!t.confirmed_by_seller && esSeller && (
      <div style={{ fontSize: 12, color: '#C9A84C', marginBottom: 6 }}>
        👉 Coordinen el intercambio y luego confirmá vos que se realizó.
      </div>
    )}
    {t.confirmed_by_seller && !t.confirmed_by_buyer && !esSeller && (
      <div style={{ fontSize: 12, color: '#5BC98B', marginBottom: 6 }}>
        👉 El vendedor ya confirmó — confirmá vos para completar el trato.
      </div>
    )}
    {!t.confirmed_by_seller && !t.confirmed_by_buyer && !esSeller && (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontStyle: 'italic' }}>
        Esperando que el vendedor confirme el intercambio.
      </div>
    )}
    {/* Botón confirmar */}
    {((esSeller && !t.confirmed_by_seller) || (!esSeller && !t.confirmed_by_buyer)) && (
      <button onClick={async () => {
        const campo = esSeller ? 'confirmed_by_seller' : 'confirmed_by_buyer'
        await supabase.from('transactions').update({ [campo]: true }).eq('id', t.id)
        
        // Verificar si el otro también confirmó para marcar completado
        const otraConfirmacion = esSeller ? t.confirmed_by_buyer : t.confirmed_by_seller
        if (otraConfirmacion) {
          await supabase.from('transactions').update({
            completed_at: new Date().toISOString()
          }).eq('id', t.id)
          await supabase.from('listings').update({ status: 'completed' }).eq('id', t.listing?.id)
          // Registrar en historial de precios
          if (t.listing) {
            await supabase.from('price_history').insert({
              listing_id: t.listing.id,
              item_name: t.listing.item_name,
              item_category: t.listing.item_category,
              rareza: t.listing.rareza || null,
              price_gold: t.listing.price_gold || null,
              price_money: t.listing.price_money || null,
              currency_label: t.listing.currency_label || null,
              completed_at: new Date().toISOString(),
            })
          }
        }
        
        setTratos(prev => prev.map(tx => tx.id === t.id ? {
          ...tx,
          [campo]: true,
          completed_at: otraConfirmacion ? new Date().toISOString() : tx.completed_at
        } : tx))
      }} style={{
        fontSize: 12, padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
        background: 'linear-gradient(135deg, #1a5c35, #2E7D52)',
        color: 'white', border: 'none',
        fontFamily: "'Cinzel',serif", fontWeight: 700,
      }}>
        ✅ Confirmar trato
      </button>
    )}
    {/* Botón rechazar — vendedor puede rechazar mientras no confirmó */}
    {esSeller && !t.confirmed_by_seller && (
      <button onClick={async () => {
        if (!window.confirm('¿Rechazar este trato? El comprador será notificado.')) return
        await supabase.from('transactions').delete().eq('id', t.id)
        setTratos(prev => prev.filter(tx => tx.id !== t.id))
      }} style={{
        marginTop: 6, fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
        background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.5)',
        color: '#E24B4A', fontFamily: "'Cinzel',serif", fontWeight: 700,
      }}>
        ✕ Rechazar trato
      </button>
    )}
    {/* Botón cancelar — comprador puede cancelar si ninguno confirmó aún */}
    {!esSeller && !t.confirmed_by_seller && !t.confirmed_by_buyer && (
      <button onClick={async () => {
        if (!window.confirm('¿Cancelar este trato? Esta acción no se puede deshacer.')) return
        await supabase.from('transactions').delete().eq('id', t.id)
        setTratos(prev => prev.filter(tx => tx.id !== t.id))
      }} style={{
        marginTop: 6, fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
        background: 'none', border: '1px solid rgba(226,75,74,0.4)',
        color: '#E24B4A', fontFamily: 'inherit',
      }}>
        ✕ Cancelar trato
      </button>
    )}
  </div>
)}

            {estado === 'completado' && t.completed_at && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>
                  {(() => { const d = new Date(t.completed_at); const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; return `Completado el ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}` })()}
                </span>
                <Link href={`/calificar/${t.id}`} style={{
                  fontSize: 12, padding: '5px 14px', borderRadius: 6,
                  background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-dark)',
                  color: 'var(--gold)', textDecoration: 'none',
                  fontFamily: "'Cinzel',serif", letterSpacing: 0.5,
                }}>
                  ⭐ Calificar
                </Link>
              </div>
            )}

            {/* Chat integrado */}
            <ChatBox
              transactionId={t.id}
              userId={userId}
              otherUsername={otroUsuario?.username ?? 'Usuario'}
              unreadCount={unreadMap[t.id] ?? 0}
              onRead={() => setUnreadMap(prev => ({ ...prev, [t.id]: 0 }))}
            />
          </div>
        )
      })}

      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={{
            padding: '6px 14px', borderRadius: 6, cursor: pagina === 1 ? 'default' : 'pointer',
            background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
            color: pagina === 1 ? 'var(--dark-border)' : 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12,
          }}>← Anterior</button>
          <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            {pagina} / {totalPags}
          </span>
          <button onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={pagina === totalPags} style={{
            padding: '6px 14px', borderRadius: 6, cursor: pagina === totalPags ? 'default' : 'pointer',
            background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
            color: pagina === totalPags ? 'var(--dark-border)' : 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12,
          }}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}