'use client'
import { useState, useMemo, useRef, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { CLASE_ICON } from '@/lib/constants'
import type { Clase } from '@/lib/types'

interface Equipo { id: string; nombre: string; clase?: Clase | null }

function iconoClase(clase?: Clase | null) {
  return (clase && CLASE_ICON[clase]) || '🎉'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Paleta cíclica para las porciones de la ruleta — colores del sitio,
// alternados para que porciones vecinas siempre se distingan.
const PALETA = ['#d4af37', '#5b8fd4', '#8b3a3a', '#3a8b5f', '#8b5fd4', '#d47c37']

const DURACION_GIRO_MS = 4200
const DURACION_REVEAL_MS = 7000 // cuánto queda el nombre ganador en pantalla antes de pasar al siguiente

function truncar(nombre: string, max: number) {
  return nombre.length > max ? nombre.slice(0, max - 1) + '…' : nombre
}

/** Sonidos sintetizados con Web Audio — sin archivos externos que
 *  descargar ni licenciar. El AudioContext recién se crea al primer
 *  click (los navegadores no dejan arrancar audio sin un gesto del
 *  usuario), así que no hace falta ningún setup previo. */
let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}
function tono(freq: number, duracion: number, tipo: OscillatorType, volumen: number, delaySeg = 0) {
  const ctx = getAudioCtx()
  if (!ctx) return
  const t0 = ctx.currentTime + delaySeg
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = tipo
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volumen, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duracion)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duracion)
}
const sonidoInicio = () => { tono(220, 0.12, 'triangle', 0.1); tono(330, 0.14, 'triangle', 0.08, 0.05) }
const sonidoTick = () => tono(750, 0.04, 'square', 0.06)
const sonidoGanador = () => { tono(523.25, 0.16, 'sine', 0.14); tono(659.25, 0.16, 'sine', 0.14, 0.12); tono(783.99, 0.32, 'sine', 0.16, 0.24) }

/** Ruleta tipo "sorteo en vivo" (estilo app-sorteos.com) — cada porción es
 *  un equipo todavía no ubicado. Al girar, siempre "cae" en `pool[0]`
 *  (el orden ya se decidió una sola vez al mezclar al entrar a la
 *  pantalla — la ruleta es la puesta en escena visual de un sorteo que
 *  ya es justo de antemano, no una fuente de aleatoriedad nueva). Al
 *  terminar el giro, ese equipo se saca del pool y la rueda se vuelve a
 *  dibujar con una porción menos para el próximo giro. Se gira tocando
 *  la rueda directamente (sin botón aparte). */
