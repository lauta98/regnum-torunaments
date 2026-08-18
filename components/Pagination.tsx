'use client'

/** Controles de paginación numerados, reutilizados por las listas largas
 * del panel de administrador (usuarios, torneos). Colapsa con "…" cuando
 * hay muchas páginas — siempre muestra primera, última y actual ±1. */
export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={btnStyle(false, page === 1)}>
        ‹
      </button>
      {paginasVisibles(page, totalPages).map((n, idx) =>
        n === '…' ? (
          <span key={`e${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 12 }}>…</span>
        ) : (
          <button key={n} onClick={() => onChange(n as number)} style={btnStyle(n === page, false)}>
            {n}
          </button>
        )
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={btnStyle(false, page === totalPages)}>
        ›
      </button>
    </div>
  )
}

function btnStyle(activa: boolean, deshabilitada: boolean): React.CSSProperties {
  return {
    minWidth: 28, padding: '5px 8px', borderRadius: 6,
    border: `1px solid ${activa ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
    background: activa ? 'rgba(212,175,55,0.15)' : 'transparent',
    color: deshabilitada ? 'var(--text-muted)' : activa ? 'var(--gold)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: activa ? 700 : 400,
    cursor: deshabilitada ? 'not-allowed' : 'pointer', opacity: deshabilitada ? 0.4 : 1,
  }
}

function paginasVisibles(actual: number, total: number): (number | '…')[] {
  const paginas = new Set<number>([1, total, actual, actual - 1, actual + 1])
  const ordenadas = [...paginas].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const resultado: (number | '…')[] = []
  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) resultado.push('…')
    resultado.push(ordenadas[i])
  }
  return resultado
}
