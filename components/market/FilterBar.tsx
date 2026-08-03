'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

// ─── Datos ────────────────────────────────────────────────────────────────────

const CATS = [
  { val: 'all',           label: 'Categoría',  icon: '✦' },
  { val: 'armas',         label: 'Armas',       icon: '⚔' },
  { val: 'armaduras',     label: 'Armaduras',   icon: '🛡' },
  { val: 'proyectiles',   label: 'Proyectiles', icon: '🏹' },
  { val: 'gemas_magicas', label: 'Gemas',       icon: '💎' },
  { val: 'joyeria',       label: 'Joyería',     icon: '💍' },
  { val: 'crafting',      label: 'Crafting',    icon: '🔨' },
  { val: 'minerales',     label: 'Minerales',   icon: '⛏' },
]

const SUBCATS: Record<string, { val: string; label: string }[]> = {
  armas: [
    { val: 'all',          label: 'Subcategoría'  },
    { val: 'espadas',      label: 'Espada'        },
    { val: 'lanzas',       label: 'Lanza'         },
    { val: 'hachas',       label: 'Hacha'         },
    { val: 'martillos',    label: 'Martillo'      },
    { val: 'mazos',        label: 'Mazo'          },
    { val: 'garrotes',     label: 'Garrote'       },
    { val: 'rapier',       label: 'Rapier'        },
    { val: 'baculos',      label: 'Báculo'        },
    { val: 'arcos_cortos', label: 'Arco Corto'   },
    { val: 'arcos_largos', label: 'Arco Largo'   },
  ],
  armaduras: [
    { val: 'all',         label: 'Subcategoría' },
    { val: 'yelmos',      label: 'Yelmo'        },
    { val: 'pecheras',    label: 'Pechera'      },
    { val: 'hombreras',   label: 'Hombrera'     },
    { val: 'guanteletes', label: 'Guantelete'   },
    { val: 'guantes',     label: 'Guante'       },
    { val: 'perneras',    label: 'Pernera'      },
    { val: 'brazaletes',  label: 'Brazalete'    },
    { val: 'tunicas',     label: 'Túnica'       },
    { val: 'escudos',     label: 'Escudo'       },
    { val: 'sombreros',   label: 'Sombrero'     },
  ],
  proyectiles: [
    { val: 'all',     label: 'Subcategoría' },
    { val: 'flechas', label: 'Flecha'       },
  ],
  gemas_magicas: [
    { val: 'all',              label: 'Subcategoría' },
    { val: 'gema_magica_mayor', label: 'Gema Mayor'  },
    { val: 'gran_gema_magica',  label: 'Gran Gema'   },
  ],
  joyeria: [
    { val: 'all',      label: 'Subcategoría' },
    { val: 'amuletos', label: 'Amuleto'      },
    { val: 'anillos',  label: 'Anillo'       },
  ],
  crafting: [
    { val: 'all',            label: 'Subcategoría'   },
    { val: 'material_puro',  label: 'Material Puro'  },
    { val: 'material_crudo', label: 'Material Crudo' },
  ],
  minerales: [
    { val: 'all',       label: 'Subcategoría' },
    { val: 'magnanitas', label: 'Magnanita'  },
    { val: 'lingotes',  label: 'Lingote'     },
  ],
}

// Subclase → clase parent para el filtro DB
const SUBCLASE_PARENT: Record<string, string> = {
  barbaro: 'guerrero', caballero: 'guerrero',
  brujo: 'mago',       conjurador: 'mago',
  cazador: 'arquero',  tirador: 'arquero',
}

const SUBCLASES = [
  { val: 'all',        label: 'Clase'      },
  { val: 'barbaro',    label: 'Bárbaro'    },
  { val: 'caballero',  label: 'Caballero'  },
  { val: 'brujo',      label: 'Brujo'      },
  { val: 'conjurador', label: 'Conjurador' },
  { val: 'cazador',    label: 'Cazador'    },
  { val: 'tirador',    label: 'Tirador'    },
]

