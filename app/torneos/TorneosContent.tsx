'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Clase } from '@/lib/types'
import { FORMAT_COLOR, FORMAT_LABEL } from '@/lib/constants'
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

function FormatPill({ href, active, label, color }: { href: string; active: boolean; label: string; color?: string }) {
  return (
    <Link href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', textDecoration: 'none',
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
      background: active && color ? `color-mix(in srgb, ${color} 12%, transparent)` : 'var(--bg-surface)',
      color: active ? (color ?? 'var(--text-primary)') : 'var(--text-muted)',
    }}>
      {active && color && <span style={{ width: 6, height: 6, background: color, flexShrink: 0 }} />}
      {label}
    </Link>
  )
}

const IconEmptySwords = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3v18m9-9H3" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m6.75 7.5 10.5 10.5m0-10.5L6.75 18" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" opacity="0.4" strokeWidth="1.2" />
  </svg>
)

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
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>Cargando...</div>
  }

  const subclasesDisponibles = Array.from(
    new Set(tourneysDelFormato.flatMap((t: any) => t.subclases_permitidas ?? []))
  ) as Clase[]

  const tourneys = params.sub
    ? tourneysDelFormato.filter((t: any) => (t.subclases_permitidas ?? []).includes(params.sub))
    : tourneysDelFormato

  return (
    <>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ width: 7, height: 7, background: 'var(--gold)', flexShrink: 0 }} />
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Torneos</h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{tourneys.length} torneos</span>
        </div>
        {/* Único botón dorado de la pantalla */}
        <Link href="/organizador/nuevo" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
          background: 'var(--gold)', color: '#050505', padding: '9px 16px',
          fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Crear Torneo
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 14, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <FormatPill href={qs(params, { formato: undefined })} active={!params.formato} label="Todos" />
            {(['1v1', '2v2', '3v3', '7v7'] as const).map(f => (
              <FormatPill key={f} href={qs(params, { formato: f })} active={params.formato === f} color={FORMAT_COLOR[f]} label={f === '7v7' ? 'Clanes (7v7)' : FORMAT_LABEL[f]} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href={qs(params, { estado: params.estado === 'finalizado' ? undefined : 'finalizado' })} style={{
              display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: params.estado === 'finalizado' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              <span style={{ width: 16, height: 16, border: '1px solid var(--border-highlight, #3E3E3E)', background: params.estado === 'finalizado' ? 'var(--text-secondary)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--bg-base)' }}>
                {params.estado === 'finalizado' ? '✓' : ''}
              </span>
              Solo Finalizados
            </Link>
            <OrdenDropdown />
          </div>
        </div>

        {/* Subclase: solo si hay más de una subclase entre estos torneos */}
        {params.formato && subclasesDisponibles.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <SubclaseDropdown formato={params.formato} actual={params.sub} opciones={subclasesDisponibles} />
          </>
        )}
      </div>

      {/* Grid */}
      {!tourneys?.length ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}><IconEmptySwords /></div>
          <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>No hay torneos con esos filtros.</p>
          <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 13, color: 'var(--text-muted)' }}>Probá cambiando el formato o quitando la restricción de subclase.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {tourneys.map((t: any) => <TorneoCard key={t.id} torneo={t} />)}
        </div>
      )}
    </>
  )
}
