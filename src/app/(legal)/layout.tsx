import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #012722; font-family: Inter, sans-serif; }
        .legal-content h2 { font-size: 18px; font-weight: 600; color: #012722; margin: 32px 0 12px; }
        .legal-content h3 { font-size: 15px; font-weight: 600; color: #012722; margin: 24px 0 8px; }
        .legal-content p  { font-size: 14px; color: #4B6358; line-height: 1.8; margin-bottom: 12px; }
        .legal-content ul { padding-left: 20px; margin-bottom: 12px; }
        .legal-content li { font-size: 14px; color: #4B6358; line-height: 1.8; margin-bottom: 4px; }
        .legal-content a  { color: #024f41; text-decoration: underline; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        {/* Navbar minimale */}
        <nav style={{
          borderBottom: '1px solid #E4EEEA', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo-nv.png" alt="NV" style={{ height: 28 }} />
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#4B6358', textDecoration: 'none', fontWeight: 500 }}>
            ← Retour
          </Link>
        </nav>

        {/* Contenu */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 100px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