function Ruleta({ pool, spinning, onGirar, size = 480 }: { pool: Equipo[]; spinning: boolean; onGirar: () => void; size?: number }) {
  const [rotation, setRotation] = useState(0)
  const n = pool.length
  const hubRadius = size / 480 * 34
  const outerLimit = size / 2 - 16

  // El nombre arranca cerca del centro y se extiende hacia afuera usando
  // TODO el largo disponible de la porción (como una porción de pizza
  // real) — nada de centrarlo cerca del borde, que era lo que dejaba un
  // hueco vacío enorme del lado del centro. El único límite real es que,
  // cerca del centro, la porción es angosta (el arco crece con el radio):
  // si el nombre arrancara demasiado pegado al centro, su alto (el grosor
  // de la letra) no entraría en el ángulo de la porción ahí y pisaría a
  // la de al lado. `innerRadius` es el radio mínimo al que el grosor de
  // letra elegido ya entra en el ángulo de esa porción; con pocos equipos
  // (porciones anchas) da un valor chico y el nombre casi llega al
  // centro, con muchos da uno más grande.
  const { fontSize, innerRadius, maxChars } = useMemo(() => {
    const escala = size / 480
    if (n === 0) return { fontSize: 12 * escala, innerRadius: hubRadius + 10, maxChars: 10 }
    const sliceAngleRad = (2 * Math.PI) / n
    const fs = (n > 24 ? 12 : n > 16 ? 14 : n > 8 ? 16 : n > 4 ? 18 : 20) * escala
    const inner = Math.max(hubRadius + 10, fs / (sliceAngleRad * 0.5))
    const largoDisponible = Math.max(10, outerLimit - inner)
    const anchoPorChar = fs * 0.58 // aprox. para Inter bold
    const mc = Math.max(3, Math.floor(largoDisponible / anchoPorChar))
    return { fontSize: fs, innerRadius: inner, maxChars: mc }
  }, [n, outerLimit, size, hubRadius])

  const conic = useMemo(() => {
    if (n === 0) return PALETA[0]
    const stops = pool.map((_, i) => {
      const from = (i / n) * 100
      const to = ((i + 1) / n) * 100
      return `${PALETA[i % PALETA.length]} ${from}% ${to}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [pool, n])

  const girar = () => {
    if (spinning || n === 0) return
    const sliceAngle = 360 / n
    const targetSliceCenter = sliceAngle / 2 // pool[0] siempre es la porción 0
    const normalizedTarget = (360 - targetSliceCenter) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    let delta = normalizedTarget - currentMod
    if (delta <= 0) delta += 360
    const extraTurns = n === 1 ? 0 : 6
    const totalDelta = extraTurns * 360 + delta
    setRotation(rotation + totalDelta)

    sonidoInicio()
    // Tics que se van espaciando hacia el final (como una ruleta física
    // frenando) — la cantidad real de "porciones cruzadas" puede ser muy
    // alta (cientos con muchos equipos), así que se acota a un máximo
    // para no saturar de sonido ni de timers.
    const numTicks = Math.min(60, Math.max(1, Math.round(totalDelta / sliceAngle)))
    for (let i = 1; i <= numTicks; i++) {
      const t = DURACION_GIRO_MS * Math.pow(i / numTicks, 2.2)
      setTimeout(sonidoTick, t)
    }

    onGirar()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{ position: 'relative', width: size, height: size, cursor: spinning || n === 0 ? 'default' : 'pointer' }}
        onClick={girar}
        role="button"
        aria-label="Girar la ruleta"
      >
        {/* Puntero fijo arriba */}
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent',
          borderTop: '18px solid var(--gold)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))', pointerEvents: 'none',
        }} />
        {/* Rueda */}
        <div
          style={{
            width: size, height: size, borderRadius: '50%', position: 'relative',
            background: conic, border: '4px solid var(--gold)', boxShadow: '0 0 30px rgba(212,175,55,0.25), inset 0 0 20px rgba(0,0,0,0.3)',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${DURACION_GIRO_MS - 200}ms cubic-bezier(0.12, 0.67, 0.15, 1)` : 'none',
          }}
        >
          {pool.map((team, i) => {
            const mid = (i + 0.5) * (360 / n)
            return (
              <div
                key={team.id}
                style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, transform: `rotate(${mid - 90}deg)` }}
              >
                {/* Texto radial "a lo largo de la porción" (como una
                    porción de pizza: el nombre corre del centro hacia el
                    borde, no cruzado). Una sola rotación (mid - 90) en
                    este contenedor de tamaño 0 hace que su eje horizontal
                    ya apunte "hacia afuera" en la dirección de esta
                    porción. El nombre queda ANCLADO por su extremo
                    exterior (siempre termina cerca del borde dorado,
                    como una franja pareja alrededor de toda la rueda) y
                    crece hacia el centro según su largo — al revés de
                    anclarlo por el extremo interior, que dejaba un salto
                    irregular en el borde según cada nombre. Mismo
                    criterio que app-sorteos.com: al girar despacio se
                    leen de corrido, y en la mitad izquierda quedan "boca
                    abajo" (mismo efecto que en la referencia). */}
                <span style={{
                  position: 'absolute', left: outerLimit, top: 0, transform: 'translate(-100%, -50%)',
                  fontFamily: 'var(--font-sans)', fontSize, fontWeight: 800, color: '#0a0a0a',
                  whiteSpace: 'nowrap', letterSpacing: 0.1,
                }}>
                  {truncar(team.nombre, maxChars)}
                </span>
              </div>
            )
          })}
          {/* Centro */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: hubRadius * 2, height: hubRadius * 2, borderRadius: '50%', background: 'var(--bg-card)', border: '3px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: hubRadius * 0.82,
          }}>
            🎲
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 0.5, minHeight: 18 }}>
        {spinning ? 'Girando…' : n === 0 ? '' : '👆 Tocá la ruleta para girar'}
      </div>
    </div>
  )
}

