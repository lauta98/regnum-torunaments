import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function RankingPage() {
  const supabase = await createServerSupabase()

  const { data: users } = await supabase
    .from('profiles')
    .select('username, avg_rating, total_reviews')
    .gte('total_reviews', 1)
    .order('avg_rating', { ascending: false })
    .limit(20)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
        <span className="cinzel" style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1 }}>
          🏆 MERCADERES DE HONOR
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
      </div>

      {!users?.length ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          Aún no hay usuarios con reseñas
        </p>
      ) : users.map((u, i) => (
        <div key={u.username} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 8,
        }}>
          <div className="cinzel" style={{ fontSize: i < 3 ? 22 : 16, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)', width: 32 }}>
            {i < 3 ? medals[i] : i + 1}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--burgundy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cinzel',serif", fontSize: 12, color: 'var(--gold-light)', flexShrink: 0,
          }}>
            {u.username.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <Link href={`/perfil/${u.username}`} style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }}>
              {u.username}
            </Link>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.total_reviews} reseñas</div>
          </div>
          <div className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>
            ★ {u.avg_rating?.toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  )
}