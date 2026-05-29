'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion, MotionValue, useTransform, useMotionValueEvent } from 'framer-motion'

function randAmount() {
  return Math.floor(Math.random() * (5120 - 38 + 1) + 38)
}

// Durée de l'animation counter (ms)
const COUNTER_DURATION = 700

// Desktop: 7 positions en cercle autour du contenu centré (~27-73% H, 40-60% V)
const DESKTOP_POSITIONS = [
  { left: '50%', top: '9%'  },
  { left: '80%', top: '20%' },
  { left: '88%', top: '48%' },
  { left: '77%', top: '78%' },
  { left: '50%', top: '87%' },
  { left: '23%', top: '78%' },
  { left: '12%', top: '48%' },
]

// Mobile: 3 au-dessus + 4 en-dessous de la card (~43-63% V)
const MOBILE_POSITIONS = [
  { left: '16%', top: '9%'  },
  { left: '50%', top: '9%'  },
  { left: '82%', top: '9%'  },
  { left: '10%', top: '70%' },
  { left: '34%', top: '79%' },
  { left: '66%', top: '79%' },
  { left: '88%', top: '70%' },
]

interface Props {
  opacity: MotionValue<number>
  progress: MotionValue<number>
  isMobile?: boolean
  fadeInStart: number
  fadeInEnd: number
  counterTriggerAt: number
  counterResetAt: number
}

export function VirementNotifications({
  opacity, progress, isMobile = false,
  fadeInStart, fadeInEnd,
  counterTriggerAt, counterResetAt,
}: Props) {
  const amounts = useMemo(() => Array.from({ length: 7 }, randAmount), [])

  // Affichage courant (montants finaux par défaut, counter les remplace)
  const [display, setDisplay] = useState<number[]>(() => [...amounts])

  const rafRef         = useRef<number | null>(null)
  const counterState   = useRef<'idle' | 'running' | 'done'>('idle')
  const startTimeRef   = useRef<number>(0)

  function startCounter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    counterState.current = 'running'
    startTimeRef.current = performance.now()

    function tick() {
      const elapsed = performance.now() - startTimeRef.current
      const t       = Math.min(1, elapsed / COUNTER_DURATION)

      if (t < 0.30) {
        // Phase 1 : scramble rapide (slot machine)
        setDisplay(amounts.map(() => Math.floor(Math.random() * 5120) + 38))
      } else {
        // Phase 2 : compte de 0 → montant final avec easeOut
        const ct    = (t - 0.30) / 0.70
        const eased = 1 - Math.pow(1 - ct, 2.5)
        setDisplay(amounts.map(a => Math.round(a * eased)))
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay([...amounts])
        counterState.current = 'done'
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function resetCounter() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    counterState.current = 'idle'
    setDisplay([...amounts])
  }

  useMotionValueEvent(progress, 'change', (p) => {
    if (p >= counterTriggerAt && counterState.current === 'idle') {
      startCounter()
    } else if (p < counterResetAt && counterState.current !== 'idle') {
      resetCounter()
    }
  })

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const blurRaw = useTransform(progress, [fadeInStart, fadeInEnd], [10, 0])
  const filter  = useTransform(blurRaw, v => `blur(${Math.max(0, v).toFixed(1)}px)`)

  const positions = isMobile ? MOBILE_POSITIONS : DESKTOP_POSITIONS

  return (
    <>
      {display.map((amount, i) => {
        const pos = positions[i]
        return (
          <motion.div
            key={i}
            style={{
              position:      'absolute',
              left:          pos.left,
              top:           pos.top,
              transform:     'translateX(-50%)',
              opacity,
              filter,
              pointerEvents: 'none',
              zIndex:        4,
            }}
          >
            <NotifPill amount={amount} isMobile={isMobile} />
          </motion.div>
        )
      })}
    </>
  )
}

function NotifPill({ amount, isMobile }: { amount: number; isMobile: boolean }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            isMobile ? '7px' : '9px',
      padding:        isMobile ? '6px 12px 6px 10px' : '7px 14px 7px 11px',
      borderRadius:   '99px',
      background:     'rgba(47, 84, 70, 0.06)',
      border:         '1.5px solid rgba(47, 84, 70, 0.18)',
      backdropFilter: 'blur(8px)',
      boxShadow:      '0 2px 8px rgba(47, 84, 70, 0.08)',
      whiteSpace:     'nowrap',
    }}>
      <div style={{
        width:        isMobile ? 5 : 6,
        height:       isMobile ? 5 : 6,
        borderRadius: '50%',
        background:   '#36a64f',
        flexShrink:   0,
      }} />
      <div>
        <div style={{
          fontFamily:    "'Inter', system-ui, sans-serif",
          fontSize:      isMobile ? '8px' : '9px',
          fontWeight:    500,
          color:         '#9BB5AA',
          letterSpacing: '.07em',
          textTransform: 'uppercase',
          lineHeight:    1,
          marginBottom:  '2px',
        }}>
          Virement
        </div>
        <div style={{
          fontFamily:    "'Inter', system-ui, sans-serif",
          fontSize:      isMobile ? '12px' : '13px',
          fontWeight:    700,
          color:         '#2F5446',
          letterSpacing: '-0.01em',
          lineHeight:    1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          +{amount.toLocaleString('fr-FR')}&nbsp;€
        </div>
      </div>
    </div>
  )
}
