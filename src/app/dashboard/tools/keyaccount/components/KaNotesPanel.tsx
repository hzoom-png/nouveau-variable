'use client'

import { useState } from 'react'
import { useKaNotes } from '../hooks/useKaNotes'
import { NOTE_TYPE_CONFIG } from '../types'
import type { NoteType } from '../types'
import { formatRelativeDate } from '@/lib/dateUtils'

const NOTE_TYPES: NoteType[] = ['note', 'call', 'email', 'meeting', 'alert']

interface Props {
  accountId: string
  accountName: string
}

export default function KaNotesPanel({ accountId, accountName }: Props) {
  const { notes, loading, addNote, deleteNote } = useKaNotes(accountId)
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('note')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSaving(true)
    await addNote(trimmed, noteType)
    setContent('')
    setSaving(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: '12px' }}>
      {/* Input */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
          Journal — {accountName}
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {NOTE_TYPES.map(t => {
            const cfg = NOTE_TYPE_CONFIG[t]
            const active = noteType === t
            return (
              <button
                key={t}
                onClick={() => setNoteType(t)}
                style={{
                  padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '11px', fontWeight: 600,
                  border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
                  background: active ? cfg.bg : 'var(--white)',
                  color: active ? cfg.color : 'var(--text-3)',
                  cursor: 'pointer', transition: '.12s',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>

        <textarea
          className="finput"
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="Ce qui s'est passé... (⌘↵ pour valider)"
          rows={2}
          style={{ resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: content.length > 450 ? 'var(--amber)' : 'var(--text-3)' }}>
            {content.length}/500
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || saving}
            className="tbtn-primary"
            style={{ padding: '6px 16px', fontSize: '12px', opacity: content.trim() ? 1 : 0.5 }}
          >
            {saving ? '...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-3)' }}>Chargement…</div>
        )}
        {!loading && notes.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Aucune entrée dans le journal.<br />
              <span style={{ fontSize: '12px' }}>Commence par noter ce qui s&apos;est passé.</span>
            </div>
          </div>
        )}
        {notes.map((note, idx) => {
          const cfg = NOTE_TYPE_CONFIG[note.note_type]
          return (
            <div
              key={note.id}
              className="ka-note-row"
              style={{
                padding: '10px 16px',
                borderBottom: idx < notes.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                animation: idx === 0 ? 'card-enter .2s ease-out' : 'none',
              }}
            >
              {/* Type badge */}
              <div style={{
                flexShrink: 0, padding: '2px 7px', borderRadius: 'var(--r-full)',
                background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700,
                marginTop: '1px',
              }}>
                {cfg.label}
              </div>

              {/* Content + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {note.content}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>
                  {formatRelativeDate(note.created_at)}
                </div>
              </div>

              {/* Delete */}
              <button
                className="ka-note-delete"
                onClick={() => deleteNote(note.id)}
                title="Supprimer"
                style={{
                  flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  fontSize: '11px', color: 'var(--text-3)', cursor: 'pointer',
                  display: 'grid', placeItems: 'center', transition: '.14s', opacity: 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
