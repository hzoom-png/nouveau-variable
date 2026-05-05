export default function MissionsPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        width: 56, height: 56,
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24, marginBottom: 20,
      }}>
        🕐
      </div>

      <h1 style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 22, fontWeight: 800,
        color: 'var(--text)', marginBottom: 10,
      }}>
        Missions — Bientôt disponible
      </h1>

      <p style={{
        fontSize: 14, color: 'var(--text-2)',
        lineHeight: 1.7, maxWidth: 380,
      }}>
        Les missions permettront aux membres NV de collaborer sur des projets
        commerciaux ponctuels. Cette fonctionnalité est en cours de construction.
      </p>
    </div>
  )
}
