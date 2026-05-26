'use client'

import { BADGES, type BadgeId } from '@/lib/badges'

interface UserBadgesGridProps {
  unlockedBadgeIds: BadgeId[]
}

export default function UserBadgesGrid({ unlockedBadgeIds }: UserBadgesGridProps) {
  const badgeKeys = Object.keys(BADGES) as BadgeId[]

  return (
    <div
      style={{
        border: 'var(--border)',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: 'var(--card-bg, #fafbfc)',
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
        Vos Badges ({unlockedBadgeIds.length})
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '16px',
        }}
      >
        {badgeKeys.map(badgeId => {
          const badge = BADGES[badgeId]
          const isUnlocked = unlockedBadgeIds.includes(badgeId)

          return (
            <div
              key={badgeId}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${isUnlocked ? badge.color : 'var(--border)'}`,
                backgroundColor: isUnlocked ? `${badge.color}15` : 'transparent',
                cursor: 'default',
                opacity: isUnlocked ? 1 : 0.5,
                transition: 'all 0.2s ease',
              }}
              title={badge.description}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                {badge.icon}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {badge.name}
              </div>

              {!isUnlocked && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    fontSize: '20px',
                  }}
                >
                  🔒
                </div>
              )}
            </div>
          )
        })}
      </div>

      {unlockedBadgeIds.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0', textAlign: 'center', paddingTop: '20px' }}>
          Commencez à participer pour débloquer vos premiers badges
        </p>
      )}
    </div>
  )
}
