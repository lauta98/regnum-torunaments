'use client'
/** Set de íconos de línea de Comercio — reemplaza los emoji que usaba el
 *  theme original (🔒👤🆓🗑🗡⭐♥📦🔍✕⚔🛡🏹💎💍🔨⛏🏰), mismo estilo de
 *  trazo (stroke-based, viewBox 24x24) que ya usan Header.tsx/TorneoCard.tsx. */
import type { CSSProperties } from 'react'

type IconProps = { size?: number; style?: CSSProperties; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 })

export const IconLock = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconUser = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconTag = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.83.699 2.528 0l7.245-7.245a1.788 1.788 0 0 0 0-2.528L13.432 3.659A2.25 2.25 0 0 0 11.84 3H9.568Z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6.75" cy="6.75" r="0.75" /></svg>
)
export const IconTrash = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconPlus = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconStar = ({ size = 12, style, className, filled = true }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} style={style} className={className}>
    <path d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.385a.562.562 0 0 0-.182-.557L2.043 10.386a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const IconHeart = ({ size = 14, style, className, filled = false }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} style={style} className={className}>
    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const IconPackage = ({ size = 40, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconSearch = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconX = ({ size = 12, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconSword = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconShield = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M12 2.25c3.5 2 6 2.25 7.5 2.25v7.5c0 5.25-4.5 8.25-7.5 9.75-3-1.5-7.5-4.5-7.5-9.75v-7.5c1.5 0 4-.25 7.5-2.25Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconBow = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M15.59 14.37a5 5 0 0 1-.77 6.13l-.72.71a.75.75 0 0 1-1.06 0l-.71-.72a5 5 0 0 1 6.13-.77m-8.98-8.98a5 5 0 0 1 .77-6.13l.72-.71a.75.75 0 0 1 1.06 0l.71.72a5 5 0 0 1-6.13.77m2.12 7.07 4.24-4.24" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconGem = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M4.5 8.25 12 2.25l7.5 6L12 21.75l-7.5-13.5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M4.5 8.25h15M9 8.25 12 2.25l3 6-3 13.5-3-13.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconRing = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><circle cx="12" cy="15" r="6.75" /><path d="M8.5 8.25 12 3l3.5 5.25-3.5 4.5-3.5-4.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconHammer = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="m11.42 15.17 5.83 5.83A2.652 2.652 0 0 0 21 17.25l-5.877-5.877m-3.703 3.797 2.496-3.03a2.44 2.44 0 0 1 1.208-.766m-3.704 3.796-4.655 5.653a2.548 2.652 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconPickaxe = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M5 5c4 0 8.5 2 13 6.5M5 5c0 4 2 8.5 6.5 13M5 5l-2.25 2.25M18 11.5 21.75 19l-2.75 2.75L11.5 18" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconChest = ({ size = 40, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><rect x="3" y="10" width="18" height="10.5" rx="0" /><path d="M3 10a9 5.25 0 0 1 18 0" /><path d="M9 13.5h6M12 13.5v3" strokeLinecap="round" /></svg>
)
export const IconCamera = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M6.827 6.175A2.31 2.31 0 0 1 8.216 5.4l.55-.412c.573-.43 1.298-.663 2.043-.663h2.382c.745 0 1.47.233 2.043.663l.55.412a2.31 2.31 0 0 0 1.389.775c1.171.163 2.077 1.101 2.077 2.286V17.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V8.461c0-1.185.906-2.123 2.077-2.286.288-.04.556-.158.75-.363Z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.25" /></svg>
)
export const IconCoin = ({ size = 13, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={style} className={className}><circle cx="12" cy="12" r="9" /><path d="M9.5 15.5c.5.6 1.3 1 2.3 1 1.7 0 2.7-.9 2.7-2 0-1.3-1.2-1.7-2.7-2.1-1.5-.4-2.7-.9-2.7-2.2 0-1.1 1-2 2.6-2 1 0 1.8.4 2.3 1M12 7.5v9" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
