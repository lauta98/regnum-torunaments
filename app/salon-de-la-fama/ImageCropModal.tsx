'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

/** Modal de recorte: el usuario arrastra la imagen para posicionarla y
 * usa el control de zoom para acercar/alejar, dentro de un marco con la
 * proporción final (cuadrado para foto de campeón, ancho para banner de
 * torneo). Al confirmar exporta exactamente lo que se ve en el marco. */
export default function ImageCropModal({
  file, aspectRatio, onConfirm, onCancel,
}: {
  file: File
  aspectRatio: number // width / height del marco final
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // top-left de la imagen relativo al marco, en px
  const [busy, setBusy] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const FRAME_W = 340
  const FRAME_H = Math.round(FRAME_W / aspectRatio)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    const img = new Image()
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale = natural.w > 0 ? Math.max(FRAME_W / natural.w, FRAME_H / natural.h) : 1
  const scale = baseScale * zoom
  const dispW = natural.w * scale
  const dispH = natural.h * scale

  // Centrar la imagen la primera vez que se conocen sus dimensiones
  useEffect(() => {
    if (natural.w > 0) setPos({ x: (FRAME_W - natural.w * baseScale) / 2, y: (FRAME_H - natural.h * baseScale) / 2 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural.w, natural.h])

  const clamp = useCallback((x: number, y: number, s: number) => {
    const w = natural.w * s, h = natural.h * s
    return {
      x: Math.min(0, Math.max(FRAME_W - w, x)),
      y: Math.min(0, Math.max(FRAME_H - h, y)),
    }
  }, [natural])

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPos(clamp(dragState.current.origX + dx, dragState.current.origY + dy, scale))
  }
  const onPointerUp = () => { dragState.current = null }

  const handleZoom = (newZoom: number) => {
    const z = Math.max(1, Math.min(4, newZoom))
    const newScale = baseScale * z
    // mantener el centro del marco apuntando al mismo punto de la imagen al hacer zoom
    const cx = FRAME_W / 2, cy = FRAME_H / 2
    const imgX = (cx - pos.x) / scale, imgY = (cy - pos.y) / scale
    const newPos = clamp(cx - imgX * newScale, cy - imgY * newScale, newScale)
    setZoom(z)
    setPos(newPos)
  }

  const confirmar = () => {
    if (!imgUrl || natural.w === 0) return
    setBusy(true)
    const img = new Image()
    img.onload = () => {
      const OUT_W = aspectRatio >= 1 ? 640 : Math.round(640 * aspectRatio)
      const OUT_H = Math.round(OUT_W / aspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W
      canvas.height = OUT_H
      const ctx = canvas.getContext('2d')!
      const sx = -pos.x / scale, sy = -pos.y / scale
      const sW = FRAME_W / scale, sH = FRAME_H / scale
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, OUT_W, OUT_H)
      canvas.toBlob(blob => { if (blob) onConfirm(blob); setBusy(false) }, 'image/jpeg', 0.9)
    }
    img.src = imgUrl
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onCancel}>
      <div style={{ background: '#141414', border: '1px solid var(--border-gold)', borderRadius: 14, padding: 24, maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 14, letterSpacing: 0.5 }}>
          Ajustá el encuadre
        </h3>

        <div
          ref={frameRef}
          style={{
            width: FRAME_W, height: FRAME_H, margin: '0 auto', position: 'relative', overflow: 'hidden',
            borderRadius: aspectRatio === 1 ? 12 : 8, border: '1px solid rgba(212,175,55,0.4)',
            cursor: dragState.current ? 'grabbing' : 'grab', background: '#0a0a0a', touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgUrl && natural.w > 0 && (
            <img
              src={imgUrl}
              draggable={false}
              alt=""
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={e => handleZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--gold)' }}
          />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          Arrastrá la imagen para moverla, usá la barra para hacer zoom.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={busy} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: busy ? 'var(--bg-surface)' : 'var(--gold)', color: busy ? 'var(--text-muted)' : '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Aplicando…' : 'Usar esta foto'}
          </button>
        </div>
      </div>
    </div>
  )
}
