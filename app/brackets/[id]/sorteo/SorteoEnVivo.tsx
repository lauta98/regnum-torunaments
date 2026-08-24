'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Equipo { id: string; nombre: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SorteoEnVivo({
  torneoId,
  torneoNombre,
  bracketType,
  equipos,
}: {
  torneoId: string
  torneoNombre: string
  bracketType: string
  equipos: Equipo[]
}) {
  const router = useRouter()
  // El orden de sorteo se decide UNA sola vez al entrar a la pantalla —
  // de ahí en más solo se va revelando, no se vuelve a mezclar.
  const [pool, setPool] = useState<Equipo[]>(() => shuffle(equipos))
  const [revelados, setRevelados] = useState<Equipo[]>([])
  const [flash, setFlash] = useState<Equipo | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')

  const totalSlots = equipos.length
  const terminado = pool.length === 0

  const sortearSiguiente = () => {
    if (pool.length === 0) return
    const [siguiente, ...resto] = pool
    setFlash(siguiente)
    setPool(resto)
    setTimeout(() => {
      setRevelados(prev => [...prev, siguiente])
      setFlash(null)
    }, 700)
  }

  const confirmar = async () => {
    setConfirmando(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-bracket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden: revelados.map(e => e.id) }),
    })
    if (res.ok) {
      router.push(`/brackets/${torneoId}`)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al crear el cuadro')
      setConfirmando(false)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 6 }}>
          SORTEO EN VIVO
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>
          {torneoNombre}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          {revelados.length} / {totalSlots} equipos sorteados
        </p>
      </div>

      {/* Zona de reveal */}
      <div style={{
        background: 'var(--bg-card)', border: '2px solid var(--border-gold)', borderRadius: 'var(--radius-lg)',
        padding: '48px 24px', textAlign: 'center', marginBottom: 28, minHeight: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {flash ? (
          <div key={flash.id} style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--gold)',
            animation: 'sorteoReveal 0.7s ease-out',
          }}>
            {flash.nombre}
          </div>
        ) : terminado ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>
              Sorteo completo — todos los equipos ubicados
            </div>
          </div>
        ) : (
          <button onClick={sortearSiguiente} className="btn btn-primary" style={{ padding: '16px 40px', fontWeight: 900, fontSize: 16 }}>
            🎲 SORTEAR SIGUIENTE
          </button>
        )}
      </div>

      {/* Slots ya revelados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 32 }}>
        {Array.from({ length: totalSlots }).map((_, i) => {
          const e = revelados[i]
          return (
            <div key={i} style={{
              background: e ? 'rgba(212,175,55,0.08)' : 'var(--bg-surface)',
              border: `1px solid ${e ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
                POSICIÓN {i + 1}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: e ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {e ? e.nombre : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {terminado && (
        <div style={{ textAlign: 'center' }}>
          <button onClick={confirmar} disabled={confirmando} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 14 }}>
            {confirmando ? 'Creando cuadro...' : '✓ Confirmar y crear el cuadro'}
          </button>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      )}

      <style>{`
        @keyframes sorteoReveal {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  )
}
