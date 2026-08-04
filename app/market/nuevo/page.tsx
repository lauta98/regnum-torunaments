'use client'
import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Spinner from '@/components/market/Spinner'
import { useCurrency } from '@/lib/market/CurrencyContext'

function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const CATEGORIAS = [
  { val: 'armas', label: 'Armas', icon: '⚔' },
  { val: 'armaduras', label: 'Armaduras', icon: '🛡' },
  { val: 'proyectiles', label: 'Proyectiles', icon: '🏹' },
  { val: 'crafting', label: 'Crafting', icon: '🔨' },
  { val: 'gemas_magicas', label: 'Gemas Mágicas', icon: '💎' },
  { val: 'joyeria', label: 'Joyería', icon: '💍' },
  { val: 'minerales', label: 'Minerales', icon: '⛏' },
]

const CLASES = ['todas','guerrero','mago','arquero']
const CLASE_LABEL: Record<string,string> = {
  todas:'Todas', guerrero:'Guerrero', mago:'Mago', arquero:'Arquero'
}
const SUBCLASES: Record<string,string[]> = {
  todas:['todas'], guerrero:['todas','barbaro','caballero'],
  mago:['todas','brujo','conjurador'], arquero:['todas','cazador','tirador']
}
const SUBCLASE_LABEL: Record<string,string> = {
  todas:'Todas', barbaro:'Bárbaro', caballero:'Caballero',
  brujo:'Brujo', conjurador:'Conjurador', cazador:'Cazador', tirador:'Tirador'
}
const SUBCATS_POR_CLASE: Record<string, Record<string,string[]>> = {
  armas: {
    todas: ['espadas','lanzas','hachas','martillos','mazos','garrotes','rapier','baculos','arcos_cortos','arcos_largos'],
    guerrero: ['espadas','lanzas','hachas','martillos','mazos','garrotes','rapier'],
    mago: ['baculos'],
    arquero: ['arcos_cortos','arcos_largos'],
  },
  armaduras: {
    todas: ['yelmos','pecheras','hombreras','guanteletes','perneras','escudos','tunicas','sombreros','brazaletes','guantes'],
    guerrero: ['yelmos','pecheras','hombreras','guanteletes','perneras','escudos'],
    mago: ['tunicas','sombreros','brazaletes','guantes'],
    arquero: ['yelmos','pecheras','hombreras','guanteletes','perneras'],
  },
  proyectiles: {
    todas: ['flechas'], guerrero: [], mago: [], arquero: ['flechas'],
  },
}
const SUBCATEGORIA_LABEL: Record<string,string> = {
  espadas:'Espadas', lanzas:'Lanzas', hachas:'Hachas', martillos:'Martillos',
  mazos:'Mazos', garrotes:'Garrotes', rapier:'Rapier', florin:'Rapier', baculos:'Báculos',
  arcos_cortos:'Arcos Cortos', arcos_largos:'Arcos Largos',
  yelmos:'Yelmos', pecheras:'Pecheras', hombreras:'Hombreras',
  guanteletes:'Guanteletes', perneras:'Perneras', escudos:'Escudos',
  tunicas:'Túnicas', sombreros:'Sombreros', brazaletes:'Brazaletes', guantes:'Guantes',
  flechas:'Flechas', material_puro:'Material Puro', material_crudo:'Material Crudo',
  gema_magica_mayor:'Gema Mágica Mayor', gran_gema_magica:'Gran Gema Mágica',
  amuletos:'Amuletos', anillos:'Anillos', magnanitas:'Magnanitas', lingotes:'Lingotes',
}
const SUBCATS_SIMPLES: Record<string,string[]> = {
  crafting: ['material_puro','material_crudo'],
  gemas_magicas: ['gema_magica_mayor','gran_gema_magica'],
  joyeria: ['amuletos','anillos'],
  minerales: ['magnanitas','lingotes'],
}
const ESTADOS = ['comun','mejorado','superior','gran','maestre','artesano']
const ESTADO_LABEL: Record<string,string> = {
  comun:'Común', mejorado:'Mejorado', superior:'Superior',
  gran:'Gran', maestre:'Maestre', artesano:'Artesano'
}
const RAREZAS = ['normal','especial','magico','epico','legendario']
const RAREZA_LABEL: Record<string,string> = {
  normal:'Normal', especial:'Especial', magico:'Mágico', epico:'Épico', legendario:'Legendario'
}
const RAREZA_COLOR: Record<string,string> = {
  normal:'#9CA3AF', especial:'#FB923C', magico:'#22C55E', epico:'#8B5CF6', legendario:'#EF4444'
}
const CALIDAD_LABEL: Record<string,string> = {
  muy_buena:'Muy buena', buena:'Buena', normal:'Normal', mala:'Mala', muy_mala:'Muy mala'
}
const CALIDAD_COLOR: Record<string,string> = {
  muy_buena:'#22c55e', buena:'#86efac', normal:'#888', mala:'#f87171', muy_mala:'#ef4444'
}
const RESIST_LABEL: Record<string,string> = {
  cortante:'Cortante', punzante:'Punzante', aplastante:'Aplastante',
  fuego:'Fuego', hielo:'Hielo', electrico:'Eléctrico'
}
const RESIST_ICON: Record<string,string> = {
  cortante:'🗡', punzante:'↑', aplastante:'🔨', fuego:'🔥', hielo:'❄', electrico:'⚡'
}
const VELOCIDADES = ['muy_lenta','lenta','media','rapida']
const VELOCIDAD_LABEL: Record<string,string> = {
  muy_lenta:'Muy lenta', lenta:'Lenta', media:'Media', rapida:'Rápida'
}
const TIPOS_DANO = ['Cortante','Punzante','Aplastante','Fuego','Hielo','Eléctrico']
const MUESCA_TIPOS = ['sin_muesca','vacia','gema']
const MUESCA_LABEL: Record<string,string> = {
  sin_muesca:'Sin muesca', vacia:'Muesca vacía', gema:'Gema insertada'
}
const GEMA_TIPOS = ['daño','velocidad_ataque','velocidad_invocacion','chance_critico']
const GEMA_LABEL: Record<string,string> = {
  daño:'Daño', velocidad_ataque:'Vel. de ataque', velocidad_invocacion:'Vel. de invocación', chance_critico:'Chance de crítico'
}
const GEMA_ELEMENTOS = ['Fuego','Hielo','Electricidad','Aplastante','Punzante','Cortante']
const GEMA_ELEMENTO_COLOR: Record<string,string> = {
  Fuego:'#E05A2B', Hielo:'#5BB8E8', Electricidad:'#E8C84A', Aplastante:'#8899AA', Punzante:'#5BC98B', Cortante:'#E24B4A'
}
const GEMA_MAX: Record<string,number> = {
  daño: 15, velocidad_ataque: 7, velocidad_invocacion: 7, chance_critico: 25
}
const MATERIALES_ACERO = ['Acero','Acero Fino','Aleación de Acero','Xymerald']
const MATERIALES_MADERA = ['Madera Endurecida','Madera Endurecida Fina','Madera Reforzada','Lámina de Xymerald']
const MATERIALES_MAGO = [...MATERIALES_ACERO, ...MATERIALES_MADERA]
const getMateriales = (subcategoria: string, clase: string) => {
  if (subcategoria === 'garrotes') return MATERIALES_MADERA
  if (clase === 'arquero') return MATERIALES_MADERA
  if (clase === 'mago') return MATERIALES_MAGO
  return MATERIALES_ACERO
}
const SLOTS_MEJORA: Record<string,number> = {
  yelmos:1, pecheras:1, hombreras:1, guanteletes:1, perneras:1, escudos:0,
  tunicas:2, sombreros:2, guantes:1, brazaletes:0,
}
const ARMOR_MODS_POR_RAREZA: Record<string,number> = {
  normal:0, especial:1, magico:2, epico:3, legendario:4
}
const SLOTS_POR_RAREZA_ARMA: Record<string,number> = {
  normal:0, especial:1, magico:2, epico:3, legendario:5
}
const SLOTS_POR_RAREZA_PROYECTIL: Record<string,number> = {
  normal:0, especial:1, magico:2, epico:3, legendario:4
}
const DANO_MEJORA =['cortante','punzante','aplastante','fuego','hielo','electrico']
const DANO_MEJORA_LABEL: Record<string,string> = {
  cortante:'Cortante', punzante:'Punzante', aplastante:'Aplastante',
  fuego:'Fuego', hielo:'Hielo', electrico:'Eléctrico'
}

