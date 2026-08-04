import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: 'Demasiadas solicitudes. Esperá un momento.' }, { status: 429 })
  }
  try {
    const body = await req.json()
    if (!body?.texto || typeof body.texto !== 'string') {
      return NextResponse.json({ success: false, error: 'Texto inválido' }, { status: 400 })
    }
    const data = parsearTextoItem(body.texto)
    console.log('[OCR texto]', JSON.stringify(body.texto.substring(0, 800)))
    console.log('[OCR parsed]', JSON.stringify({
      nombre: data.nombre, categoria: data.categoria, subcategoria: data.subcategoria,
      rareza: data.rareza, estado: data.estado, material: data.material,
      danos: data.danos, bonus_xx: data.bonus_xx, modificadores: data.modificadores,
      muesca: data.muesca, gema_tipo: data.gema_tipo, gema_subtipo: data.gema_subtipo, gema_valor: data.gema_valor,
      clase: data.clase, velocidad: data.velocidad, rango: data.rango,
    }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Normaliza: minúsculas + sin acentos — comparaciones robustas contra OCR
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function parsearTextoItem(texto: string) {
  // Strip OCR artifacts: leading |, !, decorative chars from each line
  const lineas = texto.split('\n')
    .map((l: string) => l.trim().replace(/^[\|!\s]+/, '').replace(/[\|!\s]+$/, '').trim())
    .filter((l: string) => l.length > 0)

  const data: any = {
    nombre: '', categoria: '', subcategoria: '', material: '',
    estado: '', rareza: '', bonus_xx: null,
    armadura_base: null, armadura_bonus: null,
    resistencias: {}, danos: [], velocidad: null,
    rango: null, modificadores: [], muesca: 'sin_muesca',
    gema_tipo: null, gema_valor: null, gema_subtipo: null,
    clase: 'todas', subclase: 'todas'
  }

  // ── Nombre ──────────────────────────────────────────────────────
  // Solo la primera línea. Detener antes de Daño/Armadura/Categoría o línea con paréntesis.
  let nombreCompleto = ''
  for (let i = 0; i < lineas.length; i++) {
    const ln = norm(lineas[i])
    if (ln.match(/^da[nñ]o|^damage|^dafio|^dario|^bano|^armadura|^armor|^categor/)) break
    if (i > 0 && lineas[i].includes('(')) break
    if (i === 0) nombreCompleto = lineas[i]
  }
  // Quitar caracteres no-letra del inicio (íconos OCR como "Z", "®", "w", "» —")
  data.nombre = nombreCompleto.trim().replace(/^[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/, '').trim()

  // ── Bonus (+XX) ──────────────────────────────────────────────────
  for (const linea of lineas) {
    const m = linea.match(/\(\+(\d+)\)/)
    if (m) { data.bonus_xx = parseInt(m[1]); break }
  }

  // ── Texto completo normalizado (para búsquedas en todo el OCR) ───
  const textoNorm = norm(lineas.join(' '))
  const nombreNorm = norm(nombreCompleto)

  // ── Estado ───────────────────────────────────────────────────────
  // Bilingüe: español + inglés
  const estadosMap: [string, string][] = [
    ['maestre',    'maestre'],  ['masterwork', 'maestre'], ['master',   'maestre'],
    ['artesano',   'artesano'], ['artisan',    'artesano'],
    ['superior',   'superior'],
    ['mejorado',   'mejorado'], ['improved',   'mejorado'],
    ['gran ',      'gran'],     ['great ',     'gran'],
    ['comun',      'comun'],    ['common',     'comun'],
  ]
  for (const [key, val] of estadosMap) {
    if (textoNorm.includes(key)) { data.estado = val; break }
  }

  // ── Material ─────────────────────────────────────────────────────
  // Bilingüe, longest-first para evitar match parcial
  const materiales: [string, string][] = [
    ['lamina de xymerald',     'Lámina de Xymerald'],
    ['xymerald sheet',         'Lámina de Xymerald'],
    ['madera endurecida fina', 'Madera Endurecida Fina'],
    ['fine hardened wood',     'Madera Endurecida Fina'],
    ['madera endurecida',      'Madera Endurecida'],
    ['hardened wood',          'Madera Endurecida'],
    ['madera reforzada',       'Madera Reforzada'],
    ['reinforced wood',        'Madera Reforzada'],
    ['strengthened wood',      'Madera Reforzada'],
    ['aleacion de acero',      'Aleación de Acero'],
    ['steel alloy',            'Aleación de Acero'],
    ['acero fino',             'Acero Fino'],
    ['fine steel',             'Acero Fino'],
    ['xymerald',               'Xymerald'],
    ['tela fina',              'Tela Fina'],   ['fine cloth',  'Tela Fina'],
    ['tela blanda',            'Tela Blanda'], ['soft cloth',  'Tela Blanda'],
    ['hueso duro',             'Hueso Duro'],  ['hard bone',   'Hueso Duro'],
    ['cuero',                  'Cuero'],       ['leather',     'Cuero'],
    ['acero',                  'Acero'],       ['steel',       'Acero'],
  ]
  for (const [key, val] of materiales) {
    if (textoNorm.includes(key)) { data.material = val; break }
  }

  // ── Daño base ────────────────────────────────────────────────────
  const encontrarMinMax = (linea: string): { min: number; max: number } | null => {
    // Con guión normal/especial: "104-160", "104–160"
    const m1 = linea.match(/(\d{1,4})\s*[-–—]\s*(\d{1,4})/)
    if (m1) {
      const mn = parseInt(m1[1]), mx = parseInt(m1[2])
      if (mn < mx && mx < 10000) return { min: mn, max: mx }
    }
    // Dos números separados por espacio: "104 160"
    const m2 = linea.match(/\b(\d{2,4})\s{1,3}(\d{2,4})\b/)
    if (m2) {
      const mn = parseInt(m2[1]), mx = parseInt(m2[2])
      if (mn < mx && mx < 10000 && (mx - mn) >= 3) return { min: mn, max: mx }
    }
    // OCR concatenó los dos números sin guión: "104160" → 104 y 160
    const m3 = linea.match(/\b(\d{5,7})\b/)
    if (m3) {
      const s = m3[1]
      const mid = Math.floor(s.length / 2)
      for (const pos of [mid, mid + 1, mid - 1]) {
        if (pos < 2 || pos > s.length - 2) continue
        const mn = parseInt(s.slice(0, pos)), mx = parseInt(s.slice(pos))
        if (mn >= 10 && mn < mx && mx < 5000) return { min: mn, max: mx }
      }
    }
    return null
  }

  // Buscar línea de daño (español o inglés) y leer las siguientes 3 líneas
  for (let i = 0; i < lineas.length; i++) {
    const ln = norm(lineas[i])
    if (!ln.match(/^(da[nñ]o|damage|dafio|dario|bano)\s*(\(\+\d+\))?/)) continue
    for (let j = i; j <= Math.min(i + 3, lineas.length - 1); j++) {
      const r = encontrarMinMax(lineas[j])
      if (r) { data.danos.push({ tipo: 'Físico', min: r.min, max: r.max }); break }
    }
  }
  // Fallback: buscar "N-M" en todo el texto
  if (data.danos.length === 0) {
    for (const linea of lineas) {
      const r = encontrarMinMax(linea)
      if (r && r.min >= 5 && r.max >= 10) {
        data.danos.push({ tipo: 'Físico', min: r.min, max: r.max }); break
      }
    }
  }

  // ── Armadura ─────────────────────────────────────────────────────
  for (const linea of lineas) {
    const m = linea.match(/(\d+)\s*\(\+(\d+)\)/)
    const ln = norm(linea)
    if (m && (ln.includes('armadura') || ln.includes('armor'))) {
      data.armadura_base = parseInt(m[1])
      data.armadura_bonus = parseInt(m[2])
    }
  }

  // ── Categoría y subcategoría ─────────────────────────────────────
  for (let i = 0; i < lineas.length; i++) {
    const ln = norm(lineas[i])
    if (!ln.includes('categor')) continue
    // Strip "Categoría:" / "Category:" prefix — \w* absorbs "ia"/"ory"/etc.
    let cat = ln.replace(/^.*?categor\w*\s*[:\s]+\s*/i, '').trim()
    // OCR a veces separa "Categoría:" y el valor en dos líneas distintas
    if (!cat && i + 1 < lineas.length) {
      cat = norm(lineas[i + 1]).trim()
    }
    // Si cat sigue siendo toda la línea (regex no extrajo nada útil), también probar la línea siguiente
    if (cat === ln && i + 1 < lineas.length) {
      const next = norm(lineas[i + 1]).trim()
      if (!next.includes('categor')) cat = next
    }
    const mapa: [string, string, string][] = [
      // Español
      ['arcos largos',  'armas', 'arcos_largos'],
      ['arcos cortos',  'armas', 'arcos_cortos'],
      ['baculos',       'armas', 'baculos'],
      ['rapier',        'armas', 'rapier'],
      ['florin',        'armas', 'rapier'],
      ['espadas',       'armas', 'espadas'],
      ['lanzas',        'armas', 'lanzas'],
      ['hachas',        'armas', 'hachas'],
      ['martillos',     'armas', 'martillos'],
      ['mazos',         'armas', 'mazos'],
      ['garrotes',      'armas', 'garrotes'],
      ['tunicas',       'armaduras', 'tunicas'],
      ['yelmos',        'armaduras', 'yelmos'],
      ['pecheras',      'armaduras', 'pecheras'],
      ['hombreras',     'armaduras', 'hombreras'],
      ['guanteletes',   'armaduras', 'guanteletes'],
      ['perneras',      'armaduras', 'perneras'],
      ['sombreros',     'armaduras', 'sombreros'],
      ['brazaletes',    'armaduras', 'brazaletes'],
      ['guantes',       'armaduras', 'guantes'],
      ['escudos',       'armaduras', 'escudos'],
      ['flechas',       'proyectiles', 'flechas'],
      // Categorías simples — Español (más específico primero)
      ['gran gema magica',  'gemas_magicas', 'gran_gema_magica'],
      ['gema magica mayor', 'gemas_magicas', 'gema_magica_mayor'],
      ['gemas magicas',     'gemas_magicas', ''],
      ['gema magica',       'gemas_magicas', ''],
      ['gemas',             'gemas_magicas', ''],
      ['anillos',       'joyeria', 'anillos'],
      ['anilos',        'joyeria', 'anillos'],   // OCR: doble l → l
      ['amuletos',      'joyeria', 'amuletos'],
      ['amuleto',       'joyeria', 'amuletos'],
      ['joyeria',       'joyeria', ''],
      ['joyas',         'joyeria', ''],
      ['artesania',     'crafting', ''],
      ['crafting',      'crafting', ''],
      ['minerales',     'minerales', ''],
      ['magnanitas',    'minerales', 'magnanitas'],
      ['lingotes',      'minerales', 'lingotes'],
      // Categorías simples — Inglés
      ['great magic gem',  'gemas_magicas', 'gran_gema_magica'],
      ['magic gem major',  'gemas_magicas', 'gema_magica_mayor'],
      ['magic gems',       'gemas_magicas', ''],
      ['rings',         'joyeria', 'anillos'],
      ['amulets',       'joyeria', 'amuletos'],
      ['necklace',      'joyeria', 'amuletos'],
      ['jewelry',       'joyeria', ''],
      ['jewels',        'joyeria', ''],
      ['crafts',        'crafting', ''],
      ['minerals',      'minerales', ''],
      ['projectiles',   'proyectiles', ''],
      // Inglés
      ['long bows',     'armas', 'arcos_largos'],
      ['short bows',    'armas', 'arcos_cortos'],
      ['staffs',        'armas', 'baculos'],
      ['staves',        'armas', 'baculos'],
      ['swords',        'armas', 'espadas'],
      ['spears',        'armas', 'lanzas'],
      ['lances',        'armas', 'lanzas'],
      ['axes',          'armas', 'hachas'],
      ['hammers',       'armas', 'martillos'],
      ['maces',         'armas', 'mazos'],
      ['clubs',         'armas', 'garrotes'],
      ['robes',         'armaduras', 'tunicas'],
      ['tunics',        'armaduras', 'tunicas'],
      ['helmets',       'armaduras', 'yelmos'],
      ['helms',         'armaduras', 'yelmos'],
      ['breastplate',   'armaduras', 'pecheras'],
      ['chest',         'armaduras', 'pecheras'],
      ['pauldrons',     'armaduras', 'hombreras'],
      ['shoulders',     'armaduras', 'hombreras'],
      ['gauntlets',     'armaduras', 'guanteletes'],
      ['gloves',        'armaduras', 'guantes'],
      ['leggings',      'armaduras', 'perneras'],
      ['pants',         'armaduras', 'perneras'],
      ['shields',       'armaduras', 'escudos'],
      ['hats',          'armaduras', 'sombreros'],
      ['bracelets',     'armaduras', 'brazaletes'],
      ['arrows',        'proyectiles', 'flechas'],
    ]
    for (const [key, catVal, subVal] of mapa) {
      if (cat.includes(key)) { data.categoria = catVal; data.subcategoria = subVal; break }
    }
  }

  // ── Fallback: detectar categoría por nombre del ítem ────────────
  // Si el parser de categoría no encontró nada, inferir desde el nombre
  if (!data.categoria && nombreNorm) {
    // Usar includes en vez de ^ porque el OCR puede agregar chars antes del nombre
    if (nombreNorm.includes('anillo') || nombreNorm.includes('anilo'))          { data.categoria = 'joyeria';     data.subcategoria = 'anillos' }
    else if (nombreNorm.match(/amuleto|collar|colgante/))                       { data.categoria = 'joyeria';     data.subcategoria = 'amuletos' }
    else if (nombreNorm.match(/^espada|^mandoble|^sable/))     { data.categoria = 'armas';       data.subcategoria = 'espadas' }
    else if (nombreNorm.match(/^hacha|^hacha/))                { data.categoria = 'armas';       data.subcategoria = 'hachas' }
    else if (nombreNorm.match(/^lanza|^pica/))                 { data.categoria = 'armas';       data.subcategoria = 'lanzas' }
    else if (nombreNorm.match(/^mazo|^maza/))                  { data.categoria = 'armas';       data.subcategoria = 'mazos' }
    else if (nombreNorm.match(/^martillo/))                    { data.categoria = 'armas';       data.subcategoria = 'martillos' }
    else if (nombreNorm.match(/^garrote|^porra/))              { data.categoria = 'armas';       data.subcategoria = 'garrotes' }
    else if (nombreNorm.match(/^baculo|^baston/))              { data.categoria = 'armas';       data.subcategoria = 'baculos' }
    else if (nombreNorm.match(/^arco largo/))                  { data.categoria = 'armas';       data.subcategoria = 'arcos_largos' }
    else if (nombreNorm.match(/^arco corto|^arco/))            { data.categoria = 'armas';       data.subcategoria = 'arcos_cortos' }
    else if (nombreNorm.match(/^yelmo|^casco|^capucha/))       { data.categoria = 'armaduras';   data.subcategoria = 'yelmos' }
    else if (nombreNorm.match(/^pechera|^coraza|^tunica/))     { data.categoria = 'armaduras';   data.subcategoria = 'pecheras' }
    else if (nombreNorm.match(/^hombrera/))                    { data.categoria = 'armaduras';   data.subcategoria = 'hombreras' }
    else if (nombreNorm.match(/^guantelete/))                  { data.categoria = 'armaduras';   data.subcategoria = 'guanteletes' }
    else if (nombreNorm.match(/^guante/))                      { data.categoria = 'armaduras';   data.subcategoria = 'guantes' }
    else if (nombreNorm.match(/^pernera|^pantalon/))           { data.categoria = 'armaduras';   data.subcategoria = 'perneras' }
    else if (nombreNorm.match(/^escudo/))                      { data.categoria = 'armaduras';   data.subcategoria = 'escudos' }
    else if (nombreNorm.match(/^sombrero/))                    { data.categoria = 'armaduras';   data.subcategoria = 'sombreros' }
    else if (nombreNorm.match(/^brazalete/))                   { data.categoria = 'armaduras';   data.subcategoria = 'brazaletes' }
    else if (nombreNorm.match(/^flecha/))                      { data.categoria = 'proyectiles'; data.subcategoria = 'flechas' }
  }

  // ── Resistencias de armadura ─────────────────────────────────────
  // El juego muestra las resistencias SIN etiqueta de tipo, solo el valor de calidad,
  // en orden fijo: cortante, punzante, aplastante, fuego, hielo, eléctrico.
  // Aparecen entre la línea de "Armadura: X (+Y)" y la línea "Categoría:".
  // TAMBIÉN detecta con etiqueta si el OCR las lee con nombre.
  const resistMap: [string, string][] = [
    // "muy buena" ANTES que "buena" para evitar match parcial
    ['muy buena', 'muy_buena'], ['muybuena',  'muy_buena'],  // OCR sin espacio
    ['very good', 'muy_buena'], ['excelente', 'muy_buena'],
    ['buena',     'buena'],     ['good',      'buena'],
    // variantes OCR de "normal": "nomal" (falta r), "noma" (falta r+l), "norma"
    ['normal',    'normal'],    ['nomal',     'normal'],
    ['noma',      'normal'],    ['norma',     'normal'],    ['average',   'normal'],
    // "muy mala" ANTES que "mala"
    ['muy mala',  'muy_mala'], ['muymala',   'muy_mala'],   // OCR sin espacio
    ['very bad',  'muy_mala'], ['terrible',  'muy_mala'],
    ['mala',      'mala'],      ['bad',       'mala'],      ['poor',      'mala'],
  ]
  const resistOrden = ['cortante','punzante','aplastante','fuego','hielo','electrico']
  const resistKeywords: [string, string][] = [
    ['cortante','cortante'],['punzante','punzante'],['aplastante','aplastante'],
    ['fuego','fuego'],['hielo','hielo'],['electr','electrico'],
    ['slashing','cortante'],['piercing','punzante'],['crushing','aplastante'],
    ['fire','fuego'],['ice','hielo'],['cold','hielo'],['electric','electrico'],['lightning','electrico'],
  ]
  const esCalidad = (s: string) => resistMap.some(([k]) => s.includes(k))
  const toCalidad = (s: string) => { for (const [k,v] of resistMap) if (s.includes(k)) return v; return '' }

  // Intentar primero: con etiqueta de tipo (ej. "Resistencia cortante: Muy buena")
  let resistConEtiqueta = false
  for (let i = 0; i < lineas.length; i++) {
    const ln = norm(lineas[i])
    if (!ln.includes('resist')) continue
    let tipoKey = ''
    for (const [k, v] of resistKeywords) { if (ln.includes(k)) { tipoKey = v; break } }
    if (!tipoKey) continue
    const calidad = toCalidad(ln) || toCalidad(norm(lineas[i + 1] || ''))
    if (calidad) { data.resistencias[tipoKey] = calidad; resistConEtiqueta = true }
  }

  // Fallback posicional: sin etiqueta — leer 6 calidades entre armadura y categoría
  if (!resistConEtiqueta) {
    let idxArmadura = -1, idxCategoria = lineas.length
    for (let i = 0; i < lineas.length; i++) {
      const ln = norm(lineas[i])
      if (ln.match(/^armadura|^armor/) && idxArmadura === -1) idxArmadura = i
      if (ln.includes('categor') && idxArmadura !== -1)       { idxCategoria = i; break }
    }
    if (idxArmadura !== -1) {
      const bloque = lineas.slice(idxArmadura + 1, idxCategoria).map(norm)
      const calidades = bloque.filter(esCalidad)
      calidades.slice(0, 6).forEach((c, idx) => {
        const cal = toCalidad(c)
        if (cal) data.resistencias[resistOrden[idx]] = cal
      })
    }
  }

  // ── Velocidad ────────────────────────────────────────────────────
  for (const linea of lineas) {
    const ln = norm(linea)
    const esVelLine = ln.includes('velocidad de ataque') || ln.includes('attack speed')
    if (!esVelLine) continue
    if (ln.includes('muy lenta') || ln.includes('muylenta') || ln.includes('very slow')) data.velocidad = 'muy_lenta'
    else if (ln.includes('lenta') || ln.includes('slow'))     data.velocidad = 'lenta'
    else if (ln.includes('media') || ln.includes('medium'))   data.velocidad = 'media'
    else if (ln.includes('rapida') || ln.includes('fast') || ln.includes('quick')) data.velocidad = 'rapida'
  }
  // Fallback: velocidad en la siguiente línea después del label
  if (!data.velocidad) {
    for (let i = 0; i < lineas.length - 1; i++) {
      const ln = norm(lineas[i])
      if (!ln.includes('velocidad de ataque') && !ln.includes('attack speed')) continue
      const next = norm(lineas[i + 1])
      if (next.includes('muy lenta') || next.includes('muylenta') || next.includes('very slow')) data.velocidad = 'muy_lenta'
      else if (next.includes('lenta') || next.includes('slow'))   data.velocidad = 'lenta'
      else if (next.includes('media') || next.includes('medium')) data.velocidad = 'media'
      else if (next.includes('rapida') || next.includes('fast') || next.includes('quick')) data.velocidad = 'rapida'
    }
  }

  // ── Rango ────────────────────────────────────────────────────────
  for (const linea of lineas) {
    const ln = norm(linea)
    if (ln.startsWith('rango:') || ln.startsWith('range:')) {
      const m = linea.match(/\d+/)
      if (m) data.rango = parseInt(m[0])
    }
  }

  // ── Clase y subclase ─────────────────────────────────────────────
  for (const linea of lineas) {
    const ln = norm(linea)
    if (!ln.includes('requiere') && !ln.includes('requires')) continue
    if (ln.includes('caballero') || ln.includes('knight'))       { data.clase = 'guerrero'; data.subclase = 'caballero' }
    else if (ln.includes('barbaro') || ln.includes('barbarian')) { data.clase = 'guerrero'; data.subclase = 'barbaro' }
    else if (ln.includes('brujo') || ln.includes('warlock'))     { data.clase = 'mago'; data.subclase = 'brujo' }
    else if (ln.includes('conjurador') || ln.includes('conjurer') || ln.includes('summoner')) { data.clase = 'mago'; data.subclase = 'conjurador' }
    else if (ln.includes('cazador') || ln.includes('hunter'))    { data.clase = 'arquero'; data.subclase = 'cazador' }
    else if (ln.includes('tirador') || ln.includes('marksman'))  { data.clase = 'arquero'; data.subclase = 'tirador' }
    else if (ln.includes('guerrero') || ln.includes('warrior'))  data.clase = 'guerrero'
    else if (ln.includes('mago') || ln.includes('mage') || ln.includes('wizard')) data.clase = 'mago'
    else if (ln.includes('arquero') || ln.includes('archer'))    data.clase = 'arquero'
  }

  // ── Rareza ───────────────────────────────────────────────────────
  for (const linea of lineas) {
    const l = norm(linea)
    if (l.length > 20) continue
    if (l.includes('epic') || l.includes('epico') || l === 'epi' || l.startsWith('epi')) { data.rareza = 'epico'; break }
    if (l.includes('legendar'))                                   { data.rareza = 'legendario'; break }
    if (l.includes('magic') || l.includes('magico') || l.includes('magica')) { data.rareza = 'magico'; break }
    if (l.includes('special') || l === 'especial')                { data.rareza = 'especial'; break }
    if (l === 'normal')                                           { data.rareza = 'normal'; break }
  }

  // ── Modificadores ────────────────────────────────────────────────
  // Patrones en forma normalizada (sin acentos). Bilingüe: español + inglés.
  // Incluye variantes OCR: "Darío"→"Daño" (ñ→rí), "etico"→"crítico".
  // Orden importa: más específico primero para evitar match parcial.
  // [patron, nombreEnDB, subtipo]
  // Los daños físicos/mágicos se mapean al nombre del modificador en la DB + su subtipo
  const modPatrones: [string, string, string][] = [
    // Chance de crítico — siempre ANTES de "critical damage"
    ['critical chance',   'Chance de crítico', ''],
    ['chance de critico', 'Chance de crítico', ''],
    ['chance de etico',   'Chance de crítico', ''],
    ['chance de cco',     'Chance de crítico', ''],
    ['caiical chance',    'Chance de crítico', ''],
    ['crtical chance',    'Chance de crítico', ''],
    ['crtical',           'Chance de crítico', ''],
    // Daño aplastante → Daño físico + subtipo Aplastante
    ['crushing damage',  'Daño físico', 'Aplastante'],
    ['dano aplastante',  'Daño físico', 'Aplastante'],
    ['dario aplastante', 'Daño físico', 'Aplastante'],
    ['dafio aplastante', 'Daño físico', 'Aplastante'],
    ['bano aplastante',  'Daño físico', 'Aplastante'],
    // Daño punzante → Daño físico + subtipo Punzante
    ['piercing damage',  'Daño físico', 'Punzante'],
    ['dano punzante',    'Daño físico', 'Punzante'],
    ['dario punzante',   'Daño físico', 'Punzante'],
    ['dafio punzante',   'Daño físico', 'Punzante'],
    ['bano punzante',    'Daño físico', 'Punzante'],
    // Daño cortante → Daño físico + subtipo Cortante
    ['slashing damage',  'Daño físico', 'Cortante'],
    ['dano cortante',    'Daño físico', 'Cortante'],
    ['dario cortante',   'Daño físico', 'Cortante'],
    ['dafio cortante',   'Daño físico', 'Cortante'],
    ['bano cortante',    'Daño físico', 'Cortante'],
    // Daño físico genérico (sin subtipo especificado)
    ['physical damage',  'Daño físico', ''],
    ['dano fisico',      'Daño físico', ''],
    ['dario fisico',     'Daño físico', ''],
    ['dafio fisico',     'Daño físico', ''],
    ['bano fisico',      'Daño físico', ''],
    // Daño de fuego → Daño mágico + subtipo Fuego
    ['fire damage',      'Daño mágico', 'Fuego'],
    ['dano de fuego',    'Daño mágico', 'Fuego'],
    ['dario de fuego',   'Daño mágico', 'Fuego'],
    ['dafio de fuego',   'Daño mágico', 'Fuego'],
    ['bano de fuego',    'Daño mágico', 'Fuego'],
    // Daño de hielo → Daño mágico + subtipo Hielo
    ['ice damage',       'Daño mágico', 'Hielo'],
    ['cold damage',      'Daño mágico', 'Hielo'],
    ['dano de hielo',    'Daño mágico', 'Hielo'],
    ['dario de hielo',   'Daño mágico', 'Hielo'],
    ['dafio de hielo',   'Daño mágico', 'Hielo'],
    ['bano de hielo',    'Daño mágico', 'Hielo'],
    // Daño eléctrico → Daño mágico + subtipo Electricidad
    ['electrical damage','Daño mágico', 'Electricidad'],
    ['electric damage',  'Daño mágico', 'Electricidad'],
    ['dano electrico',   'Daño mágico', 'Electricidad'],
    ['dario electrico',  'Daño mágico', 'Electricidad'],
    ['dafio electrico',  'Daño mágico', 'Electricidad'],
    ['bano electrico',   'Daño mágico', 'Electricidad'],
    // Daño mágico genérico
    ['magic damage',     'Daño mágico', ''],
    ['dano magico',      'Daño mágico', ''],
    ['dario magico',     'Daño mágico', ''],
    ['dafio magico',     'Daño mágico', ''],
    ['bano magico',      'Daño mágico', ''],
    // Daño crítico
    ['critical damage',  'Daño crítico', ''],
    ['dano critico',     'Daño crítico', ''],
    ['dario critico',    'Daño crítico', ''],
    ['dafio critico',    'Daño crítico', ''],
    ['bano critico',     'Daño crítico', ''],
    // Velocidades
    ['movement speed',        'Velocidad de movimiento', ''],
    ['velocidad de movimiento','Velocidad de movimiento', ''],
    ['casting speed',         'Velocidad de invocación',  ''],
    ['invocation speed',      'Velocidad de invocación',  ''],
    ['velocidad de invocacion','Velocidad de invocación',  ''],
    ['attack speed',          'Velocidad de ataque', ''],
    ['velocidad de ataque',   'Velocidad de ataque', ''],
    // Atributos
    ['atributo de clase', 'Atributo de clase',  ''],
    ['resistir',          'Resistir',            ''],
    ['strength',   'Fuerza',         ''], ['fuerza',        'Fuerza',         ''],
    ['dexterity',  'Destreza',        ''], ['agility',       'Destreza',        ''], ['destreza','Destreza',''],
    ['constitution','Constitución',   ''], ['constitucion',  'Constitución',   ''],
    ['concentration','Concentración', ''], ['concentracion', 'Concentración',  ''],
    ['intelligence','Inteligencia',   ''], ['inteligencia',  'Inteligencia',   ''],
    ['evasion',    'Evasión',          ''],
    ['mana',       'Maná',             ''],
    ['health regen','Regenerar salud', ''], ['regenera',      'Regenerar salud', ''],
    ['salud',      'Salud',            ''], ['health',        'Salud',           ''],
    ['vida',       'Salud',            ''], ['hit points',    'Salud',           ''],
    ['mana regen', 'Regenerar maná',   ''], ['regenerar mana','Regenerar maná',  ''],
    ['defensa',    'Defensa',          ''], ['defense',       'Defensa',         ''],
  ]

  // Excluir líneas de gema/muesca (incluye variantes OCR de "daño")
  const esLineaGema = (ln: string) =>
    ln.includes('bonus de dano') || ln.includes('bonus de dafio') ||
    ln.includes('bonus de dario') || ln.includes('bonus de bano') ||
    ln.includes('damage bonus') ||
    ln.includes('muesca') || ln.includes('gema')

  for (const linea of lineas) {
    const ln = norm(linea)
    if (esLineaGema(ln)) continue
    for (const [patron, nombreNormalizado, subtipo] of modPatrones) {
      if (ln.includes(patron)) {
        const valorMatch = linea.match(/[+\-]?\d+%?/)
          || (/[»›»]/.test(linea) ? ['+1'] : null)
        if (valorMatch) {
          data.modificadores.push({ nombre: nombreNormalizado, valor: valorMatch[0], subtipo })
        }
        break
      }
    }
  }

  // ── Muesca / Gema ────────────────────────────────────────────────
  // Bilingüe: "Bonus de daño de X" (ES) / "X damage bonus" (EN)
  const bonusDanoGemaMap: [string, string][] = [
    // Español — variantes OCR incluidas (dafio=ñ→fi, dario=ñ→rí, bano=D→B)
    ['bonus de dano de fuego',         'Fuego'],
    ['bonus de dafio de fuego',        'Fuego'],
    ['bonus de dario de fuego',        'Fuego'],
    ['bonus de bano de fuego',         'Fuego'],
    ['bonus de dano de hielo',         'Hielo'],
    ['bonus de dafio de hielo',        'Hielo'],
    ['bonus de dario de hielo',        'Hielo'],
    ['bonus de bano de hielo',         'Hielo'],
    ['bonus de dano de electricidad',  'Electricidad'],
    ['bonus de dafio de electricidad', 'Electricidad'],
    ['bonus de dario de electricidad', 'Electricidad'],
    ['bonus de dano aplastante',       'Aplastante'],
    ['bonus de dafio aplastante',      'Aplastante'],
    ['bonus de dario aplastante',      'Aplastante'],
    ['bonus de dano punzante',         'Punzante'],
    ['bonus de dafio punzante',        'Punzante'],
    ['bonus de dario punzante',        'Punzante'],
    ['bonus de dano cortante',         'Cortante'],
    ['bonus de dafio cortante',        'Cortante'],
    ['bonus de dario cortante',        'Cortante'],
    // Inglés
    ['fire damage bonus',              'Fuego'],
    ['ice damage bonus',               'Hielo'],
    ['cold damage bonus',              'Hielo'],
    ['electrical damage bonus',        'Electricidad'],
    ['electric damage bonus',          'Electricidad'],
    ['crushing damage bonus',          'Aplastante'],
    ['piercing damage bonus',          'Punzante'],
    ['slashing damage bonus',          'Cortante'],
  ]

  for (const linea of lineas) {
    const ln = norm(linea)
    if (ln.includes('sin muesca') || ln.includes('no slot') || ln.includes('empty weapon slot')) {
      data.muesca = 'sin_muesca'
    } else if (ln.includes('muesca vac') || ln.includes('empty slot') || ln.includes('empty socket')) {
      data.muesca = 'vacia'
    } else {
      const gemaMatch = bonusDanoGemaMap.find(([p]) => ln.includes(p))
      if (gemaMatch) {
        const valMatch = linea.match(/[+\-]?\d+/)
        if (valMatch) {
          data.muesca = 'gema'
          data.gema_tipo = 'daño'
          data.gema_subtipo = gemaMatch[1]
          data.gema_valor = valMatch[0].replace(/^\+/, '')
        }
      } else if (ln.includes('gema') && (ln.includes('invocacion') || ln.includes('casting'))) {
        const valMatch = linea.match(/[+\-]?\d+/)
        if (valMatch) { data.muesca = 'gema'; data.gema_tipo = 'velocidad_invocacion'; data.gema_valor = valMatch[0].replace(/^\+/, '') }
      } else if (ln.includes('gema') && (ln.includes('velocidad') || ln.includes('speed'))) {
        const valMatch = linea.match(/[+\-]?\d+/)
        if (valMatch) { data.muesca = 'gema'; data.gema_tipo = 'velocidad_ataque'; data.gema_valor = valMatch[0].replace(/^\+/, '') }
      } else if (ln.includes('gema') && (ln.includes('dano') || ln.includes('dafio') || ln.includes('dario') || ln.includes('damage'))) {
        const valMatch = linea.match(/[+\-]?\d+/)
        if (valMatch) { data.muesca = 'gema'; data.gema_tipo = 'daño'; data.gema_valor = valMatch[0].replace(/^\+/, '') }
      }
    }
  }

  // ── Gema standalone (el ítem ES una gema, no tiene muesca) ─────────
  if (data.categoria === 'gemas_magicas') {
    const danosGemaStandalone: [string, string][] = [
      ['dano de fuego',        'Fuego'],   ['dafio de fuego',       'Fuego'],
      ['dano de hielo',        'Hielo'],   ['dafio de hielo',       'Hielo'],
      ['dano electrico',       'Electricidad'], ['dafio electrico',  'Electricidad'],
      ['dano de electricidad', 'Electricidad'],
      ['dano aplastante',      'Aplastante'], ['dafio aplastante',   'Aplastante'],
      ['dano punzante',        'Punzante'],   ['dafio punzante',     'Punzante'],
      ['dano cortante',        'Cortante'],   ['dafio cortante',     'Cortante'],
      ['fire damage',          'Fuego'],   ['ice damage',           'Hielo'],
      ['electric damage',      'Electricidad'], ['electrical damage','Electricidad'],
      ['crushing damage',      'Aplastante'], ['piercing damage',    'Punzante'],
      ['slashing damage',      'Cortante'],
    ]

    for (const linea of lineas) {
      const ln = norm(linea)
      const valMatch = linea.match(/\+\s*(\d+)/)
      if (!valMatch) continue

      if (ln.includes('chance de critico') || ln.includes('critical chance') || ln.includes('critico')) {
        data.gema_tipo = 'chance_critico'
        data.gema_valor = valMatch[1]
      } else if (ln.includes('velocidad de invocacion') || ln.includes('invocation speed') || ln.includes('casting speed')) {
        data.gema_tipo = 'velocidad_invocacion'
        data.gema_valor = valMatch[1]
      } else if ((ln.includes('velocidad de ataque') || ln.includes('attack speed')) && !ln.includes('invocacion')) {
        data.gema_tipo = 'velocidad_ataque'
        data.gema_valor = valMatch[1]
      } else {
        const danoMatch = danosGemaStandalone.find(([p]) => ln.includes(p))
        if (danoMatch) {
          data.gema_tipo = 'daño'
          data.gema_subtipo = danoMatch[1]
          data.gema_valor = valMatch[1]
        }
      }
    }
  }

  return data
}
