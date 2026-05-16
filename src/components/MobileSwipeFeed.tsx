'use client'

import { useState, useRef, useCallback } from 'react'

interface MobileSwipeFeedProps<T> {
  items:       T[]
  renderCard:  (item: T, index: number) => React.ReactNode
  total?:      number
  hasMore?:    boolean
  onLoadMore?: () => void
  emptyLabel?: string
}

export default function MobileSwipeFeed<T>({
  items,
  renderCard,
  total,
  hasMore,
  onLoadMore,
  emptyLabel = 'Aucun résultat',
}: MobileSwipeFeedProps<T>) {
  const [index, setIndex]   = useState(0)
  const touchStartY         = useRef(0)
  const animating           = useRef(false)

  const prev = useCallback(() => {
    if (animating.current || index === 0) return
    setIndex(i => i - 1)
  }, [index])

  const next = useCallback(() => {
    if (animating.current) return
    if (index >= items.length - 1) {
      if (hasMore && onLoadMore) onLoadMore()
      return
    }
    setIndex(i => i + 1)
    // Pre-load when near end
    if (hasMore && onLoadMore && index >= items.length - 3) onLoadMore()
  }, [index, items.length, hasMore, onLoadMore])

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.targetTouches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (diff > 50)       next()
    else if (diff < -50) prev()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next()
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prev()
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
        {emptyLabel}
      </div>
    )
  }

  const current     = items[index]
  const displayTotal = total ?? items.length
  const canPrev     = index > 0
  const canNext     = index < items.length - 1 || !!hasMore

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', outline: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Hint swipe */}
      <div style={{
        textAlign: 'center', padding: '6px 0 12px',
        fontSize: 11, color: 'var(--text-3)', letterSpacing: '.04em',
      }}>
        ↑ ↓ swipe pour naviguer
      </div>

      {/* Card */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderCard(current, index)}
      </div>

      {/* Nav bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--white)',
        flexShrink: 0,
        position: 'sticky', bottom: 0,
      }}>
        <button
          onClick={prev}
          disabled={!canPrev}
          style={navBtn(canPrev)}
          aria-label="Précédent"
        >
          ←
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          {index + 1} <span style={{ color: 'var(--text-3)' }}>/ {displayTotal}</span>
        </span>
        <button
          onClick={next}
          disabled={!canNext}
          style={navBtn(canNext)}
          aria-label="Suivant"
        >
          →
        </button>
      </div>
    </div>
  )
}

function navBtn(active: boolean): React.CSSProperties {
  return {
    width: 40, height: 40, borderRadius: '50%',
    border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green)' : 'transparent',
    color: active ? '#fff' : 'var(--text-3)',
    fontSize: 18, cursor: active ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
    flexShrink: 0,
  }
}
