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
  const drag = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number; moved: boolean } | null>(null)
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
    drag.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, moved: false }
    setDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) d.moved = true
    if (d.moved) {
      el.scrollLeft = d.scrollLeft - dx
      el.scrollTop = d.scrollTop - dy
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
