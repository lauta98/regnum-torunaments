import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  MMR_INITIAL, MMR_TIERS, ELO_K_DEFAULT, ELO_K_VETERAN, ELO_VETERAN_THRESHOLD,
  calcularEsperado, calcularNuevoMMR,
} from '@/lib/constants'

export const metadata: Metadata = { title: 'Cómo funciona el MMR' }

// Ejemplos calculados en vivo con la MISMA función que usa el sitio para
// cargar resultados reales -- si la fórmula cambia algún día, esta
// página se actualiza sola en vez de quedar con números viejos.
function ejemplo(mmrFavorito: number, mmrRival: number, ganaFavorito: boolean) {
  const esperado = calcularEsperado(mmrFavorito, mmrRival)
  const nuevo = calcularNuevoMMR(mmrFavorito, ganaFavorito, esperado, ELO_K_DEFAULT)
  return { esperado: Math.round(esperado * 100), delta: nuevo - mmrFavorito }
}

export default function MMRPage() {
  const favoritoGana = ejemplo(1300, 1200, true)
  const favoritoPierde = ejemplo(1300, 1200, false)
  const tiersDesc = [...MMR_TIERS] // ya vienen de mayor a menor en MMR_TIERS

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 16,
    padding: '26px 28px', marginBottom: 20,
  }
  const hStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--gold)',
    letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
  }
  const pStyle: React.CSSProperties = { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }
  const formulaBox: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10,
    padding: '14px 18px', fontFamily: 'var(--font-mono, monospace)', fontSize: 13,
    color: 'var(--text-primary)', margin: '12px 0', overflowX: 'auto',
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 64px' }}>

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8, filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.35))' }}>📊</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
            Cómo funciona el MMR
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            La fórmula exacta que usamos para calcular el ranking de cada personaje. Sin caja negra: acá está el cálculo completo, con ejemplos reales.
          </p>
          <div style={{ width: 64, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '20px auto 0' }} />
        </div>

        <section style={sectionStyle}>
          <div style={hStyle}>🎯 El punto de partida</div>
          <p style={pStyle}>
            Todo personaje nuevo arranca en <b style={{ color: 'var(--text-primary)' }}>{MMR_INITIAL} MMR</b>. No hay forma de empezar más arriba: el número solo se construye jugando torneos reales.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>⚖️ La fórmula: ELO</div>
          <p style={pStyle}>
            Usamos el mismo sistema de ajedrez profesional (ELO). Antes de cada partida, la fórmula calcula qué tan probable era que ganaras según la diferencia de MMR con tu rival:
          </p>
          <div style={formulaBox}>
            esperado = 1 / (1 + 10 <sup>(MMR rival − MMR propio) / 400</sup>)
          </div>
          <p style={pStyle}>
            Ese número va de 0 a 1 — 0.5 significa "50/50", más cerca de 1 significa que se esperaba que ganaras cómodo. Después del resultado, tu MMR se ajusta según qué tan sorpresivo fue:
          </p>
          <div style={formulaBox}>
            MMR nuevo = MMR actual + K × (resultado real − esperado)
          </div>
          <p style={pStyle}>
            <b style={{ color: 'var(--text-primary)' }}>resultado real</b> es 1 si ganaste, 0 si perdiste (y 0.5 en un empate — más abajo). <b style={{ color: 'var(--text-primary)' }}>K</b> es cuántos puntos hay en juego por partida — ver la sección de abajo.
          </p>
          <p style={pStyle}>
            Esto es lo que hace que <b style={{ color: 'var(--text-primary)' }}>ganarle a alguien mejor rankeado valga más</b> que ganarle a alguien peor: cuanto menos se esperaba tu victoria, más se mueve el número.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>🔢 En números</div>
          <p style={pStyle}>Dos personajes, 1300 MMR contra 1200 MMR (K={ELO_K_DEFAULT}):</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#4CAF50', letterSpacing: 0.5, marginBottom: 6 }}>GANA EL FAVORITO (1300)</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Se esperaba con {favoritoGana.esperado}% de probabilidad — gana "lo justo":
                <br /><b style={{ color: '#4CAF50' }}>+{favoritoGana.delta} MMR</b>
              </div>
            </div>
            <div style={{ background: 'rgba(244,67,54,0.06)', border: '1px solid rgba(244,67,54,0.25)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#f87171', letterSpacing: 0.5, marginBottom: 6 }}>GANA EL RIVAL (1200)</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Upset — el favorito solo tenía {favoritoGana.esperado}% de perder:
                <br /><b style={{ color: '#f87171' }}>{favoritoPierde.delta} MMR</b> para el favorito
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>📉 Con más partidas, se estabiliza</div>
          <p style={pStyle}>
            Los primeros <b style={{ color: 'var(--text-primary)' }}>{ELO_VETERAN_THRESHOLD} partidas</b> de un personaje mueven hasta <b style={{ color: 'var(--text-primary)' }}>{ELO_K_DEFAULT} puntos</b> por resultado (K={ELO_K_DEFAULT}) — así el número encuentra rápido su nivel real. Después de eso, K baja a <b style={{ color: 'var(--text-primary)' }}>{ELO_K_VETERAN}</b>: los cambios se achican para que un veterano con historial no salte de posición por un solo resultado suelto.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>👥 En equipos (2v2, 3v3, 7v7)</div>
          <p style={pStyle}>
            Cada jugador conserva su propio MMR individual. Para calcular el "esperado", se compara tu MMR contra el <b style={{ color: 'var(--text-primary)' }}>promedio del equipo rival</b> — así un jugador de MMR alto en un equipo mixto no infla ni perjudica injustamente a sus compañeros.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>🤝 Empates</div>
          <p style={pStyle}>
            En fases de grupos (todos contra todos) un partido puede terminar empatado. Ahí el "resultado real" de la fórmula es <b style={{ color: 'var(--text-primary)' }}>0.5 para los dos lados</b> — el que tenía menos MMR gana algunos puntos, el que tenía más pierde algunos, proporcional a qué tan pareja se esperaba la serie.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>🏅 Los tiers</div>
          <p style={{ ...pStyle, marginBottom: 14 }}>
            Los tiers son solo una forma visual de agrupar rangos de MMR — no cambian el cálculo, son una foto de dónde estás parado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tiersDesc.map(t => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className={`tier-pill ${t.cssClass}`}>{t.icon} {t.name}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {t.min > 0 ? `${t.min}+ MMR` : 'debajo de 900'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={hStyle}>🚫 Lo que NO afecta el MMR</div>
          <p style={pStyle}>
            Ganarle a alguien vale lo mismo sin importar quién organizó el torneo. El sello de <Link href="/torneos" style={{ color: 'var(--gold)' }}>organizador verificado</Link> es una señal de confianza sobre los datos del torneo, no un multiplicador de puntos — un torneo sin ese sello otorga exactamente el mismo MMR que uno verificado.
          </p>
        </section>

        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7, marginTop: 32 }}>
          Si en algún momento encontramos un partido mal cargado, se corrige y se recalcula todo el historial afectado en el orden real en que se jugó — el objetivo es que el número de hoy siempre refleje el historial real, no un parche encima de otro.
        </p>

      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