/** Animación de reveal del ganador — glow pulsante + confetti disparado
 *  hacia afuera + nombre que entra con rebote (spring easing) y un
 *  brillo dorado que recorre el texto. Clickeable en cualquier parte
 *  para saltear la espera y pasar directo al próximo giro. */
function RevealGanador({ equipo, onSkip }: { equipo: Equipo; onSkip: () => void }) {
  const particulas = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const angulo = (i / 20) * 360 + (Math.random() * 14 - 7)
    const distancia = 85 + Math.random() * 75
    const color = PALETA[i % PALETA.length]
    const tam = 5 + Math.random() * 5
    const delay = Math.random() * 0.12
    const dur = 0.85 + Math.random() * 0.45
    return { id: i, angulo, distancia, color, tam, delay, dur }
  }), [])

  return (
    <div
      onClick={onSkip}
      title="Click para continuar"
      style={{ position: 'relative', cursor: 'pointer', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Glow pulsante detrás del nombre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: 260, height: 260, marginLeft: -130, marginTop: -130,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0) 72%)',
        animation: 'ganadorGlow 1.7s ease-out infinite', pointerEvents: 'none',
      }} />
      {/* Confetti disparado desde el centro */}
      {particulas.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute', top: '50%', left: '50%', width: p.tam, height: p.tam,
            borderRadius: p.id % 2 === 0 ? '50%' : 2, background: p.color, pointerEvents: 'none',
            ['--ang' as any]: `${p.angulo}deg`, ['--dist' as any]: `${p.distancia}px`,
            animation: `confettiBurst ${p.dur}s ease-out ${p.delay}s forwards`,
            opacity: 0,
          } as CSSProperties}
        />
      ))}
      <div style={{ fontSize: 38, animation: 'iconoPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
        {iconoClase(equipo.clase)}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, letterSpacing: 0.5,
        backgroundImage: 'linear-gradient(100deg, #d4af37 15%, #fff6d8 45%, #d4af37 75%)',
        backgroundSize: '250% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        animation: 'nombrePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.16s both, brilloTexto 2.4s linear 0.75s infinite',
        marginTop: 4,
      }}>
        {equipo.nombre}
      </div>
      <div style={{
        height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        marginTop: 10, animation: 'lineaExpand 0.5s ease-out 0.42s both',
      }} />
      <div style={{
        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1,
        marginTop: 12, opacity: 0, animation: 'fadeInSuave 0.5s ease-out 1.1s forwards',
      }}>
        👆 CLICK PARA CONTINUAR
      </div>
    </div>
  )
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
  // de ahí en más solo se va revelando, no se vuelve a mezclar. La
  // ruleta gira sobre este mismo orden ya justo: siempre "cae" en el
  // primero del pool, la animación es la puesta en escena, no una nueva
  // fuente de azar.
  //
  // El mezclado NO puede ir en el inicializador de useState: esta
  // pantalla se renderiza primero en el servidor (para el HTML inicial)
  // y Math.random() da un resultado distinto ahí que en el cliente al
  // hidratar, rompiendo la hidratación de React (y con eso, los clicks
  // dejan de responder). Por eso arranca en el orden tal cual llega y
  // recién se mezcla en un efecto, que solo corre en el cliente.
  const [pool, setPool] = useState<Equipo[]>(equipos)
  useEffect(() => {
    setPool(shuffle(equipos))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [revelados, setRevelados] = useState<Equipo[]>([])
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState<Equipo | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')
  const poolAlEmpezarGiro = useRef<Equipo[]>(pool)
  const cajaRef = useRef<HTMLDivElement>(null)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)

  useEffect(() => {
    const onChange = () => setPantallaCompleta(document.fullscreenElement === cajaRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else cajaRef.current?.requestFullscreen()
  }

  const totalSlots = equipos.length
  const terminado = pool.length === 0 && revelados.length === totalSlots

  // Guarda el equipo que está "en cartel" y el timer que lo va a
  // despachar solo — así un click de "saltear" puede cancelar ese timer
  // y disparar el mismo despacho al toque, sin duplicar la lógica ni
  // arriesgarse a que se ejecuten los dos.
  const flashPendienteRef = useRef<Equipo | null>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const despacharFlash = (equipo: Equipo) => {
    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null }
    setRevelados(prev => [...prev, equipo])
    setFlash(null)
    flashPendienteRef.current = null
  }

  const saltarReveal = () => {
    if (flashPendienteRef.current) despacharFlash(flashPendienteRef.current)
  }

  const onGirar = () => {
    poolAlEmpezarGiro.current = pool
    setSpinning(true)
    setTimeout(() => {
      const [siguiente, ...resto] = poolAlEmpezarGiro.current
      sonidoGanador()
      setFlash(siguiente)
      flashPendienteRef.current = siguiente
      setPool(resto)
      setSpinning(false)
      revealTimeoutRef.current = setTimeout(() => despacharFlash(siguiente), DURACION_REVEAL_MS)
    }, DURACION_GIRO_MS)
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

      {/* Ruleta o resultado final */}
      <div
        ref={cajaRef}
        style={{
          background: pantallaCompleta ? '#0a0a0a' : 'var(--bg-card)',
          border: pantallaCompleta ? 'none' : '2px solid var(--border-gold)',
          borderRadius: pantallaCompleta ? 0 : 'var(--radius-lg)',
          padding: '32px 24px', textAlign: 'center', marginBottom: 28, minHeight: 580,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
          position: 'relative', width: pantallaCompleta ? '100vw' : 'auto', height: pantallaCompleta ? '100vh' : 'auto',
        }}
      >
        <button
          onClick={toggleFullscreen}
          title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 3,
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 8,
            color: 'var(--gold)', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
          }}
        >
          {pantallaCompleta ? '⤡' : '⤢'}
        </button>
        {flash ? (
          <RevealGanador key={flash.id} equipo={flash} onSkip={saltarReveal} />
        ) : terminado ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>
              Sorteo completo — todos los equipos ubicados
            </div>
          </div>
        ) : (
          <Ruleta pool={pool} spinning={spinning} onGirar={onGirar} size={pantallaCompleta ? 640 : 480} />
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
        @keyframes ganadorGlow {
          0%   { transform: scale(0.55); opacity: 0.9; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes confettiBurst {
          0%   { transform: translate(-50%, -50%) rotate(var(--ang)) translateY(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--ang)) translateY(calc(-1 * var(--dist))) scale(0.3); opacity: 0; }
        }
        @keyframes iconoPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          65%  { transform: scale(1.3) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes nombrePop {
          0%   { transform: scale(0.5) translateY(18px); opacity: 0; }
          65%  { transform: scale(1.08) translateY(-3px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes brilloTexto {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes lineaExpand {
          0%   { width: 0; }
          100% { width: 160px; }
        }
        @keyframes fadeInSuave {
          to { opacity: 0.8; }
        }
      `}</style>
    </main>
  )
}
