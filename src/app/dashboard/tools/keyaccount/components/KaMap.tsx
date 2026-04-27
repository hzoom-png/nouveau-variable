'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { KaAccount } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { getInitials } from '../meddicc'
import KaNode from './KaNode'

interface Props {
  account: KaAccount
  dispatch: React.Dispatch<KaAction>
  activeContactId: string | null
  onContactClick: (id: string) => void
  newContactId?: string | null
}

interface DragState {
  contactId: string
  offX: number
  offY: number
  startX: number
  startY: number
  moved: boolean
}

export default function KaMap({ account, dispatch, activeContactId: _activeContactId, onContactClick, newContactId }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 700, h: 520 })
  const dragRef = useRef<DragState | null>(null)

  // ResizeObserver
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      if (e) setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    setDims({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  // Drag event listeners on document
  useEffect(() => {
    function onMove(cx: number, cy: number) {
      const drag = dragRef.current
      if (!drag) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const nx = Math.max(40, Math.min(W - 40, cx - rect.left - drag.offX))
      const ny = Math.max(40, Math.min(H - 40, cy - rect.top  - drag.offY))

      // Check if moved
      const dist = Math.hypot(nx - (drag.startX), ny - (drag.startY))
      if (dist > 4) drag.moved = true

      // Move DOM node directly for perf
      const node = canvas.querySelector<HTMLElement>(`#ka-node-${drag.contactId}`)
      if (node) {
        node.style.left = nx + 'px'
        node.style.top  = ny + 'px'
        node.style.cursor = 'grabbing'
        const bubble = node.querySelector<HTMLElement>('.ka-bubble')
        if (bubble) bubble.style.boxShadow = '0 6px 20px rgba(47,84,70,.25)'
      }
      // Move SVG line
      const line = canvas.querySelector<SVGLineElement>(`#ka-line-${drag.contactId}`)
      const CX = W * .5, CY = H * .5
      if (line) { line.setAttribute('x2', String(nx)); line.setAttribute('y2', String(ny)) }

      dragRef.current = { ...drag, moved: dist > 4 }
    }

    function onMouseMove(e: MouseEvent) { onMove(e.clientX, e.clientY) }
    function onTouchMove(e: TouchEvent) { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY) }

    function onUp() {
      const drag = dragRef.current
      if (!drag) return
      const canvas = canvasRef.current
      if (canvas) {
        const node = canvas.querySelector<HTMLElement>(`#ka-node-${drag.contactId}`)
        if (node) {
          node.style.cursor = 'grab'
          const bubble = node.querySelector<HTMLElement>('.ka-bubble')
          if (bubble) bubble.style.boxShadow = ''
          const W = canvas.offsetWidth
          const H = canvas.offsetHeight
          const x = parseFloat(node.style.left) / W
          const y = parseFloat(node.style.top)  / H
          dispatch({ type: 'MOVE_CONTACT', payload: { accountId: account.id, contactId: drag.contactId, x, y } })
        }
      }
      dragRef.current = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchend', onUp)
    }
  }, [account.id, dispatch])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, contactId: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY
    const node = canvas.querySelector<HTMLElement>(`#ka-node-${contactId}`)
    const nodeLeft = node ? parseFloat(node.style.left) : 0
    const nodeTop  = node ? parseFloat(node.style.top)  : 0
    dragRef.current = {
      contactId,
      offX: cx - rect.left - nodeLeft,
      offY: cy - rect.top  - nodeTop,
      startX: nodeLeft,
      startY: nodeTop,
      moved: false,
    }
  }, [])

  const handleContactClick = useCallback((id: string) => {
    const drag = dragRef.current
    // If drag ref is already null (mouseup fired) use moved state before reset
    if (!drag || !drag.moved) {
      onContactClick(id)
    }
  }, [onContactClick])

  const CX = dims.w * .5
  const CY = dims.h * .5

  const hasContacts = account.contacts.length > 0

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '520px',
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* SVG lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      >
        {account.contacts.map(c => {
          const px = c.x * dims.w
          const py = c.y * dims.h
          return (
            <line
              key={c.id}
              id={`ka-line-${c.id}`}
              x1={CX} y1={CY} x2={px} y2={py}
              stroke="#C5DDD5" strokeWidth="1.5" strokeDasharray="5,4"
            />
          )
        })}
      </svg>

      {/* Central account circle */}
      <div style={{
        position: 'absolute', left: CX, top: CY,
        transform: 'translate(-50%, -50%)',
        zIndex: 1, pointerEvents: 'none',
      }}>
        <div style={{
          width: '92px', height: '92px', borderRadius: '50%',
          background: 'var(--green)', border: '3px solid var(--green-2)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2px', boxShadow: '0 4px 16px rgba(47,84,70,.2)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{getInitials(account.name)}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.75)', textAlign: 'center', lineHeight: 1.2, padding: '0 6px' }}>
            {account.name.split(' ')[0]}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{account.val}</div>
        </div>
      </div>

      {/* Contact nodes */}
      {account.contacts.map(c => (
        <KaNode
          key={c.id}
          contact={c}
          px={c.x * dims.w}
          py={c.y * dims.h}
          isNew={c.id === newContactId}
          onDragStart={handleDragStart}
          onClick={handleContactClick}
        />
      ))}

      {/* Empty state — compte créé mais aucun contact */}
      {!hasContacts && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: '70px',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '20px 24px',
          textAlign: 'center',
          maxWidth: '280px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 3,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.6" style={{ margin: '0 auto 10px' }}>
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
            Maintenant, ajoute les personnes clés de ce compte.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Champion, décideur, bloqueur — qui sont les interlocuteurs ?
          </div>
        </div>
      )}
    </div>
  )
}
