'use client'
import { useState } from 'react'
import Link from 'next/link'
import Pagination from '@/components/Pagination'
import EliminarTorneoButton from './EliminarTorneoButton'

type Torneo = {
  id: string; nombre: string; estado: string
  creator: { nickname_juego: string | null } | { nickname_juego: string | null }[] | null
  registros: { count: number }[] | null
}

const PAGE_SIZE = 6

const STATUS_COLOR: Record<string, string> = {
  draft: '#606060', inscripciones: '#2196F3', live: '#F44336', finalizado: '#4CAF50',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', inscripciones: 'Inscripciones', live: 'EN VIVO', finalizado: 'Finalizado',
}

export default function TorneosRecientes({ torneos }: { torneos: Torneo[] }) {
  const [page, setPage] = useState(1)

  const totalPaginas = Math.max(1, Math.ceil(torneos.length / PAGE_SIZE))
  const paginaActual = Math.min(page, totalPaginas)
  const paginados = torneos.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {paginados.map((t, i) => {
          const creator = Array.isArray(t.creator) ? t.creator[0] : t.creator
          const sc = STATUS_COLOR[t.estado] ?? '#606060'
          return (
            <div key={t.id} style={{
              padding: '14px 16px',
              borderBottom: i < paginados.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.nombre}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    por {creator?.nickname_juego ?? '—'} · {t.registros?.[0]?.count ?? 0} equipos
                  </div>
                </div>
                <span style={{
                  flexShrink: 0,
                  background: `color-mix(in srgb, ${sc} 12%, transparent)`, color: sc, border: `1px solid color-mix(in srgb, ${sc} 35%, transparent)`,
                  padding: '3px 8px',
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {STATUS_LABEL[t.estado] ?? t.estado}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/admin/torneos/${t.id}`} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '7px 10px', textDecoration: 'none',
                  background: 'var(--bg-surface)', border: '1px solid var(--dark-border-gold)', color: 'var(--gold)',
                }}>
                  Editar
                </Link>
                <div style={{ flex: 1 }}>
                  <EliminarTorneoButton torneoId={t.id} nombre={t.nombre} />
                </div>
              </div>
            </div>
          )
        })}
        {!torneos.length && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)', fontSize: 14 }}>
            No hay torneos creados aún.
          </div>
        )}
      </div>

      {torneos.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, torneos.length)} de {torneos.length}
          </span>
          <Pagination page={paginaActual} totalPages={totalPaginas} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
