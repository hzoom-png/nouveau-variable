export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '860px', animation: 'fadeIn .18s ease' }}>
      <div style={{ height: '32px', width: '220px', borderRadius: 'var(--r-sm)', background: 'var(--border)' }} className="sk" />
      <div style={{ height: '16px', width: '380px', borderRadius: 'var(--r-sm)', background: 'var(--border)' }} className="sk" />
      <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: '140px', borderRadius: 'var(--r-lg)', background: 'var(--border)', opacity: 1 - i * 0.1 }} className="sk" />
        ))}
      </div>
    </div>
  )
}