const RAREZAS = [
  { val: 'all',        label: 'Rareza',     color: 'var(--text-muted)' },
  { val: 'normal',     label: 'Normal',     color: '#9CA3AF'           },
  { val: 'especial',   label: 'Especial',   color: '#FB923C'           },
  { val: 'magico',     label: 'Mágico',     color: '#22C55E'           },
  { val: 'epico',      label: 'Épico',      color: '#8B5CF6'           },
  { val: 'legendario', label: 'Legendario', color: '#EF4444'           },
]

const TIPO_TABS = [
  { val: 'all',  label: 'Todos', color: 'var(--gold)', bg: 'rgba(201,168,76,0.14)' },
  { val: 'sell', label: 'Vende', color: '#5BC98B',     bg: 'rgba(46,125,82,0.18)'  },
  { val: 'buy',  label: 'Busca', color: '#5B9BDF',     bg: 'rgba(30,74,122,0.18)'  },
]

const REINOS = [
  { val: 'alsius', color: '#5B9BDF', bg: 'rgba(30,74,122,0.18)'  },
  { val: 'syrtis', color: '#5BC98B', bg: 'rgba(46,125,82,0.18)'  },
  { val: 'ignis',  color: '#EF4444', bg: 'rgba(127,29,29,0.18)'  },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────

const ARROW_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5' viewBox='0 0 9 5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%23C9A84C77'/%3E%3C/svg%3E")`

const glassSelect: React.CSSProperties = {
  background: 'rgba(10,8,5,0.82)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(201,168,76,0.18)',
  borderRadius: 8,
  padding: '7px 30px 7px 11px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none' as any,
  WebkitAppearance: 'none' as any,
  backgroundImage: ARROW_SVG,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 9px center',
  transition: 'border-color 0.15s',
  minWidth: 0,
  flex: '1 1 0',
}

const glassInput: React.CSSProperties = {
  background: 'rgba(10,8,5,0.82)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(201,168,76,0.18)',
  borderRadius: 8,
  padding: '7px 11px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 12,
  outline: 'none',
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box' as any,
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function FilterBar() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Leer params actuales
  const tipo     = searchParams.get('tipo')      || 'all'
  const cat      = searchParams.get('cat')       || 'all'
  const subcat   = searchParams.get('subcat')    || 'all'
  const subclase = searchParams.get('subclase')  || 'all'
  const rareza   = searchParams.get('rareza')    || 'all'
  const reino    = searchParams.get('reino')     || 'all'
  const sort     = searchParams.get('sort')      || 'newest'
  const q        = searchParams.get('q')         || ''
  const precioMin = searchParams.get('precio_min') || ''
  const precioMax = searchParams.get('precio_max') || ''
  const moneda   = searchParams.get('moneda')    || 'mag'   // 'mag' | 'usd' | (próx. más)

  const [qInput,        setQInput]        = useState(q)
  const [precioMinInput, setPrecioMinInput] = useState(precioMin)
  const [precioMaxInput, setPrecioMaxInput] = useState(precioMax)

  // Helper: actualizar un param sin recargar historial extra
  const push = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === 'all' || v === '') p.delete(k)
      else p.set(k, v)
    }
    p.delete('page')
    const qs = p.toString()
    router.push(qs ? `/?${qs}` : '/')
  }, [router, searchParams])

  // Cambio de categoría → resetea subcat
  const setCat = useCallback((val: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (val === 'all') { p.delete('cat') } else { p.set('cat', val) }
    p.delete('subcat')
    p.delete('page')
    router.push(p.toString() ? `/?${p.toString()}` : '/')
  }, [router, searchParams])

  // Cambio de subclase → setea clase en el param para que page.tsx filtre
  const setSubclase = useCallback((val: string) => {
    const clase = val !== 'all' ? (SUBCLASE_PARENT[val] || '') : ''
    push({ subclase: val, clase })
  }, [push])

  // Búsqueda
  const handleSearch = useCallback((val: string) => push({ q: val.trim() }), [push])

  // Precio — cualquier valor distinto de 'mag' usa la columna de dinero
  const esDinero = moneda !== 'mag'
  const handlePrecioMin = useCallback(() => {
    const key = esDinero ? 'precio_min_ars' : 'precio_min'
    push({ [key]: precioMinInput.trim() })
  }, [push, precioMinInput, esDinero])

  const handlePrecioMax = useCallback(() => {
    const key = esDinero ? 'precio_max_ars' : 'precio_max'
    push({ [key]: precioMaxInput.trim() })
  }, [push, precioMaxInput, esDinero])

  // Contar filtros activos (para mostrar badge "limpiar")
  const activeCount = [
    cat !== 'all', subcat !== 'all', subclase !== 'all',
    rareza !== 'all', tipo !== 'all', reino !== 'all', !!precioMin, !!precioMax, !!q,
  ].filter(Boolean).length

  const clearAll = () => {
    setQInput(''); setPrecioMinInput(''); setPrecioMaxInput('')
    router.push('/')
  }

  const subcats = SUBCATS[cat] ?? null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto 24px' }}>

      {/* ── Barra de filtros jerárquica ──────────────────────────────── */}
      <div style={{
        background: 'rgba(10,8,5,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(201,168,76,0.14)',
        borderRadius: 12, padding: '10px 12px',
        marginBottom: 10,
      }}>

        {/* Fila 1 — Selects jerárquicos */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>

          {/* Categoría */}
          <select
            className="fb-select"
            value={cat}
            onChange={e => setCat(e.target.value)}
            style={{
              ...glassSelect,
              color: cat !== 'all' ? 'var(--gold)' : 'var(--text-muted)',
              borderColor: cat !== 'all' ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)',
            }}
          >
            {CATS.map(c => (
              <option key={c.val} value={c.val} style={{ background: '#0d0a07' }}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>

          {/* Subcategoría — solo si la categoría tiene subcats */}
          {subcats ? (
            <select
              className="fb-select"
              value={subcat}
              onChange={e => push({ subcat: e.target.value })}
              style={{
                ...glassSelect,
                color: subcat !== 'all' ? 'var(--gold)' : 'var(--text-muted)',
                borderColor: subcat !== 'all' ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)',
              }}
            >
              {subcats.map(s => (
                <option key={s.val} value={s.val} style={{ background: '#0d0a07' }}>{s.label}</option>
              ))}
            </select>
          ) : (
            <select className="fb-select" disabled style={{ ...glassSelect, opacity: 0.35, cursor: 'not-allowed' }}>
              <option>Subcategoría</option>
            </select>
          )}

          {/* Subclase / Restricción de clase */}
          <select
            className="fb-select"
            value={subclase}
            onChange={e => setSubclase(e.target.value)}
            style={{
              ...glassSelect,
              color: subclase !== 'all' ? '#7DC4FF' : 'var(--text-muted)',
              borderColor: subclase !== 'all' ? 'rgba(91,155,223,0.5)' : 'rgba(201,168,76,0.18)',
            }}
          >
            {SUBCLASES.map(s => (
              <option key={s.val} value={s.val} style={{ background: '#0d0a07' }}>{s.label}</option>
            ))}
          </select>

          {/* Rareza */}
          <select
            className="fb-select"
            value={rareza}
            onChange={e => push({ rareza: e.target.value })}
            style={{
              ...glassSelect,
              color: rareza !== 'all'
                ? (RAREZAS.find(r => r.val === rareza)?.color || 'var(--text-primary)')
                : 'var(--text-muted)',
              borderColor: rareza !== 'all'
                ? `${RAREZAS.find(r => r.val === rareza)?.color || 'transparent'}66`
                : 'rgba(201,168,76,0.18)',
            }}
          >
            {RAREZAS.map(r => (
              <option key={r.val} value={r.val} style={{ background: '#0d0a07', color: r.color }}>{r.label}</option>
            ))}
          </select>

          {/* Separador visual */}
          <div style={{ width: 1, background: 'rgba(201,168,76,0.15)', margin: '2px 2px', flexShrink: 0 }} className="fb-sep" />

          {/* Moneda */}
          <div style={{
            display: 'flex', flexShrink: 0, alignItems: 'center',
            border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, overflow: 'hidden',
          }}>
            {[
              { val: 'mag', icon: '/magnanita.png', label: 'Mag' },
              { val: 'usd', icon: null,             label: '💵' },
            ].map((m, i) => (
              <button
                key={m.val}
                onClick={() => push({ moneda: m.val })}
                title={m.label}
                style={{
                  padding: '4px 9px', border: 'none',
                  borderLeft: i > 0 ? '1px solid rgba(201,168,76,0.18)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: moneda === m.val ? 'rgba(201,168,76,0.14)' : 'transparent',
                  color: moneda === m.val ? 'var(--gold)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontFamily: "'Cinzel',serif",
                }}
              >
                {m.icon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={m.icon} alt={m.label} style={{ width: 18, height: 18, objectFit: 'contain', opacity: moneda === m.val ? 1 : 0.45 }} />
                  : m.label
                }
              </button>
            ))}
          </div>

          {/* Precio mínimo */}
          <input
            type="number"
            placeholder="Mín"
            value={precioMinInput}
            onChange={e => setPrecioMinInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handlePrecioMin() }}
            onBlur={handlePrecioMin}
            style={{ ...glassInput, flex: '1 1 60px', maxWidth: 90 }}
          />

          {/* Precio máximo */}
          <input
            type="number"
            placeholder="Máx"
            value={precioMaxInput}
            onChange={e => setPrecioMaxInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handlePrecioMax() }}
            onBlur={handlePrecioMax}
            style={{ ...glassInput, flex: '1 1 60px', maxWidth: 90 }}
          />
        </div>

        {/* Fila 2 — Búsqueda + tipo + sort + vista + limpiar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Búsqueda */}
          <input
            type="text"
            placeholder="🔍  Buscar ítem..."
            value={qInput}
            onChange={e => setQInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(qInput) }}
            onBlur={() => handleSearch(qInput)}
            style={{
              ...glassInput,
              flex: '2 1 160px',
              fontSize: 13,
              padding: '7px 12px',
            }}
          />

          {/* Tipo: Todos / Vende / Busca */}
          <div style={{
            display: 'flex', flexShrink: 0,
            border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, overflow: 'hidden',
          }}>
            {TIPO_TABS.map((tab, i) => (
              <button
                key={tab.val}
                onClick={() => push({ tipo: tab.val })}
                style={{
                  padding: '6px 11px',
                  fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 0.8,
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid rgba(201,168,76,0.18)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: tipo === tab.val ? tab.bg : 'transparent',
                  color: tipo === tab.val ? tab.color : 'var(--text-muted)',
                  fontWeight: tipo === tab.val ? 700 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reino */}
          <div style={{
            display: 'flex', flexShrink: 0,
            border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, overflow: 'hidden',
          }}>
            {REINOS.map((r, i) => (
              <button
                key={r.val}
                onClick={() => push({ reino: reino === r.val ? 'all' : r.val })}
                title={r.val.charAt(0).toUpperCase() + r.val.slice(1)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid rgba(201,168,76,0.18)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: reino === r.val ? r.bg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: reino === r.val ? `0 0 8px ${r.color}55` : 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${r.val}.png`}
                  alt={r.val}
                  style={{
                    width: 24, height: 24,
                    objectFit: 'contain',
                    opacity: reino === r.val ? 1 : 0.45,
                    filter: reino === r.val ? `drop-shadow(0 0 4px ${r.color})` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => push({ sort: e.target.value })}
            style={{ ...glassSelect, flex: '0 0 auto', width: 'auto' }}
          >
            <option value="newest"     style={{ background: '#0d0a07' }}>↓ Recientes</option>
            <option value="oldest"     style={{ background: '#0d0a07' }}>↑ Antiguos</option>
            <option value="price_asc"  style={{ background: '#0d0a07' }}>↑ Menor precio (mag)</option>
            <option value="price_desc" style={{ background: '#0d0a07' }}>↓ Mayor precio (mag)</option>
          </select>

          {/* Limpiar filtros */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              style={{
                ...glassSelect,
                flex: '0 0 auto', width: 'auto', backgroundImage: 'none',
                padding: '6px 12px',
                color: '#E24B4A', borderColor: 'rgba(226,75,74,0.35)',
                background: 'rgba(226,75,74,0.08)',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 0.5,
              }}
            >
              ✕ <span>Limpiar ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .fb-sep { display: none; }
        }
        select option { background: #0d0a07; color: #e8e0d0; }
      `}</style>
    </div>
  )
}
