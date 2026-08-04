'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_by_other: boolean
  sender: { username: string } | null
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  if (diffDays === 0) return `${hh}:${mm}`
  if (diffDays === 1) return `ayer ${hh}:${mm}`
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${MESES[d.getMonth()]} ${hh}:${mm}`
}

interface ChatBoxProps {
  transactionId: string
  userId: string
  otherUsername: string
  unreadCount?: number
  onRead?: () => void
}

export default function ChatBox({ transactionId, userId, otherUsername, unreadCount = 0, onRead }: ChatBoxProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [localUnread, setLocalUnread] = useState(unreadCount)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Cargar mensajes al abrir
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/messages?transaction_id=${transactionId}`)
      .then(r => r.json())
      .then(({ messages: msgs }) => {
        setMessages(msgs ?? [])
        setLoading(false)
        setLocalUnread(0)
        onRead?.()
      })
  }, [open, transactionId])

  // Scroll al último mensaje
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [messages, open])

  // Suscripción realtime
  useEffect(() => {
    if (!open) return

    const channel = supabase
      .channel(`messages:${transactionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `transaction_id=eq.${transactionId}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => {
          // No duplicar si ya lo enviamos nosotros
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Si es del otro, marcar como leído vía fetch (ya lo hace el GET, pero actualizamos UI)
        if (msg.sender_id !== userId) {
          fetch(`/api/messages?transaction_id=${transactionId}`).catch(() => {})
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open, transactionId, userId])

  // Recibir nuevos mensajes cuando está cerrado → sumar al badge
  useEffect(() => {
    if (open) return

    const channel = supabase
      .channel(`messages-badge:${transactionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `transaction_id=eq.${transactionId}`,
      }, payload => {
        const msg = payload.new as Message
        if (msg.sender_id !== userId) {
          setLocalUnread(prev => prev + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open, transactionId, userId])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')

    const res = await fetch('/api/market/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, content: text }),
    })
    const { message } = await res.json()
    if (message) {
      setMessages(prev => [...prev.filter(m => m.id !== message.id), message])
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: '1px solid var(--dark-border)',
          color: 'var(--text-muted)', padding: '5px 12px', borderRadius: 6,
          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          position: 'relative',
        }}
      >
        💬 Chat con {otherUsername}
        {localUnread > 0 && !open && (
          <span style={{
            background: '#EF4444', color: 'white',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {localUnread > 9 ? '9+' : localUnread}
          </span>
        )}
        <span style={{ fontSize: 10, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Panel del chat */}
      {open && (
        <div style={{
          marginTop: 8, border: '1px solid var(--dark-border)',
          borderRadius: 8, overflow: 'hidden',
          background: 'var(--dark-surface)',
        }}>
          {/* Mensajes */}
          <div style={{
            height: 220, overflowY: 'auto', padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
                Cargando...
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', fontStyle: 'italic' }}>
                Sin mensajes. ¡Empezá la conversación!
              </div>
            )}
            {messages.map(m => {
              const isMe = m.sender_id === userId
              return (
                <div key={m.id} style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: 6, alignItems: 'flex-end',
                }}>
                  <div style={{
                    maxWidth: '75%',
                    background: isMe ? 'rgba(201,168,76,0.15)' : 'var(--dark-card)',
                    border: `1px solid ${isMe ? 'rgba(201,168,76,0.3)' : 'var(--dark-border)'}`,
                    borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    padding: '6px 10px',
                  }}>
                    {!isMe && (
                      <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 2, fontFamily: "'Cinzel',serif" }}>
                        {m.sender?.username}
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word', margin: 0 }}>
                      {m.content}
                    </p>
                    <div style={{
                      fontSize: 10, color: 'var(--dark-border)',
                      marginTop: 4, textAlign: isMe ? 'right' : 'left',
                      display: 'flex', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start',
                      alignItems: 'center',
                    }}>
                      {timeLabel(m.created_at)}
                      {isMe && (
                        <span style={{ color: m.read_by_other ? '#5BC98B' : 'var(--dark-border)' }}>
                          {m.read_by_other ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid var(--dark-border)',
            padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribí un mensaje... (Enter para enviar)"
              maxLength={500}
              rows={1}
              style={{
                flex: 1, background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: 13, outline: 'none',
                resize: 'none', lineHeight: 1.4, maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              style={{
                background: draft.trim() ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))' : 'var(--dark-card)',
                color: draft.trim() ? 'var(--dark-bg)' : 'var(--dark-border)',
                border: 'none', borderRadius: 6, padding: '7px 14px',
                cursor: draft.trim() ? 'pointer' : 'default',
                fontSize: 16, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {sending ? '…' : '➤'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