// ─── SlotArmadura ───────────────────────────────────────────────
function SlotArmadura({ index, subcategoria, rareza, clase, value, onChange, usados }: {
  index: number; subcategoria: string; rareza: string; clase: string
  value: {modificador:string; valor:string; subtipo:string}
  onChange: (v:{modificador:string; valor:string; subtipo:string}) => void
  usados: string[]
}) {
  const [modifiers, setModifiers] = useState<any[]>([])
  const supabase = useMemo(() => createClient(), [])
  const esMago = clase === 'mago'
  const esSlotLegendario = rareza === 'legendario' && index === 3

  useEffect(() => {
    if (!subcategoria) return
    supabase.from('armor_modifiers').select('*').eq('subcategoria', subcategoria)
      .then(({ data }) => setModifiers(data || []))
  }, [subcategoria, supabase])

  const maxAtributos = subcategoria === 'tunicas' ? 2 : 1
  const atributosUsados = usados.filter(u =>
    modifiers.find(mod => mod.nombre === u && mod.tipo === 'atributo')
  )

  const disponibles = modifiers.filter(m => {
    if (m.solo_legendario && !esSlotLegendario) return false
    if (m.tipo !== 'atributo') {
      if (usados.includes(m.nombre) && m.nombre !== value.modificador) return false
    }
    if (m.tipo === 'atributo') {
      const esteEsAtributo = value.modificador && modifiers.find(mod => mod.nombre === value.modificador && mod.tipo === 'atributo')
      if (!esteEsAtributo && atributosUsados.length >= maxAtributos) return false
    }
    return true
  })

  const selected = modifiers.find(m => m.nombre === value.modificador)
  const tipo = selected?.tipo
  const getRangoGeneral = () => esMago ? ['1%','2%','3%'] : ['1%','2%']

  const inp: React.CSSProperties = {
    width:'100%', background:'var(--dark-surface)', border:'1px solid var(--dark-border)',
    borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', fontFamily:'inherit', fontSize:14, outline:'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, display:'block', marginBottom:6,
  }
  const btn = (active: boolean, color?: string): React.CSSProperties => ({
    flex:1, padding:'6px 4px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'inherit',
    border:`1px solid ${active ? (color || 'var(--gold)') : 'var(--dark-border)'}`,
    background: active ? `${color || 'var(--gold)'}22` : 'var(--dark-surface)',
    color: active ? (color || 'var(--gold)') : 'var(--text-muted)',
  })

  return (
    <div style={{
      background:'var(--dark-surface)',
      border:`1px solid ${esSlotLegendario ? 'rgba(239,68,68,0.4)' : 'var(--dark-border)'}`,
      borderRadius:8, padding:12, marginBottom:10,
    }}>
      <span style={{fontFamily:"'Cinzel',serif", fontSize:10, color: esSlotLegendario ? '#EF4444' : 'var(--gold)', letterSpacing:1, display:'block', marginBottom:8}}>
        {esSlotLegendario ? '⚡ SLOT LEGENDARIO' : `SLOT ${index+1}`}
      </span>
      <div style={{marginBottom:8}}>
        <label style={lbl}>Modificador</label>
        <select style={{...inp, cursor:'pointer'}} value={value.modificador}
          onChange={e => onChange({modificador:e.target.value, valor:'', subtipo:''})}>
          <option value="">Seleccionar modificador...</option>
          {disponibles.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
        </select>
      </div>

      {tipo === 'resist_fisico' && (
        <div style={{marginBottom:8}}>
          <label style={lbl}>Tipo físico</label>
          <div style={{display:'flex', gap:6, marginBottom:8}}>
            {['Cortante','Punzante','Aplastante'].map(t => (
              <button key={t} style={btn(value.subtipo===t)} onClick={() => onChange({...value, subtipo:t, valor:''})}>{t}</button>
            ))}
          </div>
          {value.subtipo && <>
            <label style={lbl}>Valor</label>
            <div style={{display:'flex', gap:6}}>
              {['1%','2%','3%'].map(v => <button key={v} style={btn(value.valor===v)} onClick={() => onChange({...value, valor:v})}>{v}</button>)}
            </div>
          </>}
        </div>
      )}

      {tipo === 'resist_magico' && (
        <div style={{marginBottom:8}}>
          <label style={lbl}>Tipo mágico</label>
          <div style={{display:'flex', gap:6, marginBottom:8}}>
            {['Fuego','Hielo','Eléctrico'].map(t => (
              <button key={t} style={btn(value.subtipo===t)} onClick={() => onChange({...value, subtipo:t, valor:''})}>{t}</button>
            ))}
          </div>
          {value.subtipo && <>
            <label style={lbl}>Valor</label>
            <div style={{display:'flex', gap:6}}>
              {['1%','2%','3%'].map(v => <button key={v} style={btn(value.valor===v)} onClick={() => onChange({...value, valor:v})}>{v}</button>)}
            </div>
          </>}
        </div>
      )}

      {tipo === 'resist_general' && (
        <div>
          <label style={lbl}>Valor</label>
          <div style={{display:'flex', gap:6}}>
            {getRangoGeneral().map(v => <button key={v} style={btn(value.valor===v)} onClick={() => onChange({...value, valor:v, subtipo:''})}>{v}</button>)}
          </div>
        </div>
      )}

      {tipo === 'atributo' && (
        <div>
          <label style={lbl}>Valor</label>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {Array.from({length: esMago ? 7 : 5}, (_,i) => i+1).map(n => (
              <button key={n} style={{...btn(value.valor===String(n)), minWidth:36}} onClick={() => onChange({...value, valor:String(n), subtipo:''})}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {tipo === 'libre' && (() => {
        const nombre = value.modificador.toLowerCase()
        const esVelAI = nombre.includes('velocidad de ataque') || nombre.includes('velocidad de invocación')
        const esVelMov = nombre.includes('velocidad de movimiento')
        if (esVelAI) {
          const max = esMago ? 7 : 5
          return <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {Array.from({length:max}, (_,i) => `${i+1}%`).map(v => <button key={v} style={btn(value.valor===v)} onClick={() => onChange({...value, valor:v, subtipo:''})}>{v}</button>)}
          </div>
        }
        if (esVelMov) {
          const max = esMago ? 6 : 4
          return <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {Array.from({length:max}, (_,i) => `${i+1}%`).map(v => <button key={v} style={btn(value.valor===v)} onClick={() => onChange({...value, valor:v, subtipo:''})}>{v}</button>)}
          </div>
        }
        return <input style={inp} placeholder="Ej: 105, 15%..." value={value.valor} onChange={e => onChange({...value, valor:e.target.value, subtipo:''})}/>
      })()}
    </div>
  )
}

const DANO_FISICO_SUBTIPOS = ['Cortante','Punzante','Aplastante']
const DANO_MAGICO_SUBTIPOS = ['Fuego','Hielo','Electricidad']

// ─── SlotArma ───────────────────────────────────────────────────
function SlotArma({ index, subcategoria, rareza, clase, value, onChange, usados }: {
  index: number; subcategoria: string; rareza: string; clase: string
  value: {modificador:string; valor:string; subtipo:string}
  onChange: (v:{modificador:string; valor:string; subtipo:string}) => void
  usados: string[]
}) {
  const [modifiers, setModifiers] = useState<any[]>([])
  const supabase = useMemo(() => createClient(), [])
  const totalSlots = SLOTS_POR_RAREZA_ARMA[rareza] ?? 0
  const esSlotLegendario = rareza === 'legendario' && index === totalSlots - 1

  useEffect(() => {
    if (!subcategoria) return
    supabase.from('weapon_modifiers').select('*').eq('subcategoria', subcategoria)
      .then(({ data }) => setModifiers(data || []))
  }, [subcategoria, supabase])

  // Auto-corregir nombre si vino del OCR y tiene diferencia de acentos/mayúsculas
  useEffect(() => {
    if (!modifiers.length || !value.modificador) return
    const exactMatch = modifiers.find(m => m.nombre === value.modificador)
    if (!exactMatch) {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const fuzzy = modifiers.find(m => norm(m.nombre) === norm(value.modificador))
      if (fuzzy) onChange({ ...value, modificador: fuzzy.nombre })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiers, value.modificador])

  const maxAtributos = 1
  const atributosUsados = usados.filter(u =>
    modifiers.find(mod => mod.nombre === u && mod.tipo === 'atributo')
  )

  const disponibles = modifiers.filter(m => {
    if (m.solo_legendario && !esSlotLegendario) return false
    if (m.tipo !== 'atributo') {
      if (usados.includes(m.nombre) && m.nombre !== value.modificador) return false
    }
    if (m.tipo === 'atributo') {
      const esteEsAtributo = value.modificador && modifiers.find(mod => mod.nombre === value.modificador && mod.tipo === 'atributo')
      if (!esteEsAtributo && atributosUsados.length >= maxAtributos) return false
    }
    return true
  })

  const selected = modifiers.find(m => m.nombre === value.modificador)
  const tipo = selected?.tipo
  const modLower = value.modificador.toLowerCase()
  const esDanoFisico = modLower.includes('f\u00edsico') || modLower.includes('fisico')
  const esDanoMagico = modLower.includes('m\u00e1gico') || modLower.includes('magico')

  const inp: React.CSSProperties = {
    width:'100%', background:'var(--dark-surface)', border:'1px solid var(--dark-border)',
    borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', fontFamily:'inherit', fontSize:14, outline:'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, display:'block', marginBottom:6,
  }
  const btn = (active: boolean, color?: string): React.CSSProperties => ({
    flex:1, padding:'6px 4px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'inherit',
    border:`1px solid ${active ? (color||'var(--gold)') : 'var(--dark-border)'}`,
    background: active ? `${color||'var(--gold)'}22` : 'var(--dark-surface)',
    color: active ? (color||'var(--gold)') : 'var(--text-muted)',
  })

  const FISICO_COLOR: Record<string,string> = { Cortante:'#F87171', Punzante:'#FB923C', Aplastante:'#A78BFA' }
  const MAGICO_COLOR: Record<string,string> = { Fuego:'#F97316', Hielo:'#38BDF8', Electricidad:'#FDE047' }

  return (
    <div style={{
      background:'var(--dark-surface)',
      border:`1px solid ${esSlotLegendario ? 'rgba(239,68,68,0.4)' : 'var(--dark-border)'}`,
      borderRadius:8, padding:12, marginBottom:10,
    }}>
      <span style={{fontFamily:"'Cinzel',serif", fontSize:10, color: esSlotLegendario ? '#EF4444' : 'var(--gold)', letterSpacing:1, display:'block', marginBottom:8}}>
        {esSlotLegendario ? '⚡ SLOT LEGENDARIO' : `SLOT ${index+1}`}
      </span>
      <div style={{marginBottom:8}}>
        <label style={lbl}>Modificador</label>
        <select style={{...inp, cursor:'pointer'}} value={value.modificador}
          onChange={e => onChange({modificador:e.target.value, valor:'', subtipo:''})}>
          <option value="">Seleccionar modificador...</option>
          {disponibles.map((m,i) => (
            <option key={`${m.id}-${i}`} value={m.nombre}>
              {m.nombre}{m.valor_min && m.valor_max ? ` (${m.valor_min} - ${m.valor_max})` : ''}
            </option>
          ))}
        </select>
      </div>
      {value.modificador && (
        <>
          {/* Subtipo para Daño físico */}
          {esDanoFisico && (
            <div style={{marginBottom:8}}>
              <label style={lbl}>Tipo de daño físico</label>
              <div style={{display:'flex', gap:6}}>
                {DANO_FISICO_SUBTIPOS.map(s => (
                  <button key={s} style={btn(value.subtipo===s, FISICO_COLOR[s])}
                    onClick={() => onChange({...value, subtipo:s})}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {/* Subtipo para Daño mágico */}
          {esDanoMagico && (
            <div style={{marginBottom:8}}>
              <label style={lbl}>Tipo de daño mágico</label>
              <div style={{display:'flex', gap:6}}>
                {DANO_MAGICO_SUBTIPOS.map(s => (
                  <button key={s} style={btn(value.subtipo===s, MAGICO_COLOR[s])}
                    onClick={() => onChange({...value, subtipo:s})}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={lbl}>Valor {selected?.valor_min ? `(${selected.valor_min} - ${selected.valor_max})` : ''}</label>
            {(tipo === 'atributo' || tipo === 'atributo_mago') ? (
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {Array.from({length: tipo === 'atributo_mago' ? 7 : 5}, (_,i) => i+1).map(n => (
                  <button key={n} style={{...btn(value.valor===String(n)), minWidth:36}} onClick={() => onChange({...value, valor:String(n)})}>{n}</button>
                ))}
              </div>
            ) : (
              <input style={inp} placeholder={`Ej: ${selected?.valor_min || ''}...`}
                value={value.valor} onChange={e => onChange({...value, valor:e.target.value})}/>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── SlotProyectil ──────────────────────────────────────────────
function SlotProyectil({ index, rareza, value, onChange, usados }: {
  index: number; rareza: string
  value: {modificador:string; valor:string; subtipo:string}
  onChange: (v:{modificador:string; valor:string; subtipo:string}) => void
  usados: string[]
}) {
  const [modifiers, setModifiers] = useState<any[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Flechas comparten el pool de modificadores de arcos cortos
    supabase.from('weapon_modifiers').select('*').eq('subcategoria', 'arcos_cortos')
      .then(({ data }) => setModifiers(data || []))
  }, [supabase])

  // Auto-corregir nombre si vino del OCR
  useEffect(() => {
    if (!modifiers.length || !value.modificador) return
    const exactMatch = modifiers.find(m => m.nombre === value.modificador)
    if (!exactMatch) {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      const fuzzy = modifiers.find(m => norm(m.nombre) === norm(value.modificador))
      if (fuzzy) onChange({ ...value, modificador: fuzzy.nombre })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiers, value.modificador])

  const disponibles = modifiers.filter(m => {
    // Sin velocidad de ningún tipo
    if (m.nombre.toLowerCase().includes('velocidad')) return false
    if (m.tipo !== 'atributo') {
      if (usados.includes(m.nombre) && m.nombre !== value.modificador) return false
    }
    return true
  })

  const selected = modifiers.find(m => m.nombre === value.modificador)
  const tipo = selected?.tipo
  const modLower = value.modificador.toLowerCase()
  const esDanoFisico = modLower.includes('físico') || modLower.includes('fisico')
  const esDanoMagico = modLower.includes('mágico') || modLower.includes('magico')

  const inp: React.CSSProperties = {
    width:'100%', background:'var(--dark-surface)', border:'1px solid var(--dark-border)',
    borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', fontFamily:'inherit', fontSize:14, outline:'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, display:'block', marginBottom:6,
  }
  const btn = (active: boolean, color?: string): React.CSSProperties => ({
    flex:1, padding:'6px 4px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'inherit',
    border:`1px solid ${active ? (color||'var(--gold)') : 'var(--dark-border)'}`,
    background: active ? `${color||'var(--gold)'}22` : 'var(--dark-surface)',
    color: active ? (color||'var(--gold)') : 'var(--text-muted)',
  })

  const FISICO_COLOR: Record<string,string> = { Cortante:'#F87171', Punzante:'#FB923C', Aplastante:'#A78BFA' }
  const MAGICO_COLOR: Record<string,string> = { Fuego:'#F97316', Hielo:'#38BDF8', Electricidad:'#FDE047' }

  return (
    <div style={{
      background:'var(--dark-surface)',
      border:'1px solid var(--dark-border)',
      borderRadius:8, padding:12, marginBottom:10,
    }}>
      <span style={{fontFamily:"'Cinzel',serif", fontSize:10, color:'var(--gold)', letterSpacing:1, display:'block', marginBottom:8}}>
        SLOT {index+1}
      </span>
      <div style={{marginBottom:8}}>
        <label style={lbl}>Modificador</label>
        <select style={{...inp, cursor:'pointer'}} value={value.modificador}
          onChange={e => onChange({modificador:e.target.value, valor:'', subtipo:''})}>
          <option value="">Seleccionar modificador...</option>
          {disponibles.map((m,i) => (
            <option key={`${m.id}-${i}`} value={m.nombre}>
              {m.nombre}{m.valor_min && m.valor_max ? ` (${m.valor_min} - ${m.valor_max})` : ''}
            </option>
          ))}
        </select>
      </div>
      {value.modificador && (
        <>
          {esDanoFisico && (
            <div style={{marginBottom:8}}>
              <label style={lbl}>Tipo de daño físico</label>
              <div style={{display:'flex', gap:6}}>
                {['Cortante','Punzante','Aplastante'].map(s => (
                  <button key={s} style={btn(value.subtipo===s, FISICO_COLOR[s])}
                    onClick={() => onChange({...value, subtipo:s})}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {esDanoMagico && (
            <div style={{marginBottom:8}}>
              <label style={lbl}>Tipo de daño mágico</label>
              <div style={{display:'flex', gap:6}}>
                {['Fuego','Hielo','Electricidad'].map(s => (
                  <button key={s} style={btn(value.subtipo===s, MAGICO_COLOR[s])}
                    onClick={() => onChange({...value, subtipo:s})}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={lbl}>Valor {selected?.valor_min ? `(${selected.valor_min} - ${selected.valor_max})` : ''}</label>
            {(tipo === 'atributo' || tipo === 'atributo_mago') ? (
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {Array.from({length: 5}, (_,i) => i+1).map(n => (
                  <button key={n} style={{...btn(value.valor===String(n)), minWidth:36}} onClick={() => onChange({...value, valor:String(n)})}>{n}</button>
                ))}
              </div>
            ) : (
              <input style={inp} placeholder={`Ej: ${selected?.valor_min || ''}...`}
                value={value.valor} onChange={e => onChange({...value, valor:e.target.value})}/>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tipos ──────────────────────────────────────────────────────
interface ImageSlot {
  id: string
  file: File
  previewUrl: string    // object URL para mostrar (original o recortado)
  croppedBlob?: Blob    // resultado del crop (se usa para upload y OCR)
  ocrStatus: 'idle' | 'running' | 'done' | 'error'
  ocrError?: string
}

// ─── NuevoPage ──────────────────────────────────────────────────
function NuevoPageContent() {
  const searchParams = useSearchParams()
  const tipoParam = searchParams.get('tipo') as 'sell'|'buy'|null
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { userCurrency } = useCurrency()

  const [type, setType] = useState<'sell'|'buy'>(tipoParam === 'buy' ? 'buy' : 'sell')
  const [isSet, setIsSet] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [clase, setClase] = useState('todas')
  const [subclase, setSubclase] = useState('todas')
  const [subcategoria, setSubcategoria] = useState('')
  const [itemBases, setItemBases] = useState<any[]>([])
  const [itemBaseId, setItemBaseId] = useState('')
  const [itemNombreManual, setItemNombreManual] = useState('')
  const [nombresHistoricos, setNombresHistoricos] = useState<string[]>([])
  const [rareza, setRareza] = useState('')
  const [estado, setEstado] = useState('')
  const [material, setMaterial] = useState('')
  const [bonusXX, setBonusXX] = useState<number|null>(null)
  const [bonusManual, setBonusManual] = useState('')
  const [bonusAutoFound, setBonusAutoFound] = useState(false)
  const [armaduraBase, setArmaduraBase] = useState('')
  const [armaduraBonus, setArmaduraBonus] = useState('')
  const [resistencias, setResistencias] = useState<Record<string,string>>({})
  const [danos, setDanos] = useState([{tipo:'',min:'',max:''}])
  const [velocidad, setVelocidad] = useState('')
  const [rango, setRango] = useState('')
  const [muesca, setMuesca] = useState({tipo:'sin_muesca',gema_tipo:'',gema_valor:'',gema_subtipo:''})
  const [gemaStandalone, setGemaStandalone] = useState({tipo:'',subtipo:'',valor:''})
  const [armorSlots, setArmorSlots] = useState<{modificador:string;valor:string;subtipo:string}[]>([])
  const [weaponSlots, setWeaponSlots] = useState<{modificador:string;valor:string;subtipo:string}[]>([])
  const [proyectilSlots, setProyectilSlots] = useState<{modificador:string;valor:string;subtipo:string}[]>([])
  const [slotsMejora, setSlotsMejora] = useState<{tipo:string;valor:string}[]>([])
  const [desc, setDesc] = useState('')
  const [reino, setReino] = useState('')
  const [servidor, setServidor] = useState('Ra')

  // Verificar sesión y perfil completo
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('profiles').select('username, servidor').eq('id', data.user.id).maybeSingle()
        .then(({ data: p }) => {
          if (!p?.username) { router.push('/market/elegir-nombre'); return }
          if (p?.servidor) setServidor(p.servidor)
        })
    })
  }, [])
const [priceGold, setPriceGold] = useState('')
const [priceMoney, setPriceMoney] = useState('')
const [currency, setCurrency] = useState('ARS')
const [priceMagnanitas, setPriceMagnanitas] = useState('')  
const [priceReal, setPriceReal] = useState('')              
  const MAX_IMAGES = 5
  const maxSlots = isSet ? MAX_IMAGES : 1
  // ─── Multi-image state ────────────────────────────────────────────
  // Slot 0 = imagen principal (OCR + upload). Slots 1-4 = adicionales (carousel).
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])
  const [cropSlotId, setCropSlotId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const esArma = categoria === 'armas'
  const esArmadura = categoria === 'armaduras'
  const esProyectil = categoria === 'proyectiles'
  const esSimple = ['crafting','gemas_magicas','joyeria','minerales'].includes(categoria)
  const numArmorMods = esArmadura ? (ARMOR_MODS_POR_RAREZA[rareza] ?? 0) : 0
  const numSlotsMejora = esArmadura ? (SLOTS_MEJORA[subcategoria] ?? 0) : 0
  const numWeaponSlots = SLOTS_POR_RAREZA_ARMA[rareza] ?? 0
  const numProyectilSlots = esProyectil ? (SLOTS_POR_RAREZA_PROYECTIL[rareza] ?? 0) : 0

  const subcatsDisponibles = (() => {
    if (esSimple) return SUBCATS_SIMPLES[categoria] || []
    if (!categoria || !SUBCATS_POR_CLASE[categoria]) return []
    return SUBCATS_POR_CLASE[categoria][clase] || SUBCATS_POR_CLASE[categoria]['todas'] || []
  })()

  const [analizando, setAnalizando] = useState(false)
  const [errorAnalisis, setErrorAnalisis] = useState('')

  

  useEffect(() => {
    if (tipoParam === 'buy' || tipoParam === 'sell') setType(tipoParam)
  }, [tipoParam])

  
  useEffect(() => {
    setSubcategoria('')
    setItemBaseId('')
    setItemNombreManual('')
    setRareza('')
    setEstado('')
    setMaterial('')
  }, [clase, categoria])

  useEffect(() => {
    if (!subcategoria) { setItemBases([]); setNombresHistoricos([]); return }
    supabase.from('item_bases').select('*').eq('subcategoria', subcategoria)
      .then(({ data }) => setItemBases(data || []))
    // Cargar nombres usados previamente en listings para autocomplete
    supabase.from('listings').select('item_name').eq('subcategoria', subcategoria)
      .not('item_name', 'is', null).limit(200)
      .then(({ data }) => {
        if (data) {
          const unicos = [...new Set(data.map((r: any) => r.item_name as string).filter(Boolean))].sort()
          setNombresHistoricos(unicos)
        }
      })
    setItemBaseId('')
    setItemNombreManual('')
    setMuesca({tipo:'sin_muesca',gema_tipo:'',gema_valor:'',gema_subtipo:''})
    setGemaStandalone({tipo:'',subtipo:'',valor:''})
    setSlotsMejora(Array(SLOTS_MEJORA[subcategoria] ?? 0).fill(null).map(() => ({tipo:'',valor:''})))
  }, [subcategoria, supabase])

  // Auto-seleccionar ítem base cuando el usuario escribe un nombre reconocible
  useEffect(() => {
    if (!itemNombreManual || !itemBases.length) return
    const norm = (s: string) => s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
    const ocr = norm(itemNombreManual)
    // Con menos de 2 palabras no auto-seleccionar (evita match prematuro en "Espada")
    const palabrasEscritas = ocr.split(' ').filter(w => w.length > 1)
    if (palabrasEscritas.length < 2) { setItemBaseId(''); return }

    // 1. Coincidencia exacta
    let match = itemBases.find((b: any) => norm(b.nombre) === ocr)

    // 2. Coincidencia por palabras distintivas (excluye palabras genéricas comunes)
    //    Dirección A: palabras del DB que aparecen en OCR
    //    Dirección B: palabras del OCR que aparecen en DB
    //    Si cualquiera supera 60% es match
    if (!match) {
      // Palabras genéricas que no aportan al match (están en todos los nombres de la categoría)
      const STOPWORDS = new Set(['anillo', 'anillos', 'amuleto', 'amuletos', 'arma', 'armadura',
        'del', 'los', 'las', 'una', 'uno'])
      const filtrar = (palabras: string[]) => palabras.filter((w: string) => w.length > 2 && !STOPWORDS.has(w))

      match = itemBases.find((b: any) => {
        const dbNorm = norm(b.nombre)
        const palabrasDB  = filtrar(dbNorm.split(' '))
        const palabrasOCR = filtrar(ocr.split(' '))
        if (palabrasDB.length === 0) return false
        // A: palabras del DB presentes en el OCR
        const dbEnOCR = palabrasDB.filter((w: string) => ocr.includes(w)).length / palabrasDB.length
        // B: palabras del OCR presentes en el DB
        const ocrEnDB = palabrasOCR.length > 0
          ? palabrasOCR.filter((w: string) => dbNorm.includes(w)).length / palabrasOCR.length
          : 0
        return Math.max(dbEnOCR, ocrEnDB) >= 0.60
      })
    }

    if (match) {
      setItemBaseId(match.id)
      const esSimpleLocal = ['crafting','gemas_magicas','joyeria','minerales'].includes(categoria)
      if (esSimpleLocal) setDesc((match.descripcion || '').replace(/\\n|\n/g, '\n'))
    }
  }, [itemNombreManual, itemBases])

  // Auto-fill tipo de daño base desde el subtipo del modificador seleccionado
  useEffect(() => {
    if (!esArma || !weaponSlots.length) return
    const FISICO = new Set(['Cortante','Punzante','Aplastante'])
    const MAGICO  = new Set(['Fuego','Hielo','Electricidad'])
    for (const slot of weaponSlots) {
      if (!slot?.subtipo) continue
      if (FISICO.has(slot.subtipo) || MAGICO.has(slot.subtipo)) {
        setDanos(prev => {
          const nd = [...prev]
          // Solo auto-fill si el primer tipo de daño está vacío
          if (!nd[0]?.tipo) {
            nd[0] = { ...nd[0], tipo: slot.subtipo }
          }
          return nd
        })
        break
      }
    }
  }, [weaponSlots, esArma])

  useEffect(() => {
    setArmorSlots(Array(numArmorMods).fill(null).map(() => ({modificador:'',valor:'',subtipo:''})))
  }, [rareza, subcategoria])

  useEffect(() => {
    if (!esArma) return
    setWeaponSlots(Array(numWeaponSlots).fill(null).map(() => ({modificador:'',valor:'',subtipo:''})))
  }, [rareza, subcategoria])

  useEffect(() => {
    if (!esProyectil) return
    setProyectilSlots(Array(numProyectilSlots).fill(null).map(() => ({modificador:'',valor:'',subtipo:''})))
  }, [rareza, subcategoria])

  useEffect(() => {
    if (!esArma || !material || !estado || !rareza) return
    if (rareza === 'normal' || rareza === 'especial') { setBonusAutoFound(false); return }
    supabase.from('weapon_bonus_table').select('bonus_xx')
      .eq('subcategoria', subcategoria).eq('material', material)
      .eq('estado', estado).eq('rareza', rareza).single()
      .then(({ data }) => {
        if (data?.bonus_xx) { setBonusXX(data.bonus_xx); setBonusAutoFound(true) }
        else { setBonusXX(null); setBonusAutoFound(false) }
      })
  }, [material, estado, rareza, subcategoria, supabase])

  const inp: React.CSSProperties = {
    width:'100%', background:'var(--dark-surface)', border:'1px solid var(--dark-border)',
    borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', fontFamily:'inherit', fontSize:14, outline:'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, display:'block', marginBottom:6,
  }
  const secTitle = (t: string) => (
    <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0 14px'}}>
      <div style={{flex:1,height:1,background:'var(--dark-border)'}}/>
      <span style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'var(--text-muted)',letterSpacing:1}}>{t}</span>
      <div style={{flex:1,height:1,background:'var(--dark-border)'}}/>
    </div>
  )
  const pillBtn = (active: boolean, color?: string): React.CSSProperties => ({
    padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'inherit',
    border:`1px solid ${active ? (color||'var(--gold)') : 'var(--dark-border)'}`,
    background: active ? `${color||'var(--gold)'}22` : 'var(--dark-surface)',
    color: active ? (color||'var(--gold)') : 'var(--text-muted)',
  })
// Escala la imagen a mínimo minWidth px de ancho y aplica grayscale + boost de
// contraste (factor 1.5). Ambas transformaciones aumentan drásticamente la tasa
// de acierto de Tesseract con UI de juego que suele tener texto sobre fondos oscuros.
async function scaledImageBlob(blob: Blob, minWidth: number): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = img.width < minWidth ? minWidth / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Preprocesamiento para OCR: grayscale + contraste ×1.5
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
        d[i] = d[i + 1] = d[i + 2] = boosted
      }
      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob(b => resolve(b || blob), 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob) }
    img.src = url
  })
}

// ─── Detección de calidad de imagen ───────────────────────────────────────────

interface QualityWarning {
  type: 'fullscreen' | 'resolution' | 'blur' | 'brightness'
  message: string
  severity: 'error' | 'warning'
}

function detectImageQuality(img: HTMLImageElement): QualityWarning[] {
  const warnings: QualityWarning[] = []
  const { naturalWidth: nw, naturalHeight: nh } = img

  // 1. Pantalla completa — landscape ancho o imagen gigante
  const aspect = nw / nh
  if (nw > 1400 || (aspect > 1.55 && nw > 700)) {
    warnings.push({
      type: 'fullscreen',
      message: 'Parece una captura completa del juego. Recortá solo el tooltip del ítem.',
      severity: 'error',
    })
  }

  // 2. Resolución muy pequeña — ítem lejano o foto muy reducida
  if (nw < 220 || nh < 150) {
    warnings.push({
      type: 'resolution',
      message: 'La imagen es muy pequeña. El ítem puede ser difícil de leer.',
      severity: 'warning',
    })
  }

  // Análisis de píxeles: downsample a 320px máx para velocidad
  try {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 320 / Math.max(nw, nh))
    const w = Math.max(1, Math.round(nw * scale))
    const h = Math.max(1, Math.round(nh * scale))
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)

    // 3. Brillo promedio
    let lumSum = 0; let lumCount = 0
    for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
      lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      lumCount++
    }
    const avgLum = lumSum / lumCount
    if (avgLum < 38) {
      warnings.push({ type: 'brightness', message: 'Imagen muy oscura. Puede afectar la lectura de stats.', severity: 'warning' })
    } else if (avgLum > 218) {
      warnings.push({ type: 'brightness', message: 'Imagen sobreexpuesta o con mucho brillo.', severity: 'warning' })
    }

    // 4. Blur — varianza Laplaciana (bordes borrosos = texto ilegible)
    const gray = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    }
    let lapSum = 0; let lapCount = 0
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const lap = gray[(y - 1) * w + x] + gray[(y + 1) * w + x]
                  + gray[y * w + (x - 1)] + gray[y * w + (x + 1)]
                  - 4 * gray[y * w + x]
        lapSum += lap * lap; lapCount++
      }
    }
    const lapVar = lapSum / lapCount
    if (lapVar < 60 && nw > 220) {
      warnings.push({
        type: 'blur',
        message: 'La imagen parece borrosa. Usá una captura directa, no una foto de la pantalla.',
        severity: 'warning',
      })
    }
  } catch { /* canvas fallback: ignorar */ }

  return warnings
}

// ─── CropModal ────────────────────────────────────────────────────────────────

function CropModal({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [qualityWarnings, setQualityWarnings] = useState<QualityWarning[]>([])

  const handleImgLoad = () => {
    if (imgRef.current) setQualityWarnings(detectImageQuality(imgRef.current))
  }

  // Genera blob del área recortada. Si no hay crop válido, devuelve imagen completa.
  const getCroppedBlob = useCallback(async (pixelCrop: PixelCrop | undefined): Promise<Blob> => {
    const img = imgRef.current!
    const canvas = document.createElement('canvas')
    if (pixelCrop && pixelCrop.width > 10 && pixelCrop.height > 10) {
      const scaleX = img.naturalWidth  / img.width
      const scaleY = img.naturalHeight / img.height
      canvas.width  = Math.round(pixelCrop.width  * scaleX)
      canvas.height = Math.round(pixelCrop.height * scaleY)
      canvas.getContext('2d')!.drawImage(
        img,
        Math.round(pixelCrop.x * scaleX),
        Math.round(pixelCrop.y * scaleY),
        canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height,
      )
    } else {
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
    }
    return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
  }, [])

  const hasCrop = completedCrop && completedCrop.width > 10 && completedCrop.height > 10

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.96)', display:'flex', flexDirection:'column' }}>

      {/* Header compacto */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', flexShrink:0,
        background:'var(--dark-surface)', borderBottom:'1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:'var(--gold)', letterSpacing:1 }}>✂ Recortá el ítem</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Seleccioná solo el tooltip del ítem para mejor precisión</span>
        </div>
        <button onClick={onCancel} style={{
          background:'none', border:'none', color:'var(--text-muted)',
          cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 4px',
        }}>✕</button>
      </div>

      {/* Advertencias de calidad — strip colapsable bajo el header */}
      {qualityWarnings.length > 0 && (
        <div style={{ flexShrink:0, display:'flex', flexWrap:'wrap', gap:6, padding:'8px 14px', background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {qualityWarnings.map(w => (
            <div key={w.type} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 12px', borderRadius:99, fontSize:11.5, lineHeight:1.35,
              background: w.severity === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)',
              border: `1px solid ${w.severity === 'error' ? 'rgba(239,68,68,0.45)' : 'rgba(251,191,36,0.35)'}`,
              color: w.severity === 'error' ? '#f87171' : '#fcd34d',
            }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{w.severity === 'error' ? '🚫' : '⚠️'}</span>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Cuerpo: crop + guía lateral */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>

        {/* Crop area */}
        <div style={{ flex:1, overflow:'auto', display:'flex', justifyContent:'center', alignItems:'center', padding:'16px' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            style={{ maxWidth:'100%' }}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Screenshot a recortar"
              onLoad={handleImgLoad}
              style={{ display:'block', maxWidth:'100%', maxHeight:'calc(100vh - 170px)' }}
            />
          </ReactCrop>
        </div>

        {/* Guía de calidad — panel lateral derecho */}
        <div style={{
          width:196, flexShrink:0, overflowY:'auto',
          background:'var(--dark-surface)',
          borderLeft:'1px solid rgba(201,168,76,0.18)',
          padding:'14px 13px 20px',
        }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:10, color:'var(--gold)', letterSpacing:1.5, marginBottom:12, textTransform:'uppercase' }}>
            Guía de calidad
          </div>

          {/* ✅ BIEN */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:7 }}>✅ BIEN</div>
            {[
              'Solo el tooltip de stats del ítem',
              'Imagen nítida, sin desenfoque',
              'Recorte ajustado al cuadro',
              'Buena iluminación',
            ].map(tip => (
              <div key={tip} style={{ display:'flex', gap:6, marginBottom:5, alignItems:'flex-start' }}>
                <span style={{ color:'#4ade80', flexShrink:0, fontSize:11 }}>›</span>
                <span style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.4 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* ❌ EVITAR */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#f87171', marginBottom:7 }}>❌ EVITAR</div>
            {[
              'Pantalla completa del juego',
              'Foto con el celular a la pantalla',
              'Imagen borrosa o pixelada',
              'Varios tooltips en la misma foto',
              'Exceso de brillo o bajo contraste',
            ].map(tip => (
              <div key={tip} style={{ display:'flex', gap:6, marginBottom:5, alignItems:'flex-start' }}>
                <span style={{ color:'#f87171', flexShrink:0, fontSize:11 }}>›</span>
                <span style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.4 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* Tip IA */}
          <div style={{
            padding:'9px 10px', borderRadius:8,
            background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.2)',
          }}>
            <div style={{ fontSize:10.5, color:'var(--text-muted)', lineHeight:1.5 }}>
              💡 Un recorte preciso del tooltip mejora la detección automática de stats.
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div style={{
        flexShrink:0, padding:'12px 16px',
        background:'var(--dark-surface)', borderTop:'1px solid rgba(201,168,76,0.15)',
        display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
      }}>
        <span style={{ fontSize:11, color:'var(--text-muted)', flex:1, minWidth:160 }}>
          💡 Recortá ajustado al tooltip — sin barras de menú ni UI del juego
        </span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={onCancel} style={{
            background:'none', border:'1px solid var(--dark-border)',
            color:'var(--text-muted)', borderRadius:8, padding:'9px 16px',
            cursor:'pointer', fontSize:12,
          }}>
            Cancelar
          </button>
          <button onClick={async () => onConfirm(await getCroppedBlob(undefined))} style={{
            background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.35)',
            color:'var(--gold)', borderRadius:8, padding:'9px 16px',
            cursor:'pointer', fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:0.5,
          }}>
            Usar imagen completa
          </button>
          <button
            onClick={async () => onConfirm(await getCroppedBlob(hasCrop ? completedCrop : undefined))}
            style={{
              background: hasCrop
                ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))'
                : 'rgba(201,168,76,0.2)',
              color: hasCrop ? 'var(--dark-bg)' : 'var(--gold)',
              border:'none', borderRadius:8,
              padding:'9px 22px', cursor:'pointer',
              fontFamily:"'Cinzel',serif", fontSize:12, fontWeight:700, letterSpacing:0.5,
              opacity: hasCrop ? 1 : 0.6,
            }}
          >
            {hasCrop ? '✓ Analizar selección' : '✓ Analizar todo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Guía de calidad de imagen ────────────────────────────────────────────────
function ImageQualityGuide() {
  const good = [
    'Solo el cuadro de stats del ítem',
    'Imagen nítida y sin desenfoque',
    'Buena iluminación, sin brillo excesivo',
    'Recorte ajustado al tooltip',
  ]
  const bad = [
    'Captura de pantalla completa del juego',
    'Foto con el celular apuntando a la pantalla',
    'Imagen borrosa o pixelada',
    'Múltiples tooltips en la misma imagen',
    'Exceso de brillo o bajo contraste',
  ]
  return (
    <div style={{
      width:220, flexShrink:0, overflowY:'auto',
      background:'var(--dark-surface)', borderLeft:'1px solid var(--dark-border-gold)',
      padding:'14px 14px 20px',
    }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:10, color:'var(--gold)', letterSpacing:1.5, marginBottom:14, textTransform:'uppercase' }}>
        Guía de Calidad
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#4ade80', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
          ✅ BIEN
        </div>
        {good.map(tip => (
          <div key={tip} style={{ display:'flex', gap:7, marginBottom:6, alignItems:'flex-start' }}>
            <span style={{ color:'#4ade80', flexShrink:0, marginTop:1 }}>›</span>
            <span style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.45 }}>{tip}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
          ❌ EVITAR
        </div>
        {bad.map(tip => (
          <div key={tip} style={{ display:'flex', gap:7, marginBottom:6, alignItems:'flex-start' }}>
            <span style={{ color:'#f87171', flexShrink:0, marginTop:1 }}>›</span>
            <span style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.45 }}>{tip}</span>
          </div>
        ))}
      </div>

      <div style={{
        padding:'10px 12px', borderRadius:8,
        background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ fontSize:10.5, color:'var(--text-muted)', lineHeight:1.55 }}>
          💡 Un recorte preciso del tooltip mejora la detección automática de estadísticas.
          El sistema aplica preprocesamiento de contraste antes de analizar.
        </div>
      </div>
    </div>
  )
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 2
const validarImagen = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Solo se permiten imágenes JPG, PNG o WebP.'
  if (file.size > 20 * 1024 * 1024) return 'La imagen es demasiado grande (máx. 20MB antes de comprimir).'
  return null
}

async function comprimirImagen(file: File): Promise<File> {
  const imageCompression = (await import('browser-image-compression')).default
  return imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  })
}

// Agrega un archivo al array de slots (máx maxSlots: 1 para ítems simples, MAX_IMAGES para sets).
// Abre el CropModal para ese slot.
const agregarImagen = (file: File) => {
  const errImg = validarImagen(file)
  if (errImg) { setErrorAnalisis(errImg); return }
  setImageSlots(prev => {
    if (prev.length >= maxSlots) return prev
    const id = Math.random().toString(36).slice(2)
    const previewUrl = URL.createObjectURL(file)
    const slot: ImageSlot = { id, file, previewUrl, ocrStatus: 'idle' }
    setCropSlotId(id)        // abre CropModal para este slot
    return [...prev, slot]
  })
}

// Corre OCR sobre el blob de un slot específico.
// Para slot 0: aplica datos al formulario.
// Para slots adicionales en sets: agrega el nombre detectado a la descripción.
const ejecutarOCRSlot = async (slotId: string, blob: Blob) => {
  const slotIdx = imageSlots.findIndex(s => s.id === slotId)
  const esPrimario = slotIdx === 0

  setImageSlots(prev => prev.map(s => s.id === slotId ? { ...s, ocrStatus: 'running' } : s))
  if (esPrimario) { setAnalizando(true); setErrorAnalisis('') }

  try {
    const ctxCategoria = esPrimario ? categoria : undefined
    const ctxRareza    = esPrimario ? rareza    : undefined
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('spa+eng', 1, { logger: () => {} })
    await worker.setParameters({ tessedit_pageseg_mode: '11' as any })
    const scaled = await scaledImageBlob(blob, 1200)
    const { data: { text } } = await worker.recognize(scaled)
    await worker.terminate()
    const res = await fetch('/api/market/analizar-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: text }),
    })
    const json = await res.json()
    if (json.success) {
      if (esPrimario) {
        aplicarDatos(json.data, { categoria: ctxCategoria, rareza: ctxRareza })
      } else if (isSet && json.data?.nombre) {
        // Agregar nombre al final de la descripción del set
        setDesc(prev => {
          const nombre = json.data.nombre as string
          if (prev.includes(nombre)) return prev
          return prev ? `${prev}\n- ${nombre}` : `- ${nombre}`
        })
      }
      setImageSlots(prev => prev.map(s => s.id === slotId ? { ...s, ocrStatus: 'done' } : s))
    } else {
      setImageSlots(prev => prev.map(s => s.id === slotId
        ? { ...s, ocrStatus: 'error', ocrError: json.error || 'Sin datos' } : s))
      if (esPrimario) setErrorAnalisis(json.error || 'No se pudieron leer los datos del ítem')
    }
  } catch {
    setImageSlots(prev => prev.map(s => s.id === slotId ? { ...s, ocrStatus: 'error', ocrError: 'Error de procesamiento' } : s))
    if (esPrimario) setErrorAnalisis('Error al procesar la imagen. Completá los campos manualmente.')
  } finally {
    if (esPrimario) setAnalizando(false)
  }
}

useEffect(() => {
  const onPasteGlobal = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) { agregarImagen(file); break }
      }
    }
  }
  document.addEventListener('paste', onPasteGlobal)
  return () => document.removeEventListener('paste', onPasteGlobal)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [imageSlots.length])

const handlePaste = (e: React.ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) { agregarImagen(file); break }
    }
  }
}

const aplicarDatos = (data: any, ctx?: { categoria?: string; rareza?: string }) => {
  // PASO 1 (inmediato): campos estructurales que determinan qué secciones se muestran
  if (data.categoria) setCategoria(data.categoria)
  if (data.clase) setClase(data.clase)
  if (data.subclase) setSubclase(data.subclase)

  // PASO 2 (100ms): campos que disparan useEffects que RESETEAN slots, nombre y muesca.
  // Necesitan correr antes que el paso 3 para que sus resets ocurran primero.
  setTimeout(() => {
    if (data.subcategoria) setSubcategoria(data.subcategoria)
    if (data.rareza) {
      setRareza(data.rareza)
    } else if (data.categoria === 'proyectiles' && data.modificadores?.length > 0) {
      // Rareza no detectada en imagen de flecha — inferir por cantidad de modificadores
      // 1 mod → especial, 2 → magico, 3 → epico, 4+ → legendario
      const n = (data.modificadores as any[]).length
      const inferred = n >= 4 ? 'legendario' : n === 3 ? 'epico' : n === 2 ? 'magico' : 'especial'
      setRareza(inferred)
    }
    if (data.estado) setEstado(data.estado)
    if (data.material) setMaterial(data.material)
  }, 100)

  // PASO 3 (450ms): campos que fueron reseteados por los useEffects del paso 2.
  // Se aplican DESPUÉS de que React procesó todos los resets.
  setTimeout(() => {
    if (data.nombre) setItemNombreManual(data.nombre)
    if (data.bonus_xx) setBonusManual(String(data.bonus_xx))
    if (data.armadura_base) setArmaduraBase(String(data.armadura_base))
    if (data.armadura_bonus) setArmaduraBonus(String(data.armadura_bonus))
    if (data.resistencias) setResistencias(data.resistencias)
    if (data.danos?.length) setDanos(data.danos.map((d: any) => ({
      tipo: d.tipo, min: String(d.min), max: String(d.max)
    })))
    if (data.velocidad) setVelocidad(data.velocidad)
    if (data.rango) setRango(String(data.rango))
    if (data.muesca && data.muesca !== 'sin_muesca') {
      const rawGemaValor = String(data.gema_valor || '').replace(/^\+/, '')
      setMuesca({ tipo: data.muesca, gema_tipo: data.gema_tipo || '', gema_valor: rawGemaValor, gema_subtipo: data.gema_subtipo || '' })
    }
    if (data.gema_tipo && data.gema_valor && data.categoria === 'gemas_magicas') {
      const maxVal = GEMA_MAX[data.gema_tipo] ?? 99
      const val = Math.min(parseInt(data.gema_valor) || 0, maxVal)
      setGemaStandalone({ tipo: data.gema_tipo, subtipo: data.gema_subtipo || '', valor: val > 0 ? String(val) : '' })
    }
    if (data.modificadores?.length) {
      const mapSlot = (m: any) => ({
        modificador: m.nombre,
        valor: String(m.valor || '').replace(/^\+/, '').replace(/%$/, ''),
        subtipo: m.subtipo || '',
      })

      // Para el cálculo de slots usamos ctx como fallback explícito (pasado por llamador).
      // El estado del formulario (setCategoria, setRareza, etc.) sigue siendo solo data.*.
      const ctxCategoria = data.categoria || ctx?.categoria || ''
      const ctxRareza    = data.rareza    || ctx?.rareza    || ''

      if (ctxCategoria === 'armas') {
        // Slot layout for weapons:
        //   • 1 universal "Chance de crítico" passive — ALL weapons have it, NOT counted
        //     in SLOTS_POR_RAREZA_ARMA. The FIRST CC found in the OCR output is this slot.
        //   • SLOTS_POR_RAREZA_ARMA[rareza] regular modifier slots — a weapon CAN have a
        //     second "Chance de crítico" here as a normal modifier.
        //   • 1 optional gema bonus — anything beyond the two groups above is gema.
        //     A third CC means the gema is also a chance-de-crítico gema.
        //
        // Strategy: pull out only the FIRST CC as the universal passive; everything else
        // (including a 2nd CC) stays in remainingMods and is subject to the regular cap.
        const allMods = data.modificadores as any[]
        const firstCCIdx = allMods.findIndex((m: any) => m.nombre === 'Chance de crítico')
        const universalCC: any[]   = firstCCIdx !== -1 ? [allMods[firstCCIdx]] : []
        const remainingMods: any[] = firstCCIdx !== -1
          ? allMods.filter((_: any, i: number) => i !== firstCCIdx)
          : [...allMods]

        const maxRegular     = SLOTS_POR_RAREZA_ARMA[ctxRareza] ?? 0
        const slottedRegular = remainingMods.slice(0, maxRegular)
        const overflowMods   = remainingMods.slice(maxRegular)   // beyond cap → gema

        setWeaponSlots([...universalCC, ...slottedRegular].map(mapSlot))

        // Auto-detect gema from overflow if the parser didn't find a muesca section
        if (overflowMods.length > 0 && (!data.muesca || data.muesca === 'sin_muesca')) {
          const ov     = overflowMods[0]
          const ovNom  = (ov.nombre ?? '').toLowerCase()
          const numVal = String(ov.valor || '').replace(/^\+/, '').replace(/%$/, '')
          if (ovNom === 'chance de crítico' || ovNom === 'chance de critico') {
            setMuesca({ tipo: 'gema', gema_tipo: 'chance_critico', gema_valor: numVal, gema_subtipo: '' })
          } else if (ovNom.includes('velocidad de invocaci')) {
            setMuesca({ tipo: 'gema', gema_tipo: 'velocidad_invocacion', gema_valor: numVal + '%', gema_subtipo: '' })
          } else if (ovNom.includes('velocidad de ataque')) {
            setMuesca({ tipo: 'gema', gema_tipo: 'velocidad_ataque', gema_valor: numVal + '%', gema_subtipo: '' })
          } else if (ovNom.includes('daño') || ovNom.includes('dano')) {
            setMuesca({ tipo: 'gema', gema_tipo: 'daño', gema_valor: numVal, gema_subtipo: ov.subtipo || '' })
          }
        }
      } else if (ctxCategoria === 'proyectiles') {
        const proyectilCap = SLOTS_POR_RAREZA_PROYECTIL[ctxRareza] ?? 4
        // Filtrar velocidades (no permitidas en proyectiles)
        const modsProyectil = (data.modificadores as any[]).filter((m: any) =>
          !(m.nombre || '').toLowerCase().includes('velocidad')
        )
        setProyectilSlots(modsProyectil.slice(0, proyectilCap).map(mapSlot))
      } else {
        // Cap to the DB-backed armor slot limit for the detected rareza
        const armorCap = ARMOR_MODS_POR_RAREZA[ctxRareza] ?? 4
        setArmorSlots(data.modificadores.slice(0, armorCap).map(mapSlot))
      }
    }
  }, 450)
}

  const handleSubmit = async () => {
    setError('')

    // ── Validaciones ──────────────────────────────────────────────
    const tieneImagen = imageSlots.length > 0

    if (isSet) {
      // Con foto: solo nombre y precio obligatorios
      // Sin foto: nombre + descripción obligatorios
      if (!itemNombreManual.trim()) { setError('Ingresá el nombre del set'); return }
      if (!tieneImagen && !desc.trim()) { setError('Sin foto, describí qué ítems incluye el set'); return }
      if (!priceMagnanitas && !priceReal) { setError('Ingresá al menos un precio'); return }
    } else {
      if (!tieneImagen) {
        // Sin foto: campos del ítem son obligatorios
        if (!categoria)    { setError('Sin foto, seleccioná una categoría'); return }
        if (!subcategoria) { setError('Sin foto, seleccioná una subcategoría'); return }
        if (!rareza)       { setError('Sin foto, seleccioná la rareza del ítem'); return }
      }
      if (!priceMagnanitas && !priceReal) { setError('Ingresá al menos un precio'); return }
    }
    const itemNameFinal = itemNombreManual?.trim() || SUBCATEGORIA_LABEL[subcategoria] || subcategoria
    if (itemNameFinal.length > 100) {
      setError('El nombre del ítem no puede superar los 100 caracteres.')
      return
    }
    if (priceMagnanitas && (isNaN(Number(priceMagnanitas)) || Number(priceMagnanitas) <= 0)) {
      setError('El precio en Magnanitas debe ser un número positivo.')
      return
    }
    if (priceReal && (isNaN(Number(priceReal)) || Number(priceReal) <= 0)) {
      setError('El precio en dinero debe ser un número positivo.')
      return
    }
    // Sanitizar descripción: eliminar tags HTML
    const descSanitizada = desc.replace(/<[^>]*>/g, '').trim()

    setLoading(true)
    setLoadingMsg('Verificando sesión...')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // ── Subida de imágenes (paralela, comprimida) ────────────────
    let imageUrl: string | null = null
    let extraImageUrls: string[] | null = null

    if (imageSlots.length > 0) {
      setLoadingMsg(`Subiendo ${imageSlots.length} imagen${imageSlots.length > 1 ? 'es' : ''}...`)
      const uploadResults = await Promise.all(
        imageSlots.map(async (slot, idx) => {
          const rawBlob = slot.croppedBlob || slot.file
          const rawFile = rawBlob instanceof File
            ? rawBlob
            : new File([rawBlob], slot.file.name, { type: rawBlob.type || 'image/png' })
          let fileToUpload = rawFile
          try { fileToUpload = await comprimirImagen(rawFile) } catch { /* usar original */ }
          const path = `${user.id}/${Date.now()}-${idx}.png`
          const { error: uploadError } = await supabase.storage.from('item-images').upload(path, fileToUpload)
          if (uploadError) return null
          const { data } = supabase.storage.from('item-images').getPublicUrl(path)
          return data.publicUrl
        })
      )
      const validUrls = uploadResults.filter(Boolean) as string[]
      imageUrl       = validUrls[0] ?? null
      extraImageUrls = validUrls.length > 1 ? validUrls.slice(1) : null
    }

    setLoadingMsg('Publicando...')

    const finalBonusXX = bonusAutoFound ? bonusXX : (bonusManual ? parseInt(bonusManual) : null)
    const selectedBase = itemBases.find(b => b.id === itemBaseId)
    const itemName = selectedBase?.nombre || itemNombreManual || SUBCATEGORIA_LABEL[subcategoria] || subcategoria
    // Para ítems simples, usar nombre del ítem como descripción si no se provee una
    const finalDesc = descSanitizada || itemName

    const payload: any = {
      user_id: user.id, type, status: 'active', short_id: generateShortId(),
      is_set: isSet,
      item_name: itemName, item_category: isSet ? 'otros' : categoria,
      subcategoria: isSet ? null : subcategoria, item_base_id: itemBaseId || null,
      description: finalDesc,
      price_gold: priceMagnanitas ? parseFloat(priceMagnanitas) : null,
      price_money: priceReal ? parseFloat(priceReal) : null,
      currency_label: currency,
      item_image_url: imageUrl,
      image_urls: extraImageUrls,
      clase_requerida: isSet ? null : clase, subclase_requerida: isSet ? null : subclase,
      rareza: rareza || null, estado: isSet ? null : (estado || null),
      material: isSet ? null : (material || null), reino: reino || null,
      servidor: servidor || 'Ra',
    }

    if (esArma) {
      payload.bonus_xx = finalBonusXX
      payload.velocidad = velocidad || null
      payload.rango = clase === 'guerrero' ? (subcategoria === 'lanzas' ? 2 : 1) : (rango ? parseInt(rango) : null)
      danos.forEach((d, i) => {
        if (d.tipo) {
          payload[`dano_tipo_${i+1}`] = d.tipo
          payload[`dano_min_${i+1}`] = d.min ? parseInt(d.min) : null
          payload[`dano_max_${i+1}`] = d.max ? parseInt(d.max) : null
        }
      })
      payload.muesca_1_tipo = muesca.tipo || null
      payload.muesca_1_gema = muesca.tipo === 'gema' && muesca.gema_tipo
        ? `${GEMA_LABEL[muesca.gema_tipo]}${muesca.gema_subtipo ? ` (${muesca.gema_subtipo})` : ''}: ${muesca.gema_valor}` : null
      // Max weapon slots = 6 (5 regular legendario + 1 universal CC)
      weaponSlots.slice(0, 6).forEach((s, i) => {
        if (s.modificador) {
          const label = s.subtipo ? `${s.modificador} (${s.subtipo})` : s.modificador
          payload[`slot_${i+1}`] = `${label}: ${s.valor}`
        }
      })
    }

    if (esArmadura) {
      payload.armadura_base = armaduraBase ? parseInt(armaduraBase) : null
      payload.armadura_bonus = armaduraBonus ? parseInt(armaduraBonus) : null
      Object.entries(resistencias).forEach(([k,v]) => { payload[`res_${k}`] = v || null })
      // Max armor slots = 4 (ARMOR_MODS_POR_RAREZA legendario)
      armorSlots.slice(0, 4).forEach((s, i) => {
        if (s.modificador) {
          const label = s.subtipo ? `${s.modificador} (${s.subtipo})` : s.modificador
          payload[`slot_${i+1}`] = `${label}: ${s.valor}`
        }
      })
      slotsMejora.forEach((s, i) => {
        if (s.tipo) payload[`mejora_${i+1}`] = `${s.tipo}: ${s.valor}`
      })
    }

    if (esProyectil) {
      // Daño base de la flecha (siempre tipo Físico)
      if (danos[0]?.min || danos[0]?.max) {
        payload.dano_tipo_1 = 'Físico'
        payload.dano_min_1  = danos[0].min ? parseInt(danos[0].min) : null
        payload.dano_max_1  = danos[0].max ? parseInt(danos[0].max) : null
      }
      // Modificadores — máx 4 (legendario)
      proyectilSlots.slice(0, 4).forEach((s, i) => {
        if (s.modificador) {
          const label = s.subtipo ? `${s.modificador} (${s.subtipo})` : s.modificador
          payload[`slot_${i+1}`] = `${label}: ${s.valor}`
        }
      })
    }

    if (categoria === 'gemas_magicas' && gemaStandalone.tipo && gemaStandalone.valor) {
      const isPercent = gemaStandalone.tipo !== 'daño'
      const subtipo = gemaStandalone.subtipo ? ` (${gemaStandalone.subtipo})` : ''
      payload.slot_1 = `${GEMA_LABEL[gemaStandalone.tipo]}${subtipo}: +${gemaStandalone.valor}${isPercent ? '%' : ''}`
    }

    const { error: insertError } = await supabase.from('listings').insert(payload)
    if (insertError) {
      console.error('[listings insert error]', insertError)
      setError(insertError.message)
      setLoading(false)
      return
    }
    router.push('/market')
  }

  return (
    <div style={{padding:'24px 20px', display:'flex', justifyContent:'center'}}>
      {/* CropModal — se muestra cuando cropSlotId está seteado */}
      {cropSlotId && (() => {
        const slot = imageSlots.find(s => s.id === cropSlotId)
        if (!slot) return null
        return (
          <CropModal
            src={slot.previewUrl}
            onConfirm={async (blob) => {
              const croppedUrl = URL.createObjectURL(blob)
              setImageSlots(prev => prev.map(s => s.id === cropSlotId
                ? { ...s, croppedBlob: blob, previewUrl: croppedUrl }
                : s
              ))
              setCropSlotId(null)
              // OCR corre después del crop
              await ejecutarOCRSlot(cropSlotId, blob)
            }}
            onCancel={() => {
              // Si el slot no tiene crop previo, eliminarlo al cancelar
              setImageSlots(prev => {
                const slot = prev.find(s => s.id === cropSlotId)
                if (slot && !slot.croppedBlob) {
                  URL.revokeObjectURL(slot.previewUrl)
                  return prev.filter(s => s.id !== cropSlotId)
                }
                return prev
              })
              setCropSlotId(null)
            }}
          />
        )
      })()}

      <div style={{background:'var(--dark-card)', border:'1px solid var(--dark-border)', borderRadius:12, padding:28, width:'100%', maxWidth:800}}>
        <h1 className="cinzel" style={{fontSize:20, color:'var(--gold)', marginBottom:24}}>
          {type === 'sell' ? '🗡 Publicar Venta' : '🛡 Publicar Búsqueda'}
        </h1>

        {/* ── ZONA DE IMÁGENES (multi-slot) ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            Array.from(e.target.files || []).forEach(file => agregarImagen(file))
            e.target.value = ''
          }}
        />

        <div onPaste={handlePaste} tabIndex={0} style={{ marginBottom: 24 }}>
          {/* Estado OCR de la imagen principal */}
          {imageSlots.length > 0 && (
            <div style={{ marginBottom: 10, minHeight: 22 }}>
              {analizando ? (
                <p style={{ fontSize: 13, color: 'var(--gold)', margin: 0 }}>🔍 Analizando con IA...</p>
              ) : errorAnalisis ? (
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>⚠ {errorAnalisis}</p>
              ) : imageSlots[0]?.ocrStatus === 'done' ? (
                <p style={{ fontSize: 13, color: '#5BC98B', margin: 0 }}>✅ Campos completados — revisá y ajustá si es necesario</p>
              ) : null}
            </div>
          )}

          {/* Grid de slots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(imageSlots.length + (imageSlots.length < maxSlots ? 1 : 0), maxSlots)}, 1fr)`,
            gap: 10,
          }}>
            {imageSlots.map((slot, idx) => (
              <div key={slot.id} style={{
                position: 'relative', borderRadius: 8, overflow: 'hidden',
                border: `2px solid ${idx === 0 ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                aspectRatio: '1',
                background: '#0f0d0a',
              }}>
                <img
                  src={slot.previewUrl}
                  alt={`Imagen ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Badge primaria */}
                {idx === 0 && (
                  <span className="cinzel" style={{
                    position: 'absolute', top: 5, left: 5,
                    fontSize: 8, padding: '2px 6px', borderRadius: 4, letterSpacing: 1,
                    background: 'rgba(201,168,76,0.85)', color: '#1a1208', fontWeight: 700,
                  }}>PRINCIPAL</span>
                )}
                {/* Badge OCR status */}
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  fontSize: 12,
                  filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                }}>
                  {slot.ocrStatus === 'running' ? '⏳' : slot.ocrStatus === 'done' ? '✅' : slot.ocrStatus === 'error' ? '⚠' : ''}
                </span>
                {/* Acciones hover */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <button
                    onClick={() => setCropSlotId(slot.id)}
                    style={{
                      background: 'rgba(201,168,76,0.15)', border: '1px solid var(--gold-dark)',
                      color: 'var(--gold)', padding: '4px 10px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    }}
                  >✂ Recortar</button>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(slot.previewUrl)
                      setImageSlots(prev => prev.filter(s => s.id !== slot.id))
                    }}
                    style={{
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                      color: '#f87171', padding: '4px 10px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    }}
                  >× Quitar</button>
                </div>
              </div>
            ))}

            {/* Slot vacío: agregar imagen */}
            {imageSlots.length < maxSlots && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  aspectRatio: imageSlots.length === 0 ? 'auto' : '1',
                  height: imageSlots.length === 0 ? 72 : 'auto',
                  width: '100%',
                  borderRadius: 8,
                  border: '2px dashed var(--dark-border)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex',
                  flexDirection: imageSlots.length === 0 ? 'row' : 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: imageSlots.length === 0 ? 10 : 6,
                  color: 'var(--text-muted)', transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-dark)'; e.currentTarget.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {imageSlots.length === 0 ? (
                  <>
                    <span style={{ fontSize: 22 }}>📷</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="cinzel" style={{ fontSize: 10, letterSpacing: 1 }}>CARGÁ SCREENSHOT</span>
                      <span style={{ fontSize: 11 }}>o pegá con <strong style={{ color: 'var(--gold)' }}>Ctrl+V</strong></span>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>+</span>
                    <span style={{ fontSize: 10 }}>{maxSlots - imageSlots.length} más</span>
                  </>
                )}
              </button>
            )}
          </div>

          {imageSlots.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
              {imageSlots.length}/{maxSlots} imagen{imageSlots.length !== 1 ? 'es' : ''}{isSet ? ` · Podés subir hasta ${maxSlots} para el carrusel` : ''} · Pasá el cursor sobre una para recortar o quitar
            </p>
          )}
        </div>
        {/* TIPO */}
        <div style={{marginBottom:16}}>
          <label style={lbl}>Tipo de publicación</label>
          <div style={{display:'flex', gap:8}}>
            {(['sell','buy'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex:1, padding:10, borderRadius:8, cursor:'pointer', fontFamily:"'Cinzel',serif", fontSize:11,
                border:`1px solid ${type===t?(t==='sell'?'#2E7D52':'#1E4A7A'):'var(--dark-border)'}`,
                background:type===t?(t==='sell'?'rgba(46,125,82,0.2)':'rgba(30,74,122,0.2)'):'var(--dark-surface)',
                color:type===t?(t==='sell'?'#5BC98B':'#5B9BDF'):'var(--text-muted)',
              }}>
                {t === 'sell' ? '🗡 Tengo para vender' : '🛡 Quiero comprar'}
              </button>
            ))}
          </div>
        </div>

        {/* TOGGLE SET */}
        <div style={{marginBottom:20}}>
          <label style={lbl}>Formato</label>
          <div style={{display:'flex', gap:8}}>
            {[
              { val: false, icon: '⚔', label: 'Ítem único' },
              { val: true,  icon: '📦', label: 'Paquete / Set' },
            ].map(opt => (
              <button key={String(opt.val)} onClick={() => setIsSet(opt.val)} style={{
                flex:1, padding:'10px 8px', borderRadius:8, cursor:'pointer',
                fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:0.5,
                border:`1px solid ${isSet===opt.val ? 'rgba(139,92,246,0.7)' : 'var(--dark-border)'}`,
                background: isSet===opt.val ? 'rgba(139,92,246,0.15)' : 'var(--dark-surface)',
                color: isSet===opt.val ? '#C4B5FD' : 'var(--text-muted)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                <span style={{fontSize:15}}>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
          {isSet && (
            <p style={{fontSize:12, color:'var(--text-muted)', marginTop:8, fontStyle:'italic'}}>
              En la descripción listá los ítems incluidos. Ej: "Pechera del Dragón, Yelmo del Dragón, Botas del Dragón"
            </p>
          )}
        </div>

        {/* ─── FORMULARIO COMPLETO (ítem único) ─── */}
        {!isSet && (<>

        {/* Aviso campos requeridos según foto */}
        {imageSlots.length === 0 && (
          <div style={{
            padding:'8px 14px', borderRadius:8, marginBottom:16,
            background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.25)',
            fontSize:12, color:'#f87171',
          }}>
            ℹ Sin foto, los campos marcados con <strong>*</strong> son obligatorios.
            Subí un screenshot para completarlos automáticamente.
          </div>
        )}
        {imageSlots.length > 0 && (
          <div style={{
            padding:'8px 14px', borderRadius:8, marginBottom:16,
            background:'rgba(91,201,139,0.07)', border:'1px solid rgba(91,201,139,0.2)',
            fontSize:12, color:'#5BC98B',
          }}>
            ✅ Con foto, solo el precio es obligatorio. Los demás campos son opcionales.
          </div>
        )}

        {/* CATEGORÍA */}
        {secTitle(imageSlots.length === 0 ? 'CATEGORÍA *' : 'CATEGORÍA (opcional)')}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16}}>
          {CATEGORIAS.map(c => (
            <button key={c.val} onClick={() => { setCategoria(c.val); setSubcategoria(''); setClase('todas') }} style={{
              padding:'10px 6px', borderRadius:8, cursor:'pointer', textAlign:'center',
              border:`1px solid ${categoria===c.val?'var(--gold)':'var(--dark-border)'}`,
              background:categoria===c.val?'rgba(201,168,76,0.12)':'var(--dark-surface)',
              color:categoria===c.val?'var(--gold)':'var(--text-muted)',
            }}>
              <div style={{fontSize:20, marginBottom:4}}>{c.icon}</div>
              <div style={{fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:0.5}}>{c.label}</div>
            </button>
          ))}
        </div>

        {/* CLASE */}
        {categoria && (esArma || esArmadura || esProyectil) && (
          <>
            {secTitle('CLASE')}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
              <div>
                <label style={lbl}>Clase requerida</label>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {CLASES.map(c => (
                    <button key={c} onClick={() => { setClase(c); setSubclase('todas'); setSubcategoria('') }}
                      style={pillBtn(clase===c)}>{CLASE_LABEL[c]}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Subclase requerida</label>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {SUBCLASES[clase]?.map(s => (
                    <button key={s} onClick={() => setSubclase(s)} style={pillBtn(subclase===s)}>{SUBCLASE_LABEL[s]}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Subcategoría</label>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {subcatsDisponibles.map(s => (
                  <button key={s} onClick={() => setSubcategoria(s)} style={pillBtn(subcategoria===s)}>
                    {SUBCATEGORIA_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SUBCATEGORÍA SIMPLES */}
        {esSimple && (
          <div style={{marginBottom:16}}>
            <label style={lbl}>Subcategoría</label>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {(SUBCATS_SIMPLES[categoria] || []).map(s => (
                <button key={s} onClick={() => setSubcategoria(s)} style={pillBtn(subcategoria===s)}>
                  {SUBCATEGORIA_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BONIFICACIÓN DE GEMA */}
        {categoria === 'gemas_magicas' && subcategoria && (
          <>
            {secTitle('BONIFICACIÓN DE LA GEMA')}
            <div style={{marginBottom:12}}>
              <label style={lbl}>Tipo de bonificación</label>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {(['daño','velocidad_ataque','velocidad_invocacion','chance_critico'] as const).map(t => (
                  <button key={t} onClick={() => setGemaStandalone({tipo:t,subtipo:'',valor:''})}
                    style={pillBtn(gemaStandalone.tipo === t)}>
                    {GEMA_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {gemaStandalone.tipo === 'daño' && (
              <div style={{marginBottom:12}}>
                <label style={lbl}>Tipo de daño</label>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {GEMA_ELEMENTOS.map(s => (
                    <button key={s} onClick={() => setGemaStandalone({...gemaStandalone, subtipo:s})}
                      style={pillBtn(gemaStandalone.subtipo === s, GEMA_ELEMENTO_COLOR[s])}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gemaStandalone.tipo && (
              <div style={{marginBottom:12}}>
                <label style={lbl}>
                  Valor {gemaStandalone.tipo === 'daño'
                    ? `— número plano (máx. ${GEMA_MAX[gemaStandalone.tipo]})`
                    : `— porcentaje (máx. ${GEMA_MAX[gemaStandalone.tipo]}%)`}
                </label>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{color:'var(--gold)', fontSize:16}}>+</span>
                  <input style={{...inp, width:100}} type="number" min="1"
                    max={GEMA_MAX[gemaStandalone.tipo]}
                    placeholder={String(GEMA_MAX[gemaStandalone.tipo])}
                    value={gemaStandalone.valor}
                    onChange={e => {
                      const v = Math.min(parseInt(e.target.value) || 0, GEMA_MAX[gemaStandalone.tipo])
                      setGemaStandalone({...gemaStandalone, valor: v > 0 ? String(v) : ''})
                    }}/>
                  {gemaStandalone.tipo !== 'daño' && <span style={{color:'var(--text-muted)'}}>%</span>}
                  <span style={{fontSize:11, color:'var(--text-muted)'}}>máx. {GEMA_MAX[gemaStandalone.tipo]}{gemaStandalone.tipo !== 'daño' ? '%' : ''}</span>
                </div>
                {gemaStandalone.tipo && gemaStandalone.valor && (
                  <div style={{marginTop:8, padding:'8px 12px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:8, fontSize:13, color:'#5BC98B'}}>
                    Preview: <strong>{GEMA_LABEL[gemaStandalone.tipo]}{gemaStandalone.subtipo ? ` (${gemaStandalone.subtipo})` : ''}: +{gemaStandalone.valor}{gemaStandalone.tipo !== 'daño' ? '%' : ''}</strong>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ÍTEM BASE */}
        {subcategoria && (
          <>
            {secTitle('ÍTEM')}
            {itemBases.length > 0 ? (
              <div style={{marginBottom:12}}>
                <label style={lbl}>Seleccionar ítem</label>
                <select style={{...inp, cursor:'pointer'}} value={itemBaseId} onChange={e => {
                  const id = e.target.value
                  setItemBaseId(id)
                  if (esSimple) {
                    const base = itemBases.find((b: any) => b.id === id)
                    setDesc((base?.descripcion || '').replace(/\\n|\n/g, '\n'))
                  }
                }}>
                  <option value="">— Escribir nombre manualmente —</option>
                  {itemBases.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                {!itemBaseId && <>
                  <datalist id="nombres-historicos-select">
                    {nombresHistoricos.map((n, i) => <option key={i} value={n} />)}
                  </datalist>
                  <input
                    style={{...inp, marginTop:8}} placeholder="Nombre del ítem..."
                    list="nombres-historicos-select"
                    value={itemNombreManual} onChange={e => setItemNombreManual(e.target.value)}
                  />
                </>}
                {/* Preview de stats para joyería */}
                {esSimple && itemBaseId && (() => {
                  const base = itemBases.find((b: any) => b.id === itemBaseId)
                  if (!base?.descripcion) return null
                  return (
                    <div style={{
                      marginTop: 8, padding: '10px 14px',
                      background: 'rgba(201,168,76,0.06)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      borderRadius: 8,
                    }}>
                      {base.descripcion.split('\n').map((stat: string, i: number) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8 }}>
                          <span style={{ color: 'var(--gold)', marginRight: 6 }}>◆</span>{stat}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <label style={lbl}>Nombre del ítem</label>
                <datalist id="nombres-historicos-simple">
                  {nombresHistoricos.map((n, i) => <option key={i} value={n} />)}
                </datalist>
                <input style={inp} placeholder="Escribí el nombre del ítem..."
                  list="nombres-historicos-simple"
                  value={itemNombreManual} onChange={e => setItemNombreManual(e.target.value)}/>
              </div>
            )}

            {/* MATERIAL ESTADO RAREZA */}
            {(esArma || esArmadura) && (
              <>
                {secTitle('MATERIAL Y CALIDAD')}
                {esArma && (
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Material</label>
                    <select style={{...inp, cursor:'pointer'}} value={material} onChange={e => setMaterial(e.target.value)}>
                      <option value="">Seleccionar material...</option>
                      {getMateriales(subcategoria, clase).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                {esArmadura && (
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Material</label>
                    <input style={inp} placeholder="Ej: Tela fina, Aleación de Acero..."
                      value={material} onChange={e => setMaterial(e.target.value)}/>
                  </div>
                )}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
                  <div>
                    <label style={lbl}>Estado</label>
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {ESTADOS.map(e => (
                        <button key={e} onClick={() => setEstado(e)} style={pillBtn(estado===e)}>{ESTADO_LABEL[e]}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>
                      Rareza / Color
                      {imageSlots.length === 0
                        ? <span style={{color:'#EF4444', fontSize:9, marginLeft:4}}>*</span>
                        : <span style={{color:'var(--text-muted)', fontSize:9, marginLeft:4}}>(opc.)</span>}
                    </label>
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {RAREZAS.map(r => (
                        <button key={r} onClick={() => setRareza(r)} style={pillBtn(rareza===r, RAREZA_COLOR[r])}>
                          {RAREZA_LABEL[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STATS PROYECTILES — daño base */}
            {esProyectil && (
              <>
                {secTitle('DAÑO BASE')}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
                  <div>
                    <label style={lbl}>Daño mínimo</label>
                    <input style={inp} type="number" placeholder="Ej: 49"
                      value={danos[0]?.min || ''}
                      onChange={e => setDanos([{tipo:'Físico', min:e.target.value, max:danos[0]?.max||''}])}/>
                  </div>
                  <div>
                    <label style={lbl}>Daño máximo</label>
                    <input style={inp} type="number" placeholder="Ej: 67"
                      value={danos[0]?.max || ''}
                      onChange={e => setDanos([{tipo:'Físico', min:danos[0]?.min||'', max:e.target.value}])}/>
                  </div>
                </div>
              </>
            )}

            {/* RAREZA PROYECTILES */}
            {esProyectil && (
              <>
                {secTitle(imageSlots.length === 0 ? 'RAREZA *' : 'RAREZA (opcional)')}
                <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:16}}>
                  {RAREZAS.map(r => (
                    <button key={r} onClick={() => setRareza(r)} style={pillBtn(rareza===r, RAREZA_COLOR[r])}>
                      {RAREZA_LABEL[r]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* MODIFICADORES PROYECTIL */}
            {esProyectil && rareza && rareza !== 'normal' && numProyectilSlots > 0 && (
              <>
                {secTitle(`MODIFICADORES (${numProyectilSlots})`)}
                <p style={{fontSize:12, color:'var(--text-muted)', marginTop:-8, marginBottom:12, fontStyle:'italic'}}>
                  🏹 Modificadores de flecha — igual que arcos. Sin velocidades de ataque/invocación/movimiento.
                </p>
                {Array.from({length: numProyectilSlots}).map((_, i) => (
                  <SlotProyectil key={i} index={i} rareza={rareza}
                    value={proyectilSlots[i] || {modificador:'',valor:'',subtipo:''}}
                    onChange={(v) => { const ns=[...proyectilSlots]; ns[i]=v; setProyectilSlots(ns) }}
                    usados={proyectilSlots.filter((_,j) => j!==i).map(s => s?.modificador).filter(Boolean)}
                  />
                ))}
              </>
            )}

            {/* STATS ARMAS */}
            {esArma && (
              <>
                {secTitle('ESTADÍSTICAS DEL ARMA')}
                <label style={lbl}>Daño base (hasta 3 tipos)</label>
                {danos.map((d, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center'}}>
                    <select style={{...inp, cursor:'pointer'}} value={d.tipo}
                      onChange={e => { const nd=[...danos]; nd[i].tipo=e.target.value; setDanos(nd) }}>
                      <option value="">Tipo de daño...</option>
                      {TIPOS_DANO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input style={inp} type="number" placeholder="Mín" value={d.min}
                      onChange={e => { const nd=[...danos]; nd[i].min=e.target.value; setDanos(nd) }}/>
                    <input style={inp} type="number" placeholder="Máx" value={d.max}
                      onChange={e => { const nd=[...danos]; nd[i].max=e.target.value; setDanos(nd) }}/>
                    {i > 0 && (
                      <button onClick={() => setDanos(danos.filter((_,j) => j!==i))} style={{
                        background:'none', border:'1px solid rgba(226,75,74,0.3)', color:'#E24B4A',
                        borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12,
                      }}>✕</button>
                    )}
                  </div>
                ))}
                {danos.length < 3 && (
                  <button onClick={() => setDanos([...danos,{tipo:'',min:'',max:''}])} style={{
                    background:'none', border:'1px solid var(--dark-border)', color:'var(--text-muted)',
                    borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, marginBottom:16, fontFamily:'inherit',
                  }}>+ Agregar tipo de daño</button>
                )}

                <div style={{marginBottom:12}}>
                  <label style={lbl}>Bonus (+XX)</label>
                  {bonusAutoFound ? (
                    <div style={{background:'rgba(46,125,82,0.1)', border:'1px solid rgba(46,125,82,0.4)', borderRadius:8, padding:'8px 14px', fontSize:14, color:'#5BC98B'}}>
                      ✅ Calculado automáticamente: <strong>+{bonusXX}</strong>
                    </div>
                  ) : (
                    <div>
                      <input style={inp} type="number" placeholder="Ingresar manualmente..."
                        value={bonusManual} onChange={e => setBonusManual(e.target.value)}/>
                      {material && estado && rareza && rareza !== 'normal' && rareza !== 'especial' && (
                        <p style={{fontSize:12, color:'var(--text-muted)', marginTop:4, fontStyle:'italic'}}>
                          ⚠ Combinación no encontrada — ingresá el valor manualmente
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
                  <div>
                    <label style={lbl}>Velocidad de ataque</label>
                    <div style={{display:'flex', gap:6}}>
                      {VELOCIDADES.map(v => (
                        <button key={v} onClick={() => setVelocidad(v)} style={pillBtn(velocidad===v)}>
                          {VELOCIDAD_LABEL[v]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Rango</label>
                    {clase === 'guerrero' ? (
                      <div style={{background:'var(--dark-surface)', border:'1px solid var(--dark-border)', borderRadius:8, padding:'8px 12px', color:'var(--text-muted)', fontSize:14}}>
                        {subcategoria === 'lanzas' ? '2 (predefinido)' : '1 (predefinido)'}
                      </div>
                    ) : (
                      <div style={{display:'flex', gap:6}}>
                        {['20','25','30'].map(v => (
                          <button key={v} onClick={() => setRango(v)} style={pillBtn(rango===v)}>{v}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* MODIFICADORES ARMA */}
                {rareza && rareza !== 'normal' && numWeaponSlots > 0 && (
                  <>
                    {secTitle(`MODIFICADORES (${numWeaponSlots})`)}
                    {weaponSlots.map((s, i) => (
                      <SlotArma key={i} index={i} subcategoria={subcategoria} rareza={rareza} clase={clase}
                        value={s || {modificador:'',valor:'',subtipo:''}}
                        onChange={(v) => { const ns=[...weaponSlots]; ns[i]=v; setWeaponSlots(ns) }}
                        usados={weaponSlots.filter((_,j) => j!==i).map(s => s?.modificador).filter(Boolean)}
                      />
                    ))}
                  </>
                )}

                {/* MUESCA */}
                {secTitle('MUESCA')}
                <div style={{background:'var(--dark-surface)', border:'1px solid var(--dark-border)', borderRadius:8, padding:12, marginBottom:10}}>
                  <label style={lbl}>Estado de la muesca</label>
                  <div style={{display:'flex', gap:6, marginBottom:12}}>
                    {MUESCA_TIPOS.map(t => (
                      <button key={t} onClick={() => setMuesca({tipo:t,gema_tipo:'',gema_valor:'',gema_subtipo:''})} style={pillBtn(muesca.tipo===t)}>
                        {MUESCA_LABEL[t]}
                      </button>
                    ))}
                  </div>
                  {muesca.tipo === 'gema' && (
                    <>
                      <label style={lbl}>Tipo de gema</label>
                      <div style={{display:'flex', gap:6, marginBottom:12, flexWrap:'wrap'}}>
                        {GEMA_TIPOS.map(t => (
                          <button key={t} onClick={() => setMuesca({...muesca, gema_tipo:t, gema_valor:'', gema_subtipo:''})} style={pillBtn(muesca.gema_tipo===t)}>
                            {GEMA_LABEL[t]}
                          </button>
                        ))}
                      </div>
                      {muesca.gema_tipo === 'daño' && (
                        <div style={{marginBottom:12}}>
                          <label style={lbl}>Tipo de daño de la gema</label>
                          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                            {[...DANO_FISICO_SUBTIPOS, ...DANO_MAGICO_SUBTIPOS].map(s => {
                              const col: Record<string,string> = {Cortante:'#F87171',Punzante:'#FB923C',Aplastante:'#A78BFA',Fuego:'#F97316',Hielo:'#38BDF8',Electricidad:'#FDE047'}
                              return (
                                <button key={s} onClick={() => setMuesca({...muesca, gema_subtipo:s})} style={pillBtn(muesca.gema_subtipo===s, col[s])}>
                                  {s}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {muesca.gema_tipo && (
                        <>
                          <label style={lbl}>Valor {muesca.gema_tipo === 'daño' ? '(10-15)' : '(5%-7%)'}</label>
                          <div style={{display:'flex', gap:6}}>
                            {muesca.gema_tipo === 'daño'
                              ? [10,11,12,13,14,15].map(n => (
                                <button key={n} onClick={() => setMuesca({...muesca, gema_valor:String(n)})} style={pillBtn(muesca.gema_valor===String(n))}>{n}</button>
                              ))
                              : ['5%','6%','7%'].map(v => (
                                <button key={v} onClick={() => setMuesca({...muesca, gema_valor:v})} style={pillBtn(muesca.gema_valor===v)}>{v}</button>
                              ))
                            }
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* STATS ARMADURAS */}
            {esArmadura && (
              <>
                {secTitle('ESTADÍSTICAS DE ARMADURA')}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
                  <div>
                    <label style={lbl}>Armadura base</label>
                    <input style={inp} type="number" placeholder="Ej: 220" value={armaduraBase} onChange={e => setArmaduraBase(e.target.value)}/>
                  </div>
                  <div>
                    <label style={lbl}>Bonus (+XX)</label>
                    <input style={inp} type="number" placeholder="Ej: 5" value={armaduraBonus} onChange={e => setArmaduraBonus(e.target.value)}/>
                  </div>
                </div>

                {secTitle('RESISTENCIAS')}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--gold)', letterSpacing:1, marginBottom:10}}>⚔ FÍSICAS</div>
                    {['cortante','punzante','aplastante'].map(r => (
                      <div key={r} style={{marginBottom:10}}>
                        <label style={lbl}>{RESIST_ICON[r]} {RESIST_LABEL[r]}</label>
                        <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                          {['muy_mala','mala','normal','buena','muy_buena'].map(c => (
                            <button key={c} onClick={() => setResistencias(p=>({...p,[r]:p[r]===c?'':c}))} style={{
                              flex:1, padding:'4px 2px', borderRadius:4, cursor:'pointer', fontSize:11, fontFamily:'inherit', whiteSpace:'nowrap',
                              border:`1px solid ${resistencias[r]===c?CALIDAD_COLOR[c]:'var(--dark-border)'}`,
                              background:resistencias[r]===c?`${CALIDAD_COLOR[c]}22`:'var(--dark-surface)',
                              color:resistencias[r]===c?CALIDAD_COLOR[c]:'var(--text-muted)',
                            }}>{CALIDAD_LABEL[c]}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif", fontSize:11, color:'var(--gold)', letterSpacing:1, marginBottom:10}}>✨ MÁGICAS</div>
                    {['fuego','hielo','electrico'].map(r => (
                      <div key={r} style={{marginBottom:10}}>
                        <label style={lbl}>{RESIST_ICON[r]} {RESIST_LABEL[r]}</label>
                        <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                          {['muy_mala','mala','normal','buena','muy_buena'].map(c => (
                            <button key={c} onClick={() => setResistencias(p=>({...p,[r]:p[r]===c?'':c}))} style={{
                              flex:1, padding:'4px 2px', borderRadius:4, cursor:'pointer', fontSize:11, fontFamily:'inherit', whiteSpace:'nowrap',
                              border:`1px solid ${resistencias[r]===c?CALIDAD_COLOR[c]:'var(--dark-border)'}`,
                              background:resistencias[r]===c?`${CALIDAD_COLOR[c]}22`:'var(--dark-surface)',
                              color:resistencias[r]===c?CALIDAD_COLOR[c]:'var(--text-muted)',
                            }}>{CALIDAD_LABEL[c]}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {rareza && rareza !== 'normal' && numArmorMods > 0 && (
                  <>
                    {secTitle(`MODIFICADORES DEL ÍTEM (${numArmorMods})`)}
                    {Array.from({length:numArmorMods}).map((_,i) => (
                      <SlotArmadura key={i} index={i} subcategoria={subcategoria} rareza={rareza} clase={clase}
                        value={armorSlots[i] || {modificador:'',valor:'',subtipo:''}}
                        onChange={(v) => { const ns=[...armorSlots]; ns[i]=v; setArmorSlots(ns) }}
                        usados={armorSlots.filter((_,j) => j!==i).map(s => s?.modificador).filter(Boolean)}
                      />
                    ))}
                  </>
                )}

                {numSlotsMejora > 0 && (
                  <>
                    {secTitle(`SLOTS DE MEJORA (${numSlotsMejora})`)}
                    {slotsMejora.map((s, i) => (
                      <div key={i} style={{background:'var(--dark-surface)', border:'1px solid var(--dark-border)', borderRadius:8, padding:12, marginBottom:10}}>
                        <span style={{fontFamily:"'Cinzel',serif", fontSize:10, color:'var(--gold)', letterSpacing:1, display:'block', marginBottom:8}}>MEJORA {i+1}</span>
                        <div style={{marginBottom:8}}>
                          <label style={lbl}>Tipo de daño</label>
                          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                            {DANO_MEJORA.map(d => (
                              <button key={d} onClick={() => { const ns=[...slotsMejora]; ns[i]={...ns[i],tipo:d}; setSlotsMejora(ns) }}
                                style={pillBtn(s.tipo===d)}>{DANO_MEJORA_LABEL[d]}</button>
                            ))}
                          </div>
                        </div>
                        {s.tipo && (
                          <div>
                            <label style={lbl}>Valor</label>
                            <div style={{display:'flex', gap:8}}>
                              {['1%','2%'].map(v => (
                                <button key={v} onClick={() => { const ns=[...slotsMejora]; ns[i]={...ns[i],valor:v}; setSlotsMejora(ns) }}
                                  style={{...pillBtn(s.valor===v), flex:1}}>{v}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
            {secTitle('REINO')}
              <div style={{display:'flex', gap:8, marginBottom:16}}>
                {['alsius','syrtis','ignis'].map(r => (
                  <button key={r} onClick={() => setReino(r)} style={{
                    flex:1, padding:'12px 6px', borderRadius:8, cursor:'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:1,
                    border:`1px solid ${reino===r ? (r==='alsius'?'#5B9BDF':r==='syrtis'?'#5BC98B':'#EF4444') : 'var(--dark-border)'}`,
                    background:reino===r ? (r==='alsius'?'rgba(91,155,223,0.15)':r==='syrtis'?'rgba(91,201,139,0.15)':'rgba(239,68,68,0.15)') : 'var(--dark-surface)',
                    color:reino===r ? (r==='alsius'?'#5B9BDF':r==='syrtis'?'#5BC98B':'#EF4444') : 'var(--text-muted)',
                  }}>
                    <img src={`/${r}.png`} alt={r} style={{width:32, height:32, objectFit:'contain'}} />
                <div>{r === 'alsius' ? 'Alsius' : r === 'syrtis' ? 'Syrtis' : 'Ignis'}</div>
                  </button>
                ))}
              </div>
        </>)} {/* fin subcategoria */}
        </>)} {/* fin !isSet */}

        {/* ─── FORMULARIO SIMPLIFICADO (paquete/set) ─── */}
        {isSet && (<>
          {/* Nombre */}
          <div style={{marginBottom:16}}>
            <label style={lbl}>
              Nombre del set
              {imageSlots.length === 0
                ? <span style={{color:'#EF4444', fontSize:10}}> * requerido</span>
                : <span style={{color:'var(--text-muted)', fontSize:10}}> (recomendado)</span>}
            </label>
            <input style={inp} placeholder="Ej: Set del Dragón Completo"
              value={itemNombreManual} onChange={e => setItemNombreManual(e.target.value)}/>
          </div>

          {/* Ítems y descripción */}
          {secTitle('ÍTEMS DEL SET')}
          <div style={{marginBottom:16}}>
            <label style={lbl}>
              Listado de ítems y estadísticas
              {imageSlots.length === 0
                ? <span style={{color:'#EF4444', fontSize:10}}> * requerido sin foto</span>
                : <span style={{color:'var(--text-muted)', fontSize:10}}> (opcional con foto)</span>}
            </label>
            <textarea
              style={{...inp, resize:'vertical', minHeight:140, lineHeight:1.6}}
              placeholder={
                '- Pechera del Dragón (Épica) — 850 Armor, +3 Fuerza\n' +
                '- Yelmo del Dragón (Épica) — 420 Armor\n' +
                '- Botas del Dragón (Épica) — 380 Armor, +2 Vel. mov.\n\n' +
                'Incluí nombre, rareza y stats clave de cada pieza.'
              }
              value={desc} onChange={e => setDesc(e.target.value)}
            />
          </div>

          {secTitle('RAREZA DEL SET (opcional)')}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:16}}>
            {RAREZAS.map(r => (
              <button key={r} onClick={() => setRareza(rareza === r ? '' : r)}
                style={{...pillBtn(rareza===r, RAREZA_COLOR[r])}}>
                <span style={{color: RAREZA_COLOR[r]}}>{RAREZA_LABEL[r]}</span>
              </button>
            ))}
          </div>
          {secTitle('REINO (opcional)')}
          <div style={{display:'flex', gap:8, marginBottom:16}}>
            {['alsius','syrtis','ignis'].map(r => (
              <button key={r} onClick={() => setReino(reino === r ? '' : r)} style={{
                flex:1, padding:'12px 6px', borderRadius:8, cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:1,
                border:`1px solid ${reino===r ? (r==='alsius'?'#5B9BDF':r==='syrtis'?'#5BC98B':'#EF4444') : 'var(--dark-border)'}`,
                background:reino===r ? (r==='alsius'?'rgba(91,155,223,0.15)':r==='syrtis'?'rgba(91,201,139,0.15)':'rgba(239,68,68,0.15)') : 'var(--dark-surface)',
                color:reino===r ? (r==='alsius'?'#5B9BDF':r==='syrtis'?'#5BC98B':'#EF4444') : 'var(--text-muted)',
              }}>
                <img src={`/${r}.png`} alt={r} style={{width:32, height:32, objectFit:'contain'}} />
                <div>{r === 'alsius' ? 'Alsius' : r === 'syrtis' ? 'Syrtis' : 'Ignis'}</div>
              </button>
            ))}
          </div>
        </>)}

            {/* DESCRIPCIÓN (solo ítems únicos) + PRECIO */}
            {!isSet && (<>
              {secTitle('DESCRIPCIÓN')}
              <div style={{marginBottom:12}}>
                <label style={lbl}>Descripción <span style={{color:'var(--text-muted)', fontSize:10}}>(opcional)</span></label>
                <textarea style={{...inp, resize:'vertical', minHeight:80}}
                  placeholder="Describí el ítem o lo que buscás..."
                  value={desc} onChange={e => setDesc(e.target.value)}/>
              </div>
            </>)}
            {secTitle('PRECIO *')}
            <div style={{marginBottom:14}}>
              <label style={lbl}>🪨 Magnanitas</label>
              <input style={inp} type="number" placeholder="Ej: 10"
                value={priceMagnanitas} onChange={e => setPriceMagnanitas(e.target.value)}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={lbl}>Dinero real</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
                <input style={inp} type="number" placeholder="Ej: 2500"
                  value={priceReal} onChange={e => setPriceReal(e.target.value)}/>
                <select style={{...inp, width:90, cursor:'pointer'}} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  {userCurrency && userCurrency !== 'ARS' && userCurrency !== 'USD' && (
                    <option value={userCurrency}>{userCurrency}</option>
                  )}
                </select>
              </div>
              <p style={{fontSize:11, color:'var(--text-muted)', marginTop:4, fontStyle:'italic'}}>
                Al menos uno de los dos es obligatorio. Podés combinar ambos.
              </p>
            </div>
            {error && <p style={{color:'#E24B4A', fontSize:13, marginBottom:12}}>{error}</p>}
            <div style={{display:'flex', gap:8}}>
              <button onClick={() => setShowPreview(true)} style={{
                flex:1, padding:'12px 0', borderRadius:8, cursor:'pointer',
                background:'none', border:'1px solid var(--gold)',
                color:'var(--gold)', fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:1,
              }}>
                👁 VISTA PREVIA
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex:2, padding:'12px 0', borderRadius:8, cursor:loading?'not-allowed':'pointer',
                background:type==='sell'?'linear-gradient(135deg, #1a5c35, #2E7D52)':'linear-gradient(135deg, #0f2d52, #1E4A7A)',
                color:'white', border:'none',
                fontFamily:"'Cinzel',serif", fontSize:13, letterSpacing:1, fontWeight:700,
              }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Spinner size={16} color="#fff" />
                    {loadingMsg || 'Publicando...'}
                  </span>
                ) : (type==='sell' ? '🗡 PUBLICAR VENTA' : '🛡 PUBLICAR BÚSQUEDA')}
              </button>
            </div>

            {/* ── Modal de Vista Previa ─────────────────────────────── */}
            {showPreview && (
              <div style={{
                position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000,
                display:'flex', alignItems:'center', justifyContent:'center', padding:20,
              }} onClick={() => setShowPreview(false)}>
                <div style={{
                  background:'var(--dark-bg)', border:'1px solid var(--gold)',
                  borderRadius:14, padding:24, maxWidth:340, width:'100%', position:'relative',
                }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPreview(false)} style={{
                    position:'absolute', top:12, right:14,
                    background:'none', border:'none', color:'var(--text-muted)',
                    cursor:'pointer', fontSize:20, lineHeight:1, padding:0,
                  }}>✕</button>

                  <p className="cinzel" style={{fontSize:11, color:'var(--text-muted)', letterSpacing:2, marginBottom:16, textAlign:'center'}}>
                    ASÍ SE VERÁ TU PUBLICACIÓN
                  </p>

                  {/* Card preview */}
                  <div style={{
                    background:'var(--dark-card)', border:`1px solid var(--dark-border)`,
                    borderRadius:10, overflow:'hidden',
                  }}>
                    {/* Imagen principal */}
                    <div style={{
                      width:'100%', height:130, background:'var(--dark-surface)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      position:'relative', overflow:'hidden',
                    }}>
                      <span style={{
                        position:'absolute', top:8, left:8, padding:'2px 8px', borderRadius:4,
                        fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:1, fontWeight:700, zIndex:2,
                        background:type==='sell'?'rgba(46,125,82,0.9)':'rgba(30,74,122,0.9)',
                        color:type==='sell'?'#8EEDB3':'#8BC0F0',
                      }}>
                        {type==='sell'?'VENDE':'BUSCA'}
                      </span>
                      {imageSlots[0]?.previewUrl
                        ? <img src={imageSlots[0].previewUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain',padding:8}}/>
                        : <span style={{fontSize:40}}>{isSet?'📦':categoria==='armas'?'⚔':categoria==='armaduras'?'🛡':categoria==='joyeria'?'💍':categoria==='gemas_magicas'?'💎':'📦'}</span>
                      }
                    </div>
                    {/* Strip de fotos adicionales (sets) */}
                    {imageSlots.length > 1 && (
                      <div style={{
                        display:'flex', gap:4, padding:'6px 8px',
                        background:'var(--dark-surface)', borderTop:'1px solid var(--dark-border)',
                        overflowX:'auto',
                      }}>
                        {imageSlots.map((slot, i) => (
                          <img key={slot.id} src={slot.previewUrl} alt=""
                            style={{
                              width:44, height:44, objectFit:'cover', borderRadius:5, flexShrink:0,
                              border:`1px solid ${i===0?'var(--gold)':'var(--dark-border)'}`,
                              opacity: i===0 ? 1 : 0.7,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {/* Info */}
                    <div style={{padding:'10px 12px'}}>
                      <div className="cinzel" style={{fontSize:12, color:'var(--gold)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {itemNombreManual || '(sin nombre)'}
                      </div>
                      {desc && (
                        <div style={{fontSize:11, color:'#5BC98B', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {desc}
                        </div>
                      )}
                      <div style={{borderTop:'1px solid var(--dark-border)', paddingTop:6}}>
                        <div style={{color:'var(--gold)', fontSize:12, fontWeight:600}}>
                          {priceMagnanitas ? `🪨 ${parseInt(priceMagnanitas).toLocaleString('es-AR')} Magnanitas` : ''}
                          {priceMagnanitas && priceReal ? '  ·  ' : ''}
                          {priceReal ? `$ ${parseFloat(priceReal).toLocaleString('es-AR')} ${currency}` : ''}
                          {!priceMagnanitas && !priceReal ? 'Precio a convenir' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => { setShowPreview(false); handleSubmit() }} disabled={loading} style={{
                    width:'100%', marginTop:14, padding:'12px 0', borderRadius:8,
                    cursor:loading?'not-allowed':'pointer',
                    background:type==='sell'?'linear-gradient(135deg,#1a5c35,#2E7D52)':'linear-gradient(135deg,#0f2d52,#1E4A7A)',
                    color:'white', border:'none',
                    fontFamily:"'Cinzel',serif", fontSize:13, letterSpacing:1, fontWeight:700,
                  }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Spinner size={16} color="#fff" />
                        {loadingMsg || 'Publicando...'}
                      </span>
                    ) : (type==='sell'?'🗡 PUBLICAR VENTA':'🛡 PUBLICAR BÚSQUEDA')}
                  </button>
                </div>
              </div>
            )}
      </div>
    </div>
  )
}

export default function NuevoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>}>
      <NuevoPageContent />
    </Suspense>
  )
}
