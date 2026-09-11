'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { IconSearch, IconX } from './LineIcons'

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
  { val: 'normal',     label: 'Normal',     color: 'var(--rarity-normal)'    },
  { val: 'especial',   label: 'Especial',   color: 'var(--rarity-special)'   },
  { val: 'magico',     label: 'Mágico',     color: 'var(--rarity-magic)'     },
  { val: 'epico',      label: 'Épico',      color: 'var(--rarity-epic)'      },
  { val: 'legendario', label: 'Legendario', color: 'var(--rarity-legendary)' },
]

const TIPO_TABS = [
  { val: 'all',  label: 'Todos', color: 'var(--gold)',    bg: 'color-mix(in srgb, var(--gold) 14%, transparent)' },
  { val: 'sell', label: 'Vende', color: 'var(--success)', bg: 'var(--wash-green-bg)'  },
  { val: 'buy',  label: 'Busca', color: 'var(--info)',    bg: 'var(--wash-blue-bg)'  },
]

// OJO: el botón de Alsius acá usaba #5B9BDF, NO el #2196F3 que es el azul
// de reino "canónico" en el resto del sitio (Ranking, Torneos, REINO_COLOR)
// — es el mismo valor que ya veníamos colapsando como --info en el badge
// "Busca". Se mantiene ese colapso acá para no introducir un tercer azul;
// avisado en el resumen, no se fuerza a --alsius porque cambiaría el valor.
const REINOS = [
  { val: 'alsius', color: 'var(--info)',   bg: 'var(--wash-blue-bg)'  },
  { val: 'syrtis', color: 'var(--syrtis)', bg: 'var(--wash-green-bg)'  },
  { val: 'ignis',  color: 'var(--ignis)',  bg: 'var(--wash-red-bg)'  },
]

// ─── Estilos ──────────────────────────────────────────────────────────────────

const ARROW_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5' viewBox='0 0 9 5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%23d4af3777'/%3E%3C/svg%3E")`

const glassSelect: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  padding: '7px 30px 7px 11px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
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
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  padding: '7px 11px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
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
    router.push(qs ? `/market?${qs}` : '/market')
  }, [router, searchParams])

  // Cambio de categoría → resetea subcat
  const setCat = useCallback((val: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (val === 'all') { p.delete('cat') } else { p.set('cat', val) }
    p.delete('subcat')
    p.delete('page')
    router.push(p.toString() ? `/market?${p.toString()}` : '/market')
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
    router.push('/market')
  }

  const subcats = SUBCATS[cat] ?? null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto 24px' }}>

      {/* ── Barra de filtros jerárquica ──────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        padding: '10px 12px',
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
              borderColor: cat !== 'all' ? 'color-mix(in srgb, var(--gold) 45%, transparent)' : 'color-mix(in srgb, var(--gold) 18%, transparent)',
            }}
          >
            {CATS.map(c => (
              <option key={c.val} value={c.val} style={{ background: 'var(--select-option-bg)' }}>
                {c.label}
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
                borderColor: subcat !== 'all' ? 'color-mix(in srgb, var(--gold) 45%, transparent)' : 'color-mix(in srgb, var(--gold) 18%, transparent)',
              }}
            >
              {subcats.map(s => (
                <option key={s.val} value={s.val} style={{ background: 'var(--select-option-bg)' }}>{s.label}</option>
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
              color: subclase !== 'all' ? 'var(--info)' : 'var(--text-muted)',
              borderColor: subclase !== 'all' ? 'color-mix(in srgb, var(--info) 50%, transparent)' : 'color-mix(in srgb, var(--gold) 18%, transparent)',
            }}
          >
            {SUBCLASES.map(s => (
              <option key={s.val} value={s.val} style={{ background: 'var(--select-option-bg)' }}>{s.label}</option>
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
                ? `color-mix(in srgb, ${RAREZAS.find(r => r.val === rareza)?.color || 'transparent'} 40%, transparent)`
                : 'color-mix(in srgb, var(--gold) 18%, transparent)',
            }}
          >
            {RAREZAS.map(r => (
              <option key={r.val} value={r.val} style={{ background: 'var(--select-option-bg)', color: r.color }}>{r.label}</option>
            ))}
          </select>

          {/* Separador visual */}
          <div style={{ width: 1, background: 'color-mix(in srgb, var(--gold) 15%, transparent)', margin: '2px 2px', flexShrink: 0 }} className="fb-sep" />

          {/* Moneda */}
          <div style={{
            display: 'flex', flexShrink: 0, alignItems: 'center',
            border: '1px solid var(--border-input)', overflow: 'hidden',
          }}>
            {[
              { val: 'mag', icon: '/magnanita.png', label: 'Mag' },
              { val: 'usd', icon: null,             label: '$' },
            ].map((m, i) => (
              <button
                key={m.val}
                onClick={() => push({ moneda: m.val })}
                title={m.label}
                style={{
                  padding: '4px 9px', border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border-input)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: moneda === m.val ? 'color-mix(in srgb, var(--gold) 14%, transparent)' : 'transparent',
                  color: moneda === m.val ? 'var(--gold)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
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
          <div style={{ position: 'relative', flex: '2 1 160px' }}>
            <IconSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar ítem..."
              value={qInput}
              onChange={e => setQInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(qInput) }}
              onBlur={() => handleSearch(qInput)}
              style={{
                ...glassInput,
                fontSize: 13,
                padding: '7px 12px 7px 30px',
              }}
            />
          </div>

          {/* Tipo: Todos / Vende / Busca */}
          <div style={{
            display: 'flex', flexShrink: 0,
            border: '1px solid var(--border-input)', overflow: 'hidden',
          }}>
            {TIPO_TABS.map((tab, i) => (
              <button
                key={tab.val}
                onClick={() => push({ tipo: tab.val })}
                style={{
                  padding: '6px 11px',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border-input)' : 'none',
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
            border: '1px solid var(--border-input)', overflow: 'hidden',
          }}>
            {REINOS.map((r, i) => (
              <button
                key={r.val}
                onClick={() => push({ reino: reino === r.val ? 'all' : r.val })}
                title={r.val.charAt(0).toUpperCase() + r.val.slice(1)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border-input)' : 'none',
                  borderBottom: reino === r.val ? `2px solid ${r.color}` : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: reino === r.val ? r.bg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            <option value="newest"     style={{ background: 'var(--select-option-bg)' }}>↓ Recientes</option>
            <option value="oldest"     style={{ background: 'var(--select-option-bg)' }}>↑ Antiguos</option>
            <option value="price_asc"  style={{ background: 'var(--select-option-bg)' }}>↑ Menor precio (mag)</option>
            <option value="price_desc" style={{ background: 'var(--select-option-bg)' }}>↓ Mayor precio (mag)</option>
          </select>

          {/* Limpiar filtros */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              style={{
                ...glassSelect,
                flex: '0 0 auto', width: 'auto', backgroundImage: 'none',
                padding: '6px 12px',
                color: 'var(--error)', borderColor: 'color-mix(in srgb, var(--error) 35%, transparent)',
                background: 'color-mix(in srgb, var(--error) 8%, transparent)',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
            >
              <IconX size={10} /> <span>Limpiar ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .fb-sep { display: none; }
        }
        select option { background: var(--select-option-bg); color: var(--select-option-text); }
      `}</style>
    </div>
  )
}
