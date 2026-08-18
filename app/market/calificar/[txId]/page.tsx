'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
const COLORS = ['', '#E24B4A', '#E2744A', '#C9A84C', '#7DC4FF', '#5BC98B']

export default function CalificarPage() {
  const [tx, setTx] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [yaCalifique, setYaCalifique] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const txId = params.txId as string
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          listings(item_name),
          seller:profiles!transactions_seller_id_fkey(id, username, avg_rating, total_reviews),
          buyer:profiles!transactions_buyer_id_fkey(id, username, avg_rating, total_reviews)
        `)
        .eq('id', txId)
        .single()

      if (!data || !(data.confirmed_by_seller && data.confirmed_by_buyer)) {
        router.push('/market/transacciones'); return
      }
      setTx(data)

      // Verificar si ya calificó esta transacción
      const { data: existing } = await supabase
        .from('reviews')
        .select('id, score, comment, created_at')
        .eq('transaction_id', txId)
        .eq('reviewer_id', user.id)
        .maybeSingle()

      if (existing) {
        setYaCalifique(true)
        setExistingReview(existing)
        setScore(existing.score)
        setComment(existing.comment || '')
      }
    }
    load()
  }, [txId])

  const submit = async () => {
    if (!score) { setError('Seleccioná un puntaje'); return }
    setLoading(true)
    setError('')

    const reviewedId = tx.seller_id === userId ? tx.buyer_id : tx.seller_id

    const { error: reviewError } = await supabase.from('reviews').insert({
      transaction_id: txId,
      reviewer_id: userId,
      reviewed_id: reviewedId,
      score,
      comment: comment.trim() || null,
    })

    if (reviewError) {
      if (reviewError.code === '23505') {
        setError('Ya calificaste esta transacción')
      } else {
        setError(reviewError.message)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    // Notificar al calificado (fire and forget)
    fetch('/api/market/notificaciones/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed_id: reviewedId, score, item_name: tx.listings?.item_name }),
    }).catch(() => {})
  }

  if (!tx) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--gold)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const otherUser = tx.seller_id === userId ? tx.buyer : tx.seller

  // Estado: ya calificaste antes
  if (yaCalifique && !done) {
    return (
      <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: 12, padding: 28, width: '100%', maxWidth: 440, textAlign: 'center',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⭐</div>
          <h2 className="cinzel" style={{ fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>Ya calificaste</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Calificaste a <strong style={{ color: 'var(--text-primary)' }}>{otherUser?.username}</strong> con
          </p>
          {/* Mostrar la review existente */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12,
          }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ fontSize: 28, color: n <= existingReview?.score ? '#F5C518' : '#333' }}>★</span>
            ))}
          </div>
          <p style={{ fontSize: 15, color: COLORS[existingReview?.score] || 'var(--gold)', fontWeight: 600, marginBottom: 16 }}>
            {LABELS[existingReview?.score]} ({existingReview?.score}/5)
          </p>
          {existingReview?.comment && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 20 }}>
              "{existingReview.comment}"
            </p>
          )}
          <Link href="/market/transacciones" style={{
            display: 'inline-block',
            background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
            color: 'var(--text-muted)', padding: '8px 20px', borderRadius: 8,
            textDecoration: 'none', fontSize: 13,
          }}>
            ← Volver a Mis Tratos
          </Link>
        </div>
      </div>
    )
  }

  // Estado: calificación enviada en este momento
  if (done) {
    return (
      <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'var(--dark-card)', border: '1px solid rgba(91,201,139,0.4)',
          borderRadius: 12, padding: 36, width: '100%', maxWidth: 440, textAlign: 'center',
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 className="cinzel" style={{ fontSize: 20, color: '#5BC98B', marginBottom: 8 }}>¡Calificación enviada!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
            Calificaste a <strong style={{ color: 'var(--text-primary)' }}>{otherUser?.username}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Tu calificación ayuda a construir una comunidad confiable. 🛡
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/market/transacciones" style={{
              background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
              color: 'var(--text-muted)', padding: '8px 20px', borderRadius: 8,
              textDecoration: 'none', fontSize: 13,
            }}>
              ← Mis Tratos
            </Link>
            <Link href={`/market/perfil/${otherUser?.username}`} style={{
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
              color: 'var(--dark-bg)', padding: '8px 20px', borderRadius: 8,
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
              fontFamily: "'Cinzel',serif",
            }}>
              Ver perfil de {otherUser?.username}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de calificación
  return (
    <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
        borderRadius: 12, padding: 28, width: '100%', maxWidth: 440,
      }}>
        <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)', marginBottom: 6 }}>⭐ Calificar</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.5 }}>
          ¿Cómo fue tu experiencia con{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{otherUser?.username}</strong>{' '}
          por <em>{tx.listings?.item_name}</em>?
        </p>

        {/* Perfil del otro usuario */}
        {otherUser && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            padding: '10px 14px', background: 'var(--dark-surface)',
            border: '1px solid var(--dark-border)', borderRadius: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--burgundy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--gold-light)', flexShrink: 0,
            }}>
              {otherUser.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{otherUser.username}</p>
              {otherUser.avg_rating ? (
                <p style={{ fontSize: 12, color: 'var(--gold)' }}>
                  ⭐ {otherUser.avg_rating.toFixed(1)} · {otherUser.total_reviews} reseña{otherUser.total_reviews !== 1 ? 's' : ''}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin calificaciones aún</p>
              )}
            </div>
          </div>
        )}

        {/* Stars */}
        <div style={{ marginBottom: 20 }}>
          <div className="cinzel" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
            PUNTAJE
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setScore(n)} style={{
                width: 52, height: 52, borderRadius: 8, cursor: 'pointer',
                fontSize: 26, transition: 'all 0.15s',
                border: `1px solid ${score >= n ? 'var(--gold)' : 'var(--dark-border)'}`,
                background: score >= n ? 'rgba(201,168,76,0.15)' : 'var(--dark-surface)',
                color: score >= n ? '#F5C518' : '#444',
                transform: score >= n ? 'scale(1.08)' : 'scale(1)',
                boxShadow: score >= n ? '0 0 8px rgba(245,197,24,0.3)' : 'none',
              }}>★</button>
            ))}
          </div>
          {score > 0 && (
            <div style={{ fontSize: 14, color: COLORS[score], fontWeight: 600 }}>
              {LABELS[score]} ({score}/5)
            </div>
          )}
        </div>

        {/* Comentario */}
        <div style={{ marginBottom: 20 }}>
          <div className="cinzel" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>
            COMENTARIO (OPCIONAL)
          </div>
          <textarea
            style={{
              width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
              borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80,
              boxSizing: 'border-box',
            }}
            placeholder="Compartí tu experiencia con la comunidad..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={300}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
            {comment.length}/300
          </div>
        </div>

        {error && <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/market/transacciones" style={{
            flex: 1, textAlign: 'center', background: 'none',
            border: '1px solid var(--dark-border)', color: 'var(--text-muted)',
            padding: '10px', borderRadius: 8, textDecoration: 'none', fontSize: 13,
          }}>
            Cancelar
          </Link>
          <button onClick={submit} disabled={loading || !score} style={{
            flex: 2, background: score ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))' : 'var(--dark-surface)',
            color: score ? 'var(--dark-bg)' : 'var(--dark-border)',
            border: 'none', padding: '10px', borderRadius: 8,
            fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 1,
            cursor: score && !loading ? 'pointer' : 'default', fontWeight: 700,
            transition: 'all 0.2s',
          }}>
            {loading ? 'Enviando...' : '✦ ENVIAR CALIFICACIÓN'}
          </button>
        </div>
      </div>
    </div>
  )
}
