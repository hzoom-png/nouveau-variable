'use client'

import { useState } from 'react'

export function DealLinkEditorRight({
  deallink,
}: {
  deallink: any
}) {
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  )

  const widths = {
    mobile: 375,
    tablet: 768,
    desktop: '100%',
  }

  const currentWidth =
    typeof widths[viewMode] === 'number'
      ? `${widths[viewMode]}px`
      : widths[viewMode]

  const html = deallink.html_rendered || ''
  const css = deallink.css_rendered || ''

  const iframeContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${css}
</head>
<body>
${html}
</body>
</html>`

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
      {/* Device Toggle */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
          }}
        >
          Preview:
        </span>
        {(['mobile', 'tablet', 'desktop'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '6px 12px',
              background: viewMode === mode ? 'var(--green)' : 'var(--white)',
              color: viewMode === mode ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: '.2s',
            }}
          >
            {mode === 'mobile' && '📱 Mobile (375px)'}
            {mode === 'tablet' && '📱 Tablet (768px)'}
            {mode === 'desktop' && '🖥️ Desktop'}
          </button>
        ))}
      </div>

      {/* Preview Container */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '24px',
          background: 'var(--surface)',
        }}
      >
        <iframe
          srcDoc={iframeContent}
          style={{
            width: currentWidth,
            height: '100%',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            background: '#fff',
            minHeight: '600px',
          }}
          title="Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
