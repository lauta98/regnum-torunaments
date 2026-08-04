import Link from 'next/link'

export default function DestacarPage() {
  return (
    <div style={{ padding: '40px 20px 60px', maxWidth: 860, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>☕</div>
        <h1 className="cinzel" style={{ fontSize: 26, color: 'var(--gold)', marginBottom: 10, letterSpacing: 2 }}>
          Apoyá el proyecto
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
          Elegí un paquete en Cafecito y ganá visibilidad en el marketplace.
          Todo el dinero va al mantenimiento del servidor, sin fines de lucro.
        </p>
      </div>

      {/* Comparativa */}
      <div className="destacar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>

        {/* Gratis */}
        <div style={{
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: 12, padding: 24,
        }}>
          <h2 className="cinzel" style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 6 }}>Sin destacar</h2>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 20 }}>Gratis</p>
          {[
            { ok: true,  text: 'Publicación activa en la grilla' },
            { ok: true,  text: 'Visible con búsqueda y filtros' },
            { ok: true,  text: 'Bump diario para subir al tope' },
            { ok: false, text: 'Aparece en el carrusel principal' },
            { ok: false, text: 'Badge ★ DESTACADO' },
            { ok: false, text: 'Mayor visibilidad frente a compradores' },
            { ok: false, text: 'Paquete de publicaciones' },
            { ok: false, text: 'Foto de perfil personalizada' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: f.ok ? '#5BC98B' : 'var(--dark-border)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                {f.ok ? '✓' : '✗'}
              </span>
              <span style={{ fontSize: 13, color: f.ok ? 'var(--text-primary)' : 'var(--text-muted)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Destacado $500 */}
        <div style={{
          background: 'var(--dark-card)',
          border: '1px solid rgba(245,158,11,0.5)',
          borderRadius: 12, padding: 24, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            background: '#F59E0B', color: '#000', fontSize: 10, fontFamily: "'Cinzel',serif",
            padding: '3px 14px', borderRadius: 20, letterSpacing: 1, fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            RECOMENDADO
          </div>
          <h2 className="cinzel" style={{ fontSize: 15, color: '#F59E0B', marginBottom: 6 }}>★ Destacar</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>$500</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ARS</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Pago único · 7 días · 1 publicación</p>
          {[
            { text: 'Publicación activa en la grilla' },
            { text: 'Visible con búsqueda y filtros' },
            { text: 'Bump diario para subir al tope' },
            { text: 'Aparece en el carrusel principal' },
            { text: 'Badge ★ DESTACADO en tu tarjeta' },
            { text: 'Mayor visibilidad frente a compradores' },
            { ok: false, text: 'Publicaciones en simultáneo' },
            { ok: false, text: 'Foto de perfil personalizada' },
          ].map((f: any, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: f.ok === false ? 'var(--dark-border)' : '#F59E0B', fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                {f.ok === false ? '✗' : '★'}
              </span>
              <span style={{ fontSize: 13, color: f.ok === false ? 'var(--text-muted)' : 'var(--text-primary)' }}>{f.text}</span>
            </div>
          ))}
          <a
            href="https://cafecito.app/lautarey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              background: 'linear-gradient(135deg, #b45309, #F59E0B)',
              color: '#000', padding: '10px 0', borderRadius: 8,
              fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
              letterSpacing: 1, textDecoration: 'none',
            }}
          >
            ☕ COMPRAR EN CAFECITO
          </a>
        </div>

        {/* Premium $3000 */}
        <div style={{
          background: 'linear-gradient(160deg, var(--dark-card) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(139,92,246,0.5)',
          borderRadius: 12, padding: 24, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', color: '#fff',
            fontSize: 10, fontFamily: "'Cinzel',serif",
            padding: '3px 14px', borderRadius: 20, letterSpacing: 1, fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            PREMIUM
          </div>
          <h2 className="cinzel" style={{ fontSize: 15, color: '#A78BFA', marginBottom: 6 }}>💎 Premium</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>$3.000</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ARS</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Pago único · 4 semanas</p>
          {[
            { text: 'Todo lo del plan Destacar' },
            { text: '6 publicaciones destacadas en simultáneo' },
            { text: 'Se renuevan cada semana (4 semanas)' },
            { text: 'Foto de perfil personalizada' },
            { text: 'Prioridad en el carrusel principal' },
            { text: 'Máxima visibilidad frente a compradores' },
            { text: 'Soporte directo por Discord' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: '#A78BFA', fontSize: 14, flexShrink: 0, marginTop: 1 }}>💎</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{f.text}</span>
            </div>
          ))}
          <Link
            href="/market/configuracion"
            style={{
              display: 'block', marginTop: 20, textAlign: 'center',
              background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
              color: '#fff', padding: '10px 0', borderRadius: 8,
              fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
              letterSpacing: 1, textDecoration: 'none',
            }}
          >
            💎 ACTIVAR PREMIUM
          </Link>
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{
        background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
        borderRadius: 12, padding: 28, marginBottom: 32,
      }}>
        <h3 className="cinzel" style={{ fontSize: 14, color: 'var(--gold)', marginBottom: 20, letterSpacing: 1 }}>
          ¿CÓMO FUNCIONA?
        </h3>
        {[
          { n: '1', title: 'Elegí tu paquete', desc: 'Destacar ($500) para una publicación puntual, o Premium ($3.000) para 24 publicaciones durante 4 semanas.' },
          { n: '2', title: 'Pagá en Cafecito', desc: 'Hacé clic en "Comprar en Cafecito" y enviá el monto correspondiente a cafecito.app/lautarey. Opcional: dejá el nombre del ítem o "Premium" como mensaje.' },
          { n: '3', title: 'Confirmá el pago', desc: 'Desde "Mis Publicaciones" hacé clic en "☕ Destacar · $500" en el ítem y luego en "✓ Ya pagué". Para Premium, avisanos por Discord.' },
          { n: '4', title: 'Activación en minutos', desc: 'Verificamos el pago en Cafecito y activamos tu plan. Destacar: 1 publicación por 7 días. Premium: 6 publicaciones en simultáneo, renovadas cada semana durante 4 semanas.' },
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cinzel',serif", fontSize: 14, color: '#F59E0B',
            }}>{s.n}</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{s.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/market/mis-listings" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #b45309, #F59E0B)',
          color: '#000', padding: '14px 36px', borderRadius: 10,
          fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
          letterSpacing: 1, textDecoration: 'none',
        }}>
          ☕ IR A MIS PUBLICACIONES
        </Link>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.6 }}>
          Sin suscripciones. Sin renovaciones automáticas.<br />
          Cada peso ayuda a mantener el servidor activo.
        </p>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .destacar-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
