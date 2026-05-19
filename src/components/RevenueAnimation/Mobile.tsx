'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ContentPoints } from './components/ContentPoints'
import { CONTENT_POINTS, COLORS } from './constants'

const BAR_HEIGHT = 220

export function Mobile() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  // Bar heights as motion values (0 → 1)
  const grayProgress  = useMotionValue(0)
  const greenProgress = useMotionValue(0)
  const pointsOpacity = useMotionValue(0)

  const grayH  = useTransform(grayProgress,  [0, 1], [0, BAR_HEIGHT * 0.55])
  const greenH = useTransform(greenProgress, [0, 1], [0, BAR_HEIGHT])

  // Point opacities — all shown together after bars
  const pointOps = CONTENT_POINTS.map(() => pointsOpacity as ReturnType<typeof useMotionValue<number>>)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const seq = async () => {
      await animate(grayProgress,  1, { duration: 0.9, ease: 'easeOut', delay: 0.1 })
      await animate(greenProgress, 1, { duration: 1.1, ease: 'easeOut' })
      await animate(pointsOpacity, 1, { duration: 0.6, ease: 'easeOut', delay: 0.3 })
    }
    seq()
  }, [inView])

  return (
    <div ref={sectionRef} style={{ padding: '64px 20px 80px', background: '#ffffff' }}>

      {/* Label */}
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11, fontWeight: 700,
        letterSpacing: '.12em', textTransform: 'uppercase',
        color: COLORS.axis, textAlign: 'center',
        marginBottom: 40,
      }}>
        Ton potentiel de revenus
      </p>

      {/* Two bars comparison */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 48,
        marginBottom: 48,
        height: BAR_HEIGHT + 40,
      }}>
        {/* Gray bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            height: BAR_HEIGHT,
          }}>
            <motion.div style={{
              width: '100%',
              height: grayH,
              background: COLORS.gray,
              borderRadius: '6px 6px 0 0',
              opacity: 0.55,
            }} />
          </div>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11, color: COLORS.axis,
            textAlign: 'center', lineHeight: 1.4, maxWidth: 80,
          }}>
            Sans NV
          </p>
        </div>

        {/* Green bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            height: BAR_HEIGHT,
          }}>
            <motion.div style={{
              width: '100%',
              height: greenH,
              background: COLORS.green,
              borderRadius: '6px 6px 0 0',
              filter: 'drop-shadow(0 0 8px rgba(54,166,79,.6))',
            }} />
          </div>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11, color: COLORS.green,
            fontWeight: 600,
            textAlign: 'center', lineHeight: 1.4, maxWidth: 80,
          }}>
            Avec NV
          </p>
        </div>
      </div>

      {/* 4 content points — appear after bars */}
      <motion.div style={{ opacity: pointsOpacity }}>
        <ContentPoints opacities={pointOps} isMobile />
      </motion.div>

    </div>
  )
}
