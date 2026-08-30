'use client'

import { useRef, useState } from 'react'

/** Envoltorio "click y arrastrá para moverte" sobre un contenedor con
 *  scroll (mismo gesto que ya funciona con el dedo en celular/tablet,
 *  pero para mouse en desktop). Distingue arrastre de click real por
 *  distancia recorrida: si el mouse no se movió más de unos px entre
 *  mousedown/mouseup, se deja pasar el click normal (links de jugador,
 *  botones de organizador, etc.) — si sí hubo arrastre, se cancela ese
 *  click para no disparar una navegación no buscada.
 *
 *  `header` (opcional): fila de encabezados que se queda pegada arriba
 *  al scrollear verticalmente, sincronizada horizontalmente con el
 *  contenido. Va AFUERA del div con `overflow-x: auto` a propósito —
 *  cualquier ancestro con scroll horizontal activo pasa a ser "el
 *  contenedor de scroll más cercano" para efectos de `position: sticky`
 *  de sus descendientes, así que un header sticky DENTRO de ese div
 *  nunca llega a clavarse contra la ventana real (se probó en vivo: al
 *  sacarle el overflow-x al div, el sticky pasaba a funcionar bien —
 *  confirma que es este mecanismo y no otra cosa). Por eso el header
 *  vive en su propio div (sin overflow propio) y se sincroniza a mano
 *  con `scrollLeft` del contenido vía `onScroll`, en vez de heredarlo
 *  gratis por estar adentro del mismo contenedor. */
export default function DragScroll({ children, style, header }: { children: React.ReactNode; style?: React.CSSProperties; header?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    x: number; y: number; scrollLeft: number; scrollTop: number; moved: boolean
    // El bracket suele ser más alto que ancho: el eje horizontal
    // desborda ESTE div (scrollea local), pero el vertical no — el div
    // crece a la altura de su contenido y es la PÁGINA la que scrollea.
    // Se detecta por eje, una sola vez al empezar el arrastre, cuál de
    // los dos realmente tiene overflow ahí — si no, se mueve la ventana.
    localX: boolean; localY: boolean
  } | null>(null)
  // El evento "click" llega DESPUÉS de mouseup, cuando `drag` ya se
  // limpió — este flag sobrevive un tick más para que onClickCapture
  // todavía sepa si hubo arrastre real antes de resetearse solo.
  const justDragged = useRef(false)
  const [dragging, setDragging] = useState(false)

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    justDragged.current = false
    const localX = el.scrollWidth > el.clientWidth
    const localY = el.scrollHeight > el.clientHeight
    drag.current = {
      x: e.clientX, y: e.clientY,
      scrollLeft: localX ? el.scrollLeft : window.scrollX,
      scrollTop: localY ? el.scrollTop : window.scrollY,
      moved: false, localX, localY,
    }
    setDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) d.moved = true
    if (!d.moved) return
    if (d.localX) el.scrollLeft = d.scrollLeft - dx
    if (d.localY) el.scrollTop = d.scrollTop - dy
    if (!d.localX || !d.localY) {
      window.scrollTo(
        d.localX ? window.scrollX : d.scrollLeft - dx,
        d.localY ? window.scrollY : d.scrollTop - dy,
      )
    }
  }

  const endDrag = () => {
    if (drag.current?.moved) justDragged.current = true
    drag.current = null
    setDragging(false)
  }

  // capture: se ejecuta antes que el click del hijo (link/botón) — si
  // hubo arrastre real, lo cancela ahí mismo.
  const onClickCapture = (e: React.MouseEvent) => {
    if (justDragged.current) { e.preventDefault(); e.stopPropagation(); justDragged.current = false }
  }

  // Único punto de sincronización del header: se dispara para CUALQUIER
  // causa de scroll horizontal (mi arrastre, que asigna `scrollLeft` a
  // mano; pero también scroll nativo con trackpad/rueda/shift, que mi
  // drag handler ni se entera) — moverlo por `ref` en vez de estado de
  // React para no re-renderizar en cada pixel.
  const onScroll = () => {
    if (ref.current && headerInnerRef.current) {
      headerInnerRef.current.style.transform = `translateX(${-ref.current.scrollLeft}px)`
    }
  }

  return (
    <div style={header ? { display: 'flex', flexDirection: 'column' } : undefined}>
      {header && (
        <div style={{
          position: 'sticky', top: 60, zIndex: 5, overflow: 'hidden',
          background: 'var(--bg-base)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div ref={headerInnerRef}>{header}</div>
        </div>
      )}
      <div
        ref={ref}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
        onScroll={onScroll}
        style={{ ...style, cursor: dragging ? 'grabbing' : 'grab', userSelect: dragging ? 'none' : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
