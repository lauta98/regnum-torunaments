'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import PublicacionesTab from './PublicacionesTab'

const STATUS_COLOR: Record<string, { color: string; label: string }> = {
  pending:  { color: '#F59E0B', label: '⏳ Pendiente' },
  approved: { color: '#5BC98B', label: '✓ Aprobado' },
  rejected: { color: '#E24B4A', label: '✗ Rechazado' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

export default function AdminPage() {
  const [requests, setRequests]           = useState<any[]>([])
  const [premiumRequests, setPremiumRequests] = useState<any[]>([])
  const [reports, setReports]             = useState<any[]>([])
  const [tab, setTab]                     = useState<'destacados' | 'premium' | 'reportes' | 'publicaciones'>('reportes')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [processing, setProcessing]       = useState<string | null>(null)
  const [filter, setFilter]               = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [featRes, premRes, repRes] = await Promise.all([
        fetch('/api/market/admin/featured'),
        fetch('/api/market/admin/premium'),
        fetch('/api/market/admin/reports'),
      ])
      if (featRes.status === 403) { router.push('/market'); return }
      const featJson = await featRes.json()
      const premJson = await premRes.json()
      const repJson  = await repRes.json()
      if (featJson.error) { setError(featJson.error); setLoading(false); return }
      setRequests(featJson.requests || [])
      setPremiumRequests(premJson.requests || [])
      setReports(repJson.reports || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAction = async (request_id: string, action: 'approve' | 'reject', type: 'featured' | 'premium' = 'featured') => {
    setProcessing(request_id)
    const endpoint = type === 'premium' ? '/api/market/admin/premium' : '/api/market/admin/featured'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id, action }),
    })
    const json = await res.json()
    if (json.ok) {
      const updater = (prev: any[]) => prev.map(r =>
        r.id === request_id
          ? { ...r, status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }
          : r
      )
      if (type === 'premium') setPremiumRequests(updater)
      else setRequests(updater)
    } else {
      alert(json.error || 'Error al procesar')
    }
    setProcessing(null)
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const premiumPending = premiumRequests.filter(r => r.status === 'pending').length
  const premiumFiltered = premiumRequests.filter(r => filter === 'all' || r.status === filter)
  const pendingReports = reports.filter(r => !r.resolved)
  const resolvedReports = reports.filter(r => r.resolved)

  const handleReport = async (action: 'delete_listing' | 'dismiss', listing_id: string, report_id: string) => {
    setProcessing(report_id)
    const res = await fetch('/api/market/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, listing_id, report_id }),
    })
    const json = await res.json()
    if (json.ok) {
      setReports(prev => prev.map(r =>
        (action === 'delete_listing' ? r.listing_id === listing_id : r.id === report_id)
          ? { ...r, resolved: true }
          : r
      ))
    } else {
      alert(json.error || 'Error')
    }
    setProcessing(null)
  }

  if (loading) return (
    <div style={{ padding: '40px 20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ height: 300, background: 'var(--dark-card)', borderRadius: 12 }} />
    </div>
  )

  return (
    <div style={{ padding: '24px 20px 48px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/market" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Volver</Link>
        <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>⚙ Panel de Admin</h1>
        {(pendingCount + premiumPending) > 0 && (
          <span style={{ background: '#F59E0B', color: '#000', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
            {pendingCount + premiumPending}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'reportes',   label: `🚨 Reportes${pendingReports.length > 0 ? ` (${pendingReports.length})` : ''}` },
          { key: 'destacados', label: `★ Destacados${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'premium',    label: `🧉 Premium${premiumPending > 0 ? ` (${premiumPending})` : ''}` },
          { key: 'publicaciones', label: '📦 Publicaciones' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            fontSize: 13, padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Cinzel',serif", border: '1px solid',
            borderColor: tab === t.key ? (t.key === 'reportes' ? '#E24B4A' : 'var(--gold)') : 'var(--dark-border)',
            background: tab === t.key ? (t.key === 'reportes' ? 'rgba(226,75,74,0.1)' : 'rgba(201,168,76,0.1)') : 'none',
            color: tab === t.key ? (t.key === 'reportes' ? '#E24B4A' : 'var(--gold)') : 'var(--text-muted)',
          }}>{t.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8, padding: 14, color: '#E24B4A', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      {tab !== 'publicaciones' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              fontFamily: "'Cinzel',serif", border: '1px solid',
              borderColor: filter === f ? 'var(--gold)' : 'var(--dark-border)',
              background: filter === f ? 'rgba(201,168,76,0.1)' : 'none',
              color: filter === f ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              {f === 'all' ? 'Todas' : f === 'pending' ? `Pendientes` : f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB: PUBLICACIONES ── */}
      {tab === 'publicaciones' && <PublicacionesTab />}

      {/* ── TAB: REPORTES ── */}
      {tab === 'reportes' && (
        <>
          {pendingReports.length === 0 && resolvedReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No hay reportes
            </div>
          ) : (
            <>
              {pendingReports.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#E24B4A', fontFamily: "'Cinzel',serif", letterSpacing: 1, marginBottom: 12 }}>
                    PENDIENTES ({pendingReports.length})
                  </div>
                  {pendingReports.map(r => (
                    <div key={r.id} style={{
                      background: 'var(--dark-card)', border: '1px solid rgba(226,75,74,0.35)',
                      borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="cinzel" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                              {r.listing?.item_name || 'Ítem desconocido'}
                            </span>
                            {r.listing_id && !r.resolved && (
                              <Link href={`/market/listing/${r.listing_id}`} target="_blank"
                                style={{ fontSize: 11, color: 'var(--gold)', border: '1px solid var(--gold-dark)', borderRadius: 6, padding: '2px 8px', textDecoration: 'none', whiteSpace: 'nowrap', background: 'rgba(201,168,76,0.08)' }}>
                                Ver publicación ↗
                              </Link>
                            )}
                            {r.resolved && (
                              <span style={{ fontSize: 11, color: '#E24B4A', background: 'rgba(226,75,74,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                Eliminada
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            Publicado por <strong style={{ color: 'var(--text-primary)' }}>{r.listing?.seller?.username || '—'}</strong>
                            {' · '}Reportado por <strong style={{ color: 'var(--text-primary)' }}>{r.reporter?.username || '—'}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(r.created_at)}</div>
                      </div>
                      <div style={{ background: 'var(--dark-surface)', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: r.details ? 4 : 0 }}>
                          ⚠ {r.reason}
                        </div>
                        {r.details && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{r.details}"</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!r.resolved && r.listing_id && (
                          <button
                            onClick={() => handleReport('delete_listing', r.listing_id, r.id)}
                            disabled={processing === r.id}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                              background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.4)',
                              color: '#E24B4A', fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
                              opacity: processing === r.id ? 0.6 : 1,
                            }}
                          >
                            {processing === r.id ? '...' : '🗑 Eliminar publicación'}
                          </button>
                        )}
                        {!r.resolved && (
                          <button
                            onClick={() => handleReport('dismiss', r.listing_id, r.id)}
                            disabled={processing === r.id}
                            style={{
                              padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                              background: 'none', border: '1px solid var(--dark-border)',
                              color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12,
                              opacity: processing === r.id ? 0.6 : 1,
                            }}
                          >
                            Descartar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {resolvedReports.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Cinzel',serif", letterSpacing: 1, marginBottom: 10 }}>
                    RESUELTOS ({resolvedReports.length})
                  </div>
                  {resolvedReports.map(r => (
                    <div key={r.id} style={{
                      background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, opacity: 0.6,
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.listing?.item_name || '—'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>· {r.reason}</span>
                      </div>
                      <span style={{ fontSize: 11, color: r.listing?.status === 'removed' ? '#E24B4A' : '#5BC98B' }}>
                        {r.listing?.status === 'removed' ? 'Eliminada' : 'Descartado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: DESTACADOS ── */}
      {tab === 'destacados' && (
        !filtered.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No hay solicitudes de destacado {filter !== 'all' ? `con estado "${filter}"` : ''}
          </div>
        ) : filtered.map(r => {
          const st = STATUS_COLOR[r.status] || STATUS_COLOR.pending
          return (
            <div key={r.id} style={{
              background: 'var(--dark-card)',
              border: `1px solid ${r.status === 'pending' ? 'rgba(245,158,11,0.35)' : 'var(--dark-border)'}`,
              borderRadius: 10, padding: 18, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div>
                  <Link href={`/market/listing/${r.listing?.id}`} target="_blank" className="cinzel"
                    style={{ fontSize: 15, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {r.listing?.item_name || 'Ítem desconocido'}
                  </Link>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    por <strong style={{ color: 'var(--text-primary)' }}>{r.seller?.username}</strong>
                    {r.seller?.discord && <span style={{ marginLeft: 8 }}>💬 {r.seller.discord}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: st.color }}>{st.label}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(r.created_at)}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, background: 'var(--dark-surface)', borderRadius: 6, padding: '8px 12px' }}>
                📋 Verificar pago en{' '}
                <a href="https://cafecito.app/lautarey" target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B', textDecoration: 'none' }}>
                  cafecito.app/lautarey ↗
                </a>
                {' '}— buscá un pago de{' '}
                <strong style={{ color: 'var(--text-primary)' }}>$500 ARS</strong>
                {' '}de <strong style={{ color: 'var(--text-primary)' }}>{r.seller?.username}</strong>
                {' '}({timeAgo(r.created_at)})
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleAction(r.id, 'approve', 'featured')} disabled={processing === r.id} style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                    background: 'rgba(91,201,139,0.15)', border: '1px solid rgba(91,201,139,0.4)',
                    color: '#5BC98B', fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
                    opacity: processing === r.id ? 0.6 : 1,
                  }}>
                    {processing === r.id ? '...' : '✓ Aprobar · 7 días'}
                  </button>
                  <button onClick={() => handleAction(r.id, 'reject', 'featured')} disabled={processing === r.id} style={{
                    padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(226,75,74,0.3)',
                    color: '#E24B4A', fontFamily: 'inherit', fontSize: 12,
                    opacity: processing === r.id ? 0.6 : 1,
                  }}>✗ Rechazar</button>
                </div>
              )}
              {r.status !== 'pending' && r.reviewed_at && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Procesado {timeAgo(r.reviewed_at)}</div>
              )}
            </div>
          )
        })
      )}

      {/* ── TAB: PREMIUM ── */}
      {tab === 'premium' && (
        !premiumFiltered.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No hay solicitudes de premium {filter !== 'all' ? `con estado "${filter}"` : ''}
          </div>
        ) : premiumFiltered.map(r => {
          const st = STATUS_COLOR[r.status] || STATUS_COLOR.pending
          return (
            <div key={r.id} style={{
              background: 'var(--dark-card)',
              border: `1px solid ${r.status === 'pending' ? 'rgba(245,158,11,0.5)' : 'var(--dark-border)'}`,
              borderRadius: 10, padding: 18, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div>
                  <span className="cinzel" style={{ fontSize: 15, color: '#F59E0B' }}>🧉 Mercader Elite</span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    por <strong style={{ color: 'var(--text-primary)' }}>{r.seller?.username}</strong>
                    {r.seller?.discord && <span style={{ marginLeft: 8 }}>💬 {r.seller.discord}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: st.color }}>{st.label}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(r.created_at)}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, background: 'var(--dark-surface)', borderRadius: 6, padding: '8px 12px' }}>
                📋 Verificar pago en{' '}
                <a href="https://cafecito.app/lautarey" target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B', textDecoration: 'none' }}>
                  cafecito.app/lautarey ↗
                </a>
                {' '}— buscá un pago de{' '}
                <strong style={{ color: 'var(--text-primary)' }}>$3.000 ARS</strong>
                {' '}de <strong style={{ color: 'var(--text-primary)' }}>{r.seller?.username}</strong>
                {' '}({timeAgo(r.created_at)})
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleAction(r.id, 'approve', 'premium')} disabled={processing === r.id} style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)',
                    color: '#F59E0B', fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
                    opacity: processing === r.id ? 0.6 : 1,
                  }}>
                    {processing === r.id ? '...' : '🧉 Activar Premium · 30 días'}
                  </button>
                  <button onClick={() => handleAction(r.id, 'reject', 'premium')} disabled={processing === r.id} style={{
                    padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(226,75,74,0.3)',
                    color: '#E24B4A', fontFamily: 'inherit', fontSize: 12,
                    opacity: processing === r.id ? 0.6 : 1,
                  }}>✗ Rechazar</button>
                </div>
              )}
              {r.status !== 'pending' && r.reviewed_at && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Procesado {timeAgo(r.reviewed_at)}</div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
