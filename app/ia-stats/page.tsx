import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import { REINO_COLOR, FORMAT_COLOR, FORMAT_LABEL, REINOS, CLASES } from '@/lib/constants'
import type { Reino, TournamentFormat } from '@/lib/types'

export const metadata: Metadata = { title: 'IA Stats' }

export default async function IAStatsPage() {
  const supabase = await createServerSupabase()

  const [{ data: players }, { data: torneos }, { data: matches }] = await Promise.all([
    supabase.from('players').select('reino, clase_principal, mmr_global, winrate, partidas_jugadas, partidas_ganadas'),
    supabase.from('tournaments').select('formato, estado').eq('estado', 'finalizado'),
    supabase.from('matches').select('estado').eq('estado', 'jugado'),
  ])

  const total = players?.length ?? 0
  const totalPartidas = players?.reduce((s: number, p: any) => s + (p.partidas_jugadas ?? 0), 0) ?? 0
  const totalVictorias = players?.reduce((s: number, p: any) => s + (p.partidas_ganadas ?? 0), 0) ?? 0
  const avgMmr = total > 0 ? Math.round((players?.reduce((s: number, p: any) => s + p.mmr_global, 0) ?? 0) / total) : 0

  const reinoStats = REINOS.map(r => {
    const group = players?.filter((p: any) => p.reino === r) ?? []
    const avgWr = group.length > 0 ? Math.round(group.reduce((s: number, p: any) => s + p.winrate, 0) / group.length) : 0
    const avgMmrR = group.length > 0 ? Math.round(group.reduce((s: number, p: any) => s + p.mmr_global, 0) / group.length) : 0
    return { reino: r, count: group.length, avgWr, avgMmr: avgMmrR, pct: total > 0 ? Math.round(group.length / total * 100) : 0 }
  })

  const claseStats = CLASES.map(c => {
    const group = players?.filter((p: any) => p.clase_principal === c) ?? []
    const avgWr = group.length > 0 ? Math.round(group.reduce((s: number, p: any) => s + p.winrate, 0) / group.length) : 0
    const avgMmrC = group.length > 0 ? Math.round(group.reduce((s: number, p: any) => s + p.mmr_global, 0) / group.length) : 0
    return { clase: c, count: group.length, avgWr, avgMmr: avgMmrC }
  }).sort((a, b) => b.avgWr - a.avgWr)

  const maxWr = Math.max(...claseStats.map(c => c.avgWr), 1)
  const maxReinoPct = Math.max(...reinoStats.map(r => r.pct), 1)

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            IA STATS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Análisis estadístico de clases, reinos y meta del torneo.
          </p>
        </div>

        {/* Global KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'JUGADORES', value: total.toLocaleString(), sub: 'registrados', color: 'var(--gold)' },
            { label: 'PARTIDAS',  value: totalPartidas.toLocaleString(), sub: 'jugadas en total', color: '#4CAF50' },
            { label: 'MMR MEDIO', value: avgMmr.toLocaleString(), sub: 'puntos promedio', color: '#2196F3' },
            { label: 'WINRATE GLOBAL', value: totalPartidas > 0 ? `${Math.round(totalVictorias/totalPartidas*100)}%` : '—', sub: 'ratio general', color: '#8a2be2' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Kingdom dominance */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2 }}>
              DISTRIBUCIÓN POR REINO
            </div>
            <div style={{ padding: '20px' }}>
              {reinoStats.map(({ reino, count, pct, avgWr, avgMmr: am }) => (
                <div key={reino} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: REINO_COLOR[reino as Reino], fontWeight: 700 }}>{reino}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{count} jugadores · WR {avgWr}% · {am} MMR</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(pct / maxReinoPct) * 100}%`, background: REINO_COLOR[reino as Reino], borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% del total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Class winrates */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2 }}>
              WINRATE POR CLASE
            </div>
            <div style={{ padding: '20px' }}>
              {claseStats.map(({ clase, count, avgWr, avgMmr: am }, i) => {
                const CLASE_ICON: Record<string, string> = { Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺' }
                const wrColor = avgWr >= 60 ? '#4CAF50' : avgWr >= 50 ? 'var(--gold)' : '#f87171'
                return (
                  <div key={clase} style={{ marginBottom: i < claseStats.length - 1 ? 14 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 16 }}>{CLASE_ICON[clase]}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{clase}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: wrColor }}>{avgWr}%</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 60, textAlign: 'right' }}>{am} MMR</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(avgWr / maxWr) * 100}%`, background: wrColor, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* MMR Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2 }}>
            DISTRIBUCIÓN MMR
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Bronce',    range: [0, 1299],    color: '#cd7f32' },
              { label: 'Plata',     range: [1300, 1599], color: '#C0C0C0' },
              { label: 'Oro',       range: [1600, 1899], color: 'var(--gold)' },
              { label: 'Platino',   range: [1900, 2199], color: '#4CAF50' },
              { label: 'Diamante',  range: [2200, 9999], color: '#2196F3' },
            ].map(({ label, range, color }) => {
              const cnt = players?.filter((p: any) => p.mmr_global >= range[0] && p.mmr_global <= range[1]).length ?? 0
              const pct = total > 0 ? Math.round(cnt / total * 100) : 0
              return (
                <div key={label} style={{ textAlign: 'center', padding: '16px 12px', background: 'var(--bg-surface)', borderRadius: 10, border: `1px solid ${color}33` }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color, marginBottom: 4 }}>{pct}%</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cnt} jugadores</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{range[0]}–{range[1] > 9000 ? '∞' : range[1]}</div>
                </div>
              )
            })}
          </div>
        </div>

      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
