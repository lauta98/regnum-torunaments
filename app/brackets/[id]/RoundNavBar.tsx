/** Barra de atajos por ronda — con brackets grandes (40+ equipos) el
 *  árbol mide miles de px de alto, así que un salto directo ahorra
 *  bastante scroll manual. A propósito NO es sticky: al ser sticky, la
 *  reserva de espacio en el flujo normal se calcula según su posición
 *  estática, pero una vez "pegada" arriba puede flotar sobre contenido
 *  que nunca se corrió para darle lugar — quedaba tapando el propio
 *  encabezado de ronda al que se saltaba. Como barra normal (se
 *  scrollea con el resto) el link nativo `#round-...` + scroll-margin
 *  ya alcanza sin ese riesgo. */
export default function RoundNavBar({ rounds }: { rounds: { key: string; label: string }[] }) {
  return (
    <div style={{
      marginBottom: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)',
      padding: '8px 10px', display: 'flex', gap: 6, overflowX: 'auto', whiteSpace: 'nowrap',
    }}>
      {rounds.map(r => (
        <a key={r.key} href={`#round-${r.key}`} style={{
          flexShrink: 0, padding: '5px 11px', borderRadius: 6, textDecoration: 'none',
          fontFamily: 'var(--font-display)', fontSize: 10.5, letterSpacing: 0.3, fontWeight: 600,
          color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {r.label}
        </a>
      ))}
    </div>
  )
}
