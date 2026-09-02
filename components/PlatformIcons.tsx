type IconProps = { size?: number }

export function YoutubeIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z"/>
    </svg>
  )
}

export function TwitchIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#a970ff">
      <path d="M4.3 2 2 7.1v13.4h5.1V23l3.4-2.5h4.3L21.5 14V2H4.3Zm15 11.1-3.4 3.4H12l-3 3v-3H4.9V4.3h14.4v8.8Z"/>
      <path d="M14.7 7.5h1.9v5.2h-1.9zM9.5 7.5h1.9v5.2H9.5z"/>
    </svg>
  )
}

export function KickIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#53FC18">
      <path d="M2 2h6v5h2V5h2V3h2V1h6v6h-2v2h-2v2h-2v2h2v2h2v2h2v6h-6v-2h-2v-2h-2v-2h-2v5H2V2Z"/>
    </svg>
  )
}
