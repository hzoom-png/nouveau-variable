export default function SubscribeSuccessPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7FAF8; font-family: Inter, sans-serif; }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes circleDraw {
          from { stroke-dashoffset: 157; }
          to   { stroke-dashoffset: 0; }
        }
        .check-circle { animation: circleDraw .6s ease forwards; }
        .check-path   { animation: checkDraw .4s ease .5s forwards; stroke-dashoffset: 60; }
        .card-wrap    { animation: scaleIn .5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#F7FAF8',
        display:   'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding:   '40px 20px',
      }}>
        <div className="card-wrap" style={{
          background: '#fff', borderRadius: 24,
          border: '1px solid #E4EEEA',
          padding:   '56px 48px',
          maxWidth:  480, width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 32px rgba(47,84,70,.07)',
        }}>
          {/* Logo */}
          <img src="/logo-nv.png" alt="Nouveau Variable"
            style={{ height: 32, marginBottom: 36 }}
          />

          {/* Checkmark animé */}
          <div style={{ marginBottom: 32 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ overflow: 'visible' }}>
              <circle
                className="check-circle"
                cx="36" cy="36" r="25"
                stroke="#024f41" strokeWidth="2.5"
                fill="none"
                strokeDasharray="157"
                strokeLinecap="round"
              />
              <path
                className="check-path"
                d="M24 36l8 8 16-16"
                stroke="#024f41" strokeWidth="2.8"
                fill="none"
                strokeDasharray="60"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Titre */}
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 32,
            color: '#012722', marginBottom: 16, lineHeight: 1.2,
          }}>
            Bienvenue dans le club.
          </h1>

          {/* Corps */}
          <p style={{
            fontSize: 15, color: '#4B6358',
            lineHeight: 1.7, marginBottom: 36,
          }}>
            Ton accès est activé. Connecte-toi avec le numéro de téléphone renseigné
            lors de ta candidature.
          </p>

          {/* CTA */}
          <a
            href="https://app.nouveauvariable.fr/auth"
            style={{
              display:        'inline-block',
              background:     '#024f41',
              color:          '#fff',
              textDecoration: 'none',
              fontFamily:     "'Plus Jakarta Sans', sans-serif",
              fontWeight:     700,
              fontSize:       15,
              padding:        '14px 36px',
              borderRadius:   99,
              transition:     'opacity .2s',
            }}
          >
            Accéder au club →
          </a>

          {/* Note facture */}
          <p style={{ marginTop: 24, fontSize: 12, color: '#9BB5AA' }}>
            Ta facture est disponible dans Dashboard → Billing
          </p>
        </div>
      </div>
    </>
  )
}
