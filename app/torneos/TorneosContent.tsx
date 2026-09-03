'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Clase } from '@/lib/types'
import SubclaseDropdown from './SubclaseDropdown'
import OrdenDropdown from './OrdenDropdown'
import TorneoCard from '@/components/TorneoCard'

type Params = { formato?: string; sub?: string; estado?: string; orden?: string }

function qs(current: Params, changes: Partial<Params>) {
  const next: Record<string, string> = { ...current, ...changes } as Record<string, string>
  Object.keys(next).forEach(k => { if (!next[k]) delete next[k] })
  const s = new URLSearchParams(next).toString()
  return `/torneos${s ? `?${s}` : ''}`
}

const FMT_LABEL: Record<string, string> = {
  '1v1': '1VS1', '2v2': '2VS2', '3v3': '3VS3', '7v7': 'Clanes',
}
const FMT_COLOR: Record<string, string> = {
  '1v1': '#8a2be2', '2v2': '#d4af37', '3v3': '#2196F3', '7v7': '#F44336',
}

function Pill({ href, active, color, children }: { href: string; active: boolean; color?: string; children: React.ReactNode }) {
  const c = color ?? 'rgba(212,175,55,1)'
  return (
    <Link href={href} style={{
      padding: '7px 18px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      border: `1px solid ${active ? c : 'var(--border-input)'}`,
      background: active ? `${c}18` : 'transparent',
      color: active ? c : 'var(--text-muted)',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {children}
    </Link>
  )
}

export default function TorneosContent() {
  const searchParams = useSearchParams()
  const params: Params = {
    formato: searchParams.get('formato') ?? undefined,
    sub: searchParams.get('sub') ?? undefined,
    estado: searchParams.get('estado') ?? undefined,
    orden: searchParams.get('orden') ?? undefined,
  }

  const [tourneysDelFormato, setTourneysDelFormato] = useState<any[] | null>(null)

  useEffect(() => {
    setTourneysDelFormato(null)
    fetch(`/api/torneos?${searchParams.toString()}`)
      .then(res => res.json())
      .then(data => setTourneysDelFormato(data.tourneysDelFormato))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  if (!tourneysDelFormato) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Cargando...</div>
  }

  const subclasesDisponibles = Array.from(
    new Set(tourneysDelFormato.flatMap((t: any) => t.subclases_permitidas ?? []))
  ) as Clase[]

  const tourneys = params.sub
    ? tourneysDelFormato.filter((t: any) => (t.subclases_permitidas ?? []).includes(params.sub))
    : tourneysDelFormato

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-muted)' }}>
          {tourneys.length} torneos
        </span>
      </div>

      {/* Formato filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: params.formato === '1v1' ? 12 : 24, flexWrap: 'wrap' }}>
        <Pill href={qs(params, { formato: undefined })} active={!params.formato}>Todos</Pill>
        {(['1v1', '2v2', '3v3', '7v7'] as const).map(f => (
          <Pill key={f} href={qs(params, { formato: f })} active={params.formato === f} color={FMT_COLOR[f]}>
            {FMT_LABEL[f]}
          </Pill>
        ))}
        <div style={{ flex: 1 }} />
        <Pill
          href={qs(params, { estado: params.estado === 'finalizado' ? undefined : 'finalizado' })}
          active={params.estado === 'finalizado'}
          color="var(--text-muted)"
        >
          Solo Finalizados
        </Pill>
        <OrdenDropdown />
      </div>

      {/* Subclase: dropdown, solo si hay más de una subclase entre estos torneos */}
      {params.formato && subclasesDisponibles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SubclaseDropdown
            formato={params.formato}
            actual={params.sub}
            opciones={subclasesDisponibles}
          />
        </div>
      )}

      {/* Grid */}
      {!tourneys?.length ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No hay torneos con esos filtros.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {tourneys.map((t: any) => <TorneoCard key={t.id} torneo={t} />)}
        </div>
      )}
    </>
  )
}
