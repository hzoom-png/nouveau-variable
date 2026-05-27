'use client'

export function DealLinkPreview({
  deallink,
  viewMode,
  onViewModeChange,
}: {
  deallink: any
  viewMode: 'mobile' | 'tablet' | 'desktop'
  onViewModeChange: (mode: 'mobile' | 'tablet' | 'desktop') => void
}) {
  const getViewportClass = () => {
    switch (viewMode) {
      case 'mobile':
        return '375px'
      case 'tablet':
        return '768px'
      default:
        return '100%'
    }
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 'var(--r-sm)',
    fontSize: '12px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--green)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text)',
    transition: '.2s',
  })

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onViewModeChange('mobile')}
          style={btnStyle(viewMode === 'mobile')}
        >
          📱 Mobile
        </button>
        <button
          onClick={() => onViewModeChange('tablet')}
          style={btnStyle(viewMode === 'tablet')}
        >
          📱 Tablet
        </button>
        <button
          onClick={() => onViewModeChange('desktop')}
          style={btnStyle(viewMode === 'desktop')}
        >
          💻 Desktop
        </button>
      </div>

      {/* Preview Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: getViewportClass(),
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <iframe
            srcDoc={`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
  <style>
    ${deallink.css_rendered || ''}
  </style>
</head>
<body>
  ${deallink.html_rendered || ''}
</body>
</html>`}
            style={{
              width: '100%',
              minHeight: '800px',
              border: 'none',
              display: 'block',
            }}
            title="Landing page preview"
          />
        </div>
      </div>
    </div>
  )
}
