'use client'
/** Íconos de línea compartidos por los componentes de acción del panel
 *  de administrador — reemplaza el emoji que usaban (🔒🗑️✓✗✅). */
import type { CSSProperties } from 'react'

type IconProps = { size?: number; style?: CSSProperties }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 })

export const IconLock = ({ size = 11, style }: IconProps) => (
  <svg {...base(size)} style={style}><path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconTrash = ({ size = 12, style }: IconProps) => (
  <svg {...base(size)} style={style}><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconCheck = ({ size = 12, style }: IconProps) => (
  <svg {...base(size)} style={style} strokeWidth={2.4}><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconX = ({ size = 12, style }: IconProps) => (
  <svg {...base(size)} style={style} strokeWidth={2.4}><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" /></svg>
)
export const IconCheckCircle = ({ size = 13, style }: IconProps) => (
  <svg {...base(size)} style={style}><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
