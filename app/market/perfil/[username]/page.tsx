import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ListingCard from '@/components/market/ListingCard'
import EditarPerfil from '@/components/market/EditarPerfil'

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, banner_url, avg_rating, total_reviews')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Perfil no encontrado' }

  const title = `Perfil de ${profile.username}`
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `Mirá los ítems a la venta de ${profile.username} en Regnum Market. Rating: ${profile.avg_rating?.toFixed(1) ?? 'Sin valoraciones'} (${profile.total_reviews ?? 0} reseñas).`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(profile.banner_url ? { images: [{ url: profile.banner_url, width: 1200, height: 400, alt: `Perfil de ${profile.username}` }] } : {}),
    },
    twitter: {
      card: profile.banner_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(profile.banner_url ? { images: [profile.banner_url] } : {}),
    },
  }
}

export default async function PerfilPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createServerSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles(username, avg_rating)')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_reviewer_id_fkey(username)')
    .eq('reviewed_id', profile.id)
    .order('created_at', { ascending: false })

  const initials = username.slice(0, 2).toUpperCase()
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const d = new Date(profile.created_at)
  const since = `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  // La verificación de ownership se hace client-side en EditarPerfil
  // para evitar problemas con cookies de sesión en server components

  const nombreColor = profile.name_color && profile.is_premium ? profile.name_color : 'var(--gold)'

  return (
    <div style={{ padding: '0 0 40px', maxWidth: 900, margin: '0 auto' }}>

      {/* Banner */}
      <div style={{
        width: '100%', height: 160, overflow: 'hidden',
        background: profile.banner_url ? 'transparent' : 'linear-gradient(135deg, var(--burgundy), var(--dark-surface))',
        position: 'relative',
      }}>
        {profile.banner_url && (
          <img src={profile.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {/* Overlay oscuro en la parte inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to top, var(--dark-bg), transparent)',
        }} />
      </div>

      {/* Card del perfil */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: 12, padding: 24, marginBottom: 24, marginTop: -32, position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'var(--burgundy)',
              border: `3px solid ${profile.is_premium ? '#F59E0B' : 'var(--dark-bg)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cinzel',serif", fontSize: 26, color: 'var(--gold-light)',
              flexShrink: 0, marginTop: -36, overflow: 'hidden', position: 'relative',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
                <h1 className="cinzel" style={{ fontSize: 22, color: nombreColor }}>{profile.username}</h1>
                {profile.is_premium && (
                  <span style={{ fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 10px', borderRadius: 12, fontFamily: "'Cinzel',serif" }}>
                    🧉 Mercader Elite
                  </span>
                )}
                {profile.matecitos_count > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    🧉 ×{profile.matecitos_count}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                {profile.regnum_nick && (
                  <span style={{ fontSize: 12, color: 'var(--gold)' }}>⚔ {profile.regnum_nick}</span>
                )}
                {profile.servidor && (
                  <span style={{
                    fontSize: 11, color: 'var(--text-muted)',
                    background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                    padding: '1px 8px', borderRadius: 10,
                  }}>
                    🌐 {profile.servidor}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                Miembro desde {since}
              </p>

              {/* Bio */}
              {profile.bio && (
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 14, maxWidth: 500 }}>
                  {profile.bio}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { val: profile.avg_rating?.toFixed(1) || '—', lbl: 'Rating' },
                  { val: profile.total_reviews || 0, lbl: 'Reseñas' },
                  { val: listings?.length || 0, lbl: 'Ítems activos' },
                ].map(s => (
                  <div key={s.lbl} style={{
                    background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                    borderRadius: 8, padding: '10px 20px', textAlign: 'center',
                  }}>
                    <div className="cinzel" style={{ fontSize: 18, color: 'var(--gold)' }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              <EditarPerfil profile={profile} />
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
          <span className="cinzel" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
            RESEÑAS RECIBIDAS{reviews?.length ? ` (${reviews.length})` : ''}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
        </div>

        {!reviews?.length ? (
          <div style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 24, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
            <p style={{ fontStyle: 'italic', fontSize: 14 }}>Sin reseñas aún</p>
            <p style={{ fontSize: 12, color: 'var(--dark-border)', marginTop: 4 }}>Las reseñas aparecen luego de completar tratos</p>
          </div>
        ) : (
          <>
            {/* Resumen de rating */}
            {profile.avg_rating && (
              <div style={{
                background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
                display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                    {profile.avg_rating.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 18, color: '#F5C518', marginTop: 4 }}>
                    {(() => {
                      const r = Math.round(profile.avg_rating)
                      return '★'.repeat(r) + '☆'.repeat(5 - r)
                    })()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {profile.total_reviews} reseña{profile.total_reviews !== 1 ? 's' : ''}
                  </div>
                </div>
                {/* Barras de distribución */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews!.filter(r => r.score === star).length
                    const pct = reviews!.length ? Math.round((count / reviews!.length) * 100) : 0
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{star}</span>
                        <span style={{ fontSize: 11, color: '#F5C518', flexShrink: 0 }}>★</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--dark-surface)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              {reviews.map(r => {
                const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
                const d = new Date(r.created_at)
                const fecha = `${d.getUTCDate()} ${MESES_CORTOS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
                const s = Math.min(r.score, 5)
                const scoreColor = ['','#E24B4A','#E2744A','#C9A84C','#7DC4FF','#5BC98B'][s]
                return (
                  <div key={r.id} style={{
                    background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                    borderRadius: 8, padding: '12px 14px', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: r.comment ? 8 : 0 }}>
                      <div>
                        <span className="cinzel" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{r.reviewer?.username}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{fecha}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 14, color: '#F5C518', letterSpacing: -1 }}>
                          {'★'.repeat(s)}{'☆'.repeat(5 - s)}
                        </span>
                        <span style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>{r.score}/5</span>
                      </div>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Publicaciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
          <span className="cinzel" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>PUBLICACIONES ACTIVAS</span>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
        </div>

        {!listings?.length ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            Sin publicaciones activas
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, alignItems: 'stretch' }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  )
}
