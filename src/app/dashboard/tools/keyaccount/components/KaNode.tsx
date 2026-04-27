'use client'

import { useRef, useEffect } from 'react'
import type { KaContact } from '../types'
import { KA_STYLES, getInitials } from '../meddicc'

interface Props {
  contact: KaContact
  px: number
  py: number
  isNew?: boolean
  onDragStart: (e: React.MouseEvent | React.TouchEvent, contactId: string) => void
  onClick: (contactId: string) => void
}

export default function KaNode({ contact, px, py, isNew, onDragStart, onClick }: Props) {
  const s = KA_STYLES[contact.type]
  const done  = contact.checks.reduce((a, sec) => a + sec.items.filter(i => i.done).length, 0)
  const total = contact.checks.reduce((a, sec) => a + sec.items.length, 0)
  const pct   = total ? Math.round((done / total) * 100) : 0
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew && nodeRef.current) {
      nodeRef.current.style.animation = 'kaNodeIn .3s cubic-bezier(.34,1.56,.64,1) both'
    }
  }, [isNew])

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    onDragStart(e, contact.id)
  }

  function handleTouchStart(e: React.TouchEvent) {
    onDragStart(e, contact.id)
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    onClick(contact.id)
  }

  return (
    <div
      id={`ka-node-${contact.id}`}
      ref={nodeRef}
      className="ka-node"
      style={{
        position: 'absolute',
        left: px,
        top: py,
        transform: 'translate(-50%, -50%)',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: 2,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
        <div style={{
          fontSize: '9px', fontWeight: 600,
          padding: '2px 8px', borderRadius: 'var(--r-full)',
          background: s.bg, color: s.text, border: `1px solid ${s.border}`,
          whiteSpace: 'nowrap',
        }}>
          {s.label}
        </div>
        <div
          className="ka-bubble"
          data-contact-id={contact.id}
          style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: s.bg, border: `2px solid ${s.border}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '2px', transition: 'box-shadow .16s',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: s.text }}>{getInitials(contact.name)}</div>
          <div style={{ fontSize: '9px', color: s.text, opacity: .8, textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>
            {contact.name.split(' ')[0]}
          </div>
          <div className="ka-bubble-pct" style={{ fontSize: '9px', fontWeight: 600, color: s.text }}>{pct}%</div>
        </div>
      </div>
    </div>
  )
}
