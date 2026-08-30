'use client'

import { useRef, useState } from 'react'

/** Envoltorio "click y arrastrá para moverte" sobre un contenedor con
 *  scroll (mismo gesto que ya funciona con el dedo en celular/tablet,
 *  pero para mouse en desktop). Distingue arrastre de click real por
 *  distancia recorrida: si el mouse no se movió más de unos px entre
 *  mousedown/mouseup, se deja pasar el click normal (links de jugador,
 *  botones de organizador, etc.) — si sí hubo arrastre, se cancela ese
 *  click para no disparar una navegación no buscada. */
export default function DragScroll({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
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

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClickCapture={onClickCapture}
      style={{ ...style, cursor: dragging ? 'grabbing' : 'grab', userSelect: dragging ? 'none' : undefined }}
    >
      {children}
    </div>
  )
}
