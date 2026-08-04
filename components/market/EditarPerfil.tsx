'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

export default function EditarPerfil({ profile }: { profile: any }) {
  const [esMio, setEsMio]         = useState(false)
  const [editando, setEditando]   = useState(false)
  const [discord, setDiscord]     = useState(profile.discord || '')
  const [whatsapp, setWhatsapp]   = useState(profile.whatsapp || '')
  const [loading, setLoading]     = useState(false)
  const [ok, setOk]               = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Verificación client-side: evita el problema de cookies en server components
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === profile.id) setEsMio(true)
    })
  }, [profile.id])

  const guardar = async () => {
    setLoading(true)
    await supabase.from('profiles').update({ discord, whatsapp }).eq('id', profile.id)
    setLoading(false)
    setEditando(false)
    setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontFamily: 'inherit', fontSize: 14, outline: 'none',
  }

  // Si no es el dueño, mostrar contacto de solo lectura
  if (!esMio) return (
    <div style={{ marginTop: 4 }}>
      {profile.discord  && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>💬 {profile.discord}</p>}
      {profile.whatsapp && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📱 {profile.whatsapp}</p>}
      {!profile.discord && !profile.whatsapp && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin contacto registrado</p>
      )}
    </div>
  )

  if (!editando) return (
    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {profile.discord  && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>💬 {profile.discord}</span>}
      {profile.whatsapp && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📱 {profile.whatsapp}</span>}
      {!profile.discord && !profile.whatsapp && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin contacto registrado</span>
      )}
      <button onClick={() => setEditando(true)} style={{
        background: 'none', border: '1px solid var(--dark-border)', color: 'var(--text-muted)',
        padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
      }}>
        ✏ Editar contacto
      </button>
      <button onClick={() => window.location.href = '/configuracion'} style={{
        background: 'none', border: '1px solid var(--dark-border)', color: 'var(--text-muted)',
        padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
      }}>
        ⚙ Editar perfil
      </button>
      {ok && <span style={{ fontSize: 12, color: '#5BC98B' }}>✅ Guardado</span>}
    </div>
  )

  return (
    <div style={{ marginTop: 12, background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 8, padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Discord
        </label>
        <input style={inp} placeholder="Ej: usuario#1234 o usuario" value={discord} onChange={e => setDiscord(e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          WhatsApp
        </label>
        <input style={inp} placeholder="Ej: +54 9 11 1234-5678" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={guardar} disabled={loading} style={{
          flex: 1, background: 'linear-gradient(135deg, #1a5c35, #2E7D52)', color: 'white',
          border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer',
          fontFamily: "'Cinzel',serif", fontSize: 12,
        }}>
          {loading ? 'Guardando...' : '✅ Guardar'}
        </button>
        <button onClick={() => setEditando(false)} style={{
          flex: 1, background: 'none', border: '1px solid var(--dark-border)',
          color: 'var(--text-muted)', padding: '8px', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
        }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
