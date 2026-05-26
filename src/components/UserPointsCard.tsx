import { getLevelEmoji, getNextMilestone } from '@/lib/points-service'

interface UserPointsCardProps {
  total: number
  lifetime: number
  history: Array<{
    id: string
    points_earned: number
    action: string
    created_at: string
  }>
}

export default function UserPointsCard({
  total,
  lifetime,
  history,
}: UserPointsCardProps) {
  const nextMilestone = getNextMilestone(lifetime)
  const progressPercent = Math.min(100, (lifetime / nextMilestone) * 100)
  const levelEmoji = getLevelEmoji(lifetime)

  return (
    <div
      style={{
        border: 'var(--border)',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: 'var(--card-bg, #fafbfc)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '32px' }}>{levelEmoji}</span>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
            Vos Points
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {total} points disponibles
          </p>
        </div>
      </div>

      {/* Progress bar to next milestone */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Prochain palier: {nextMilestone} pts
          </span>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--green)' }}>
            {lifetime} / {nextMilestone}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--border)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--green)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Recent history */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Activités récentes
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {history.slice(0, 5).map(entry => (
            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {entry.action.replace(/_/g, ' ')}
              </span>
              <span style={{ fontWeight: '600', color: 'var(--green)' }}>
                +{entry.points_earned}
              </span>
            </div>
          ))}
          {history.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0' }}>
              Pas d'activité récente
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
