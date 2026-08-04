'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/lib/market/i18n'

const CAT_VALS = [
  { val: 'armas', icon: '⚔', key: 'cat.armas' },
  { val: 'armaduras', icon: '🛡', key: 'cat.armaduras' },
  { val: 'proyectiles', icon: '🏹', key: 'cat.proyectiles' },
  { val: 'crafting', icon: '🔨', key: 'cat.crafting' },
  { val: 'gemas_magicas', icon: '💎', key: 'cat.gemas_magicas' },
  { val: 'joyeria', icon: '💍', key: 'cat.joyeria' },
  { val: 'minerales', icon: '⛏', key: 'cat.minerales' },
]
const RAREZA_VALS = [
  { val: '', key: 'watchlist.any' },
  { val: 'especial', key: 'rareza.especial' },
  { val: 'magico', key: 'rareza.magico' },
  { val: 'epico', key: 'rareza.epico' },
  { val: 'legendario', key: 'rareza.legendario' },
]
const RAREZA_COLOR: Record<string, string> = { especial: '#FB923C', magico: '#22C55E', epico: '#8B5CF6', legendario: '#EF4444' }
const CAT_EMOJI: Record<string, string> = { armas: '⚔', armaduras: '🛡', proyectiles: '🏹', crafting: '🔨', gemas_magicas: '💎', joyeria: '💍', minerales: '⛏' }

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const pill = (active: boolean, color?: string): React.CSSProperties => ({
  padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  border: `1px solid ${active ? (color || 'var(--gold)') : 'var(--dark-border)'}`,
  background: active ? `${color || 'var(--gold)'}22` : 'var(--dark-surface)',
  color: active ? (color || 'var(--gold)') : 'var(--text-muted)',
})

export default function WatchlistPage() {
  const [alerts, setAlerts]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [cat, setCat]           = useState('')
  const [rareza, setRareza]     = useState('')
  const [tipo, setTipo]         = useState('any')
  const [keyword, setKeyword]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const { t } = useLanguage()
  const CATS = CAT_VALS.map(c => ({ val: c.val, label: `${c.icon} ${t(c.key)}` }))
  const RAREZAS = RAREZA_VALS.map(r => ({ val: r.val, label: t(r.key) }))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      fetch('/api/market/watchlist').then(r => r.json()).then(d => { setAlerts(Array.isArray(d) ? d : []); setLoading(false) })
    })
  }, [])

  const addAlert = async () => {
    if (!cat) return
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/market/watchlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: cat, rareza: rareza || null, tipo, keyword: keyword.trim() || null }),
      })
      const data = await res.json()
      if (data.id) {
        setAlerts(prev => [data, ...prev]); setCat(''); setRareza(''); setTipo('any'); setKeyword('')
      } else {
        setSaveError(data.error || t('watchlist.error'))
      }
    } catch {
      setSaveError('Error de conexión')
    }
    setSaving(false)
  }

  const deleteAlert = async (id: string) => {
    await fetch('/api/market/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delete_id: id }) })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div style={{ padding: '24px 20px 48px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/market" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>{t('watchlist.back')}</Link>
        <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>{t('watchlist.title')}</h1>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontStyle: 'italic' }}>
        {t('watchlist.subtitle')}
      </p>

      {/* Formulario nueva alerta */}
      <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>{t('watchlist.new')}</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t('watchlist.category')}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => <button key={c.val} onClick={() => setCat(c.val)} style={pill(cat === c.val)}>{c.label}</button>)}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t('watchlist.rarity')}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RAREZAS.map(r => <button key={r.val} onClick={() => setRareza(r.val)} style={pill(rareza === r.val, RAREZA_COLOR[r.val])}>{r.label}</button>)}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t('watchlist.type')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ val: 'any', label: t('watchlist.any') }, { val: 'sell', label: t('watchlist.sells_type') }, { val: 'buy', label: t('watchlist.buys_type') }].map(tp => (
              <button key={tp.val} onClick={() => setTipo(tp.val)} style={pill(tipo === tp.val)}>{tp.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t('watchlist.keyword')}</div>
          <input style={inp} placeholder={t('watchlist.keyword_placeholder')} value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addAlert() }} />
        </div>

        <button onClick={addAlert} disabled={!cat || saving} style={{
          width: '100%', padding: '11px 0', borderRadius: 8, cursor: cat ? 'pointer' : 'default',
          background: cat ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))' : 'var(--dark-surface)',
          color: cat ? 'var(--dark-bg)' : 'var(--text-muted)', border: 'none',
          fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: 1,
        }}>
          {saving ? t('watchlist.saving') : t('watchlist.create')}
        </button>

        {saveError && (
          <div style={{ marginTop: 10, background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.4)', borderRadius: 8, padding: '8px 12px' }}>
            <p style={{ color: '#E24B4A', fontSize: 12, margin: 0 }}>⚠ {saveError}</p>
          </div>
        )}
      </div>

      {/* Alertas existentes */}
      {loading ? (
        <div style={{ height: 80, background: 'var(--dark-card)', borderRadius: 10 }} />
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {t('watchlist.empty')}
        </div>
      ) : alerts.map(a => (
        <div key={a.id} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--gold)' }}>
              {CAT_EMOJI[a.categoria] || ''} {a.categoria}
            </span>
            {a.rareza && <span style={{ marginLeft: 8, fontSize: 11, color: RAREZA_COLOR[a.rareza] || 'var(--text-muted)' }}>{a.rareza}</span>}
            {a.keyword && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>· "{a.keyword}"</span>}
            {a.tipo !== 'any' && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>· {a.tipo === 'sell' ? t('watchlist.sells_type') : t('watchlist.buys_type')}</span>}
          </div>
          <button onClick={() => deleteAlert(a.id)} style={{ background: 'none', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', flexShrink: 0 }}>
            {t('watchlist.delete')}
          </button>
        </div>
      ))}
    </div>
  )
}
